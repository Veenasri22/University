import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../services/supabaseClient.js';
import { updateProfile, updateUserPreferences, getDirtyFields } from '../services/updateService.js';
import {
  UserCheck,
  Shield,
  Mail,
  Building,
  Bell,
  Save,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Edit3,
  Camera,
  Radio
} from 'lucide-react';

export const Profile = () => {
  const { user, setUser } = useAuth();

  // Baseline snapshots fetched from Supabase (for dirty tracking)
  const [originalProfile, setOriginalProfile] = useState(null);
  const [originalPrefs, setOriginalPrefs] = useState(null);

  // Form States
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    department: 'Computer Science',
    avatar_url: ''
  });

  const [prefForm, setPrefForm] = useState({
    attendanceWarnings: true,
    riskEscalations: true,
    weeklyDigest: false
  });

  // UI Feedback States
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState(null);
  const [prefSuccess, setPrefSuccess] = useState(null);

  const [profileError, setProfileError] = useState(null);
  const [prefError, setPrefError] = useState(null);

  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Channel reference for cleanup
  const channelRef = useRef(null);

  // 1. Initial Data Fetch & Baseline Setup
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user) return;
      setLoading(true);

      const userId = user.id;

      // Fetch Profile from Supabase
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // Fetch Preferences from Supabase
      const { data: prefData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (isMounted) {
        const initialProf = {
          full_name: profData?.full_name || user.full_name || '',
          department: profData?.department || user.department || 'Computer Science',
          avatar_url: profData?.avatar_url || user.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
        };

        const initialPreferences = {
          attendanceWarnings: prefData?.attendance_warnings ?? true,
          riskEscalations: prefData?.risk_escalations ?? true,
          weeklyDigest: prefData?.weekly_digest ?? false
        };

        setOriginalProfile(initialProf);
        setProfileForm(initialProf);

        setOriginalPrefs(initialPreferences);
        setPrefForm(initialPreferences);

        setLastSyncTime(new Date());
        setLoading(false);
      }
    }

    loadData();

    // 2. Supabase Realtime Channel Subscription for Multi-Tab Sync
    if (user?.id) {
      const channel = supabase
        .channel(`public:profiles:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            console.log('[Supabase Realtime] Profile update received:', payload.new);
            const updated = {
              full_name: payload.new.full_name,
              department: payload.new.department,
              avatar_url: payload.new.avatar_url
            };
            setOriginalProfile(updated);
            setProfileForm(updated);
            setLastSyncTime(new Date());

            // Sync global AuthContext state
            if (setUser) {
              setUser(prev => ({ ...prev, ...updated }));
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_preferences', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.new) {
              const updatedPrefs = {
                attendanceWarnings: payload.new.attendance_warnings,
                riskEscalations: payload.new.risk_escalations,
                weeklyDigest: payload.new.weekly_digest
              };
              setOriginalPrefs(updatedPrefs);
              setPrefForm(updatedPrefs);
              setLastSyncTime(new Date());
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') setRealtimeConnected(true);
        });

      channelRef.current = channel;
    }

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user]);

  // Compute Dirty (Modified) Fields
  const profileDirtyInfo = getDirtyFields(originalProfile, profileForm);
  const prefDirtyInfo = getDirtyFields(originalPrefs, prefForm);

  const isProfileDirty = profileDirtyInfo.dirtyFields.length > 0;
  const isPrefDirty = prefDirtyInfo.dirtyFields.length > 0;

  // 3. Profile Form Submission Handler with Optimistic UI & Revert
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!isProfileDirty || savingProfile || !user) return;

    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    // Backup baseline for optimistic rollback
    const backupProfile = { ...originalProfile };
    const optimisticState = { ...profileForm };

    // Optimistic UI Update: Instantly reflect local changes
    setOriginalProfile(optimisticState);
    if (setUser) setUser(prev => ({ ...prev, ...optimisticState }));

    const result = await updateProfile(user.id, profileForm, backupProfile);

    setSavingProfile(false);

    if (result.success) {
      setProfileSuccess(`Profile updated successfully (${result.dirtyFields.join(', ')})`);
      setOriginalProfile(profileForm);
      setLastSyncTime(new Date());

      setTimeout(() => setProfileSuccess(null), 4000);
    } else {
      // Revert optimistic update on failure
      setOriginalProfile(backupProfile);
      setProfileForm(backupProfile);
      if (setUser) setUser(prev => ({ ...prev, ...backupProfile }));

      setProfileError(result.error?.message || 'Failed to update profile. Changes reverted.');
    }
  };

  // 4. Preferences Submission Handler with Optimistic UI & Revert
  const handlePrefSubmit = async (e) => {
    e.preventDefault();
    if (!isPrefDirty || savingPrefs || !user) return;

    setSavingPrefs(true);
    setPrefError(null);
    setPrefSuccess(null);

    const backupPrefs = { ...originalPrefs };
    const optimisticPrefs = { ...prefForm };

    // Optimistic UI update
    setOriginalPrefs(optimisticPrefs);

    const result = await updateUserPreferences(user.id, prefForm, backupPrefs);

    setSavingPrefs(false);

    if (result.success) {
      setPrefSuccess('Notification preferences saved to Supabase');
      setOriginalPrefs(prefForm);
      setLastSyncTime(new Date());

      setTimeout(() => setPrefSuccess(null), 4000);
    } else {
      // Revert on failure
      setOriginalPrefs(backupPrefs);
      setPrefForm(backupPrefs);

      setPrefError(result.error?.message || 'Failed to save preferences. Changes reverted.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold">Loading profile data from Supabase…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header with Realtime Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-500" />
            User Credentials & Account Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your personal profile, department affiliation, and reactive notification parameters.
          </p>
        </div>

        {/* Supabase Realtime Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300">
          <Radio className={`w-3.5 h-3.5 ${realtimeConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span>{realtimeConnected ? 'Supabase Realtime Live' : 'Polling Sync'}</span>
          {lastSyncTime && (
            <span className="text-[10px] text-slate-500 ml-1">
              ({lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
            </span>
          )}
        </div>
      </div>

      {/* User Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex items-center gap-5">
        <div className="relative group">
          <img
            src={profileForm.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
            alt={profileForm.full_name}
            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-500/40 shadow-xl"
          />
          <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white font-outfit">{profileForm.full_name || user?.full_name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Role: {user?.role || 'FACULTY'}
            </span>
          </div>

          <p className="text-xs text-blue-400 font-semibold mt-0.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {user?.email}
          </p>

          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span>Department: <strong className="text-slate-200">{profileForm.department}</strong></span>
          </div>
        </div>
      </div>

      {/* 1. Profile Information Edit Form */}
      <form onSubmit={handleProfileSubmit} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-400" />
            Edit Profile Information
          </h3>

          {isProfileDirty && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse">
              Unsaved Changes ({profileDirtyInfo.dirtyFields.join(', ')})
            </span>
          )}
        </div>

        {profileSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5">Full Name</label>
            <input
              type="text"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Dr. Eleanor Harrison"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1.5">Academic Department</label>
            <select
              value={profileForm.department}
              onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="Computer Science">Computer Science & Engineering</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Life Sciences">Life Sciences</option>
              <option value="Humanities">Humanities</option>
              <option value="University Administration">University Administration</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-slate-400 font-semibold mb-1.5">Avatar Image URL</label>
            <input
              type="url"
              value={profileForm.avatar_url}
              onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          {isProfileDirty && (
            <button
              type="button"
              onClick={() => setProfileForm(originalProfile)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              disabled={savingProfile}
            >
              Reset Changes
            </button>
          )}

          <button
            type="submit"
            disabled={!isProfileDirty || savingProfile}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all ${
              !isProfileDirty || savingProfile
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            {savingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Supabase…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 2. Automated Notification Preferences Form */}
      <form onSubmit={handlePrefSubmit} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-400" />
            Automated Notification Preferences
          </h3>

          {isPrefDirty && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse">
              Unsaved Preferences
            </span>
          )}
        </div>

        {prefSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{prefSuccess}</span>
          </div>
        )}

        {prefError && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{prefError}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div>
              <div className="font-bold text-white">Attendance Threshold Alerts (&lt;75%)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Receive instant email dispatches when student attendance drops below institutional threshold</div>
            </div>
            <input
              type="checkbox"
              checked={prefForm.attendanceWarnings}
              onChange={(e) => setPrefForm({ ...prefForm, attendanceWarnings: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded bg-slate-950 border-slate-700 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div>
              <div className="font-bold text-white">Predictive Risk Trajectory Escalations</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Alert advisors when Gemini AI model recalculates a student to HIGH Academic Risk</div>
            </div>
            <input
              type="checkbox"
              checked={prefForm.riskEscalations}
              onChange={(e) => setPrefForm({ ...prefForm, riskEscalations: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded bg-slate-950 border-slate-700 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <div>
              <div className="font-bold text-white">Weekly Executive Academic Summary Digest</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Synthesized department performance reports delivered every Monday morning</div>
            </div>
            <input
              type="checkbox"
              checked={prefForm.weeklyDigest}
              onChange={(e) => setPrefForm({ ...prefForm, weeklyDigest: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded bg-slate-950 border-slate-700 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          {isPrefDirty && (
            <button
              type="button"
              onClick={() => setPrefForm(originalPrefs)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              disabled={savingPrefs}
            >
              Reset Preferences
            </button>
          )}

          <button
            type="submit"
            disabled={!isPrefDirty || savingPrefs}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all ${
              !isPrefDirty || savingPrefs
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            {savingPrefs ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Preferences…</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Notification Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
