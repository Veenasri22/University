import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';
import { supabase } from '../config/db.js';

export const register = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    if (supabase) {
      let user = null;

      // Try creating user via Admin API
      const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
        email: validated.email,
        password: validated.password,
        email_confirm: true,
        user_metadata: {
          full_name: validated.full_name,
          role: validated.role,
          department: validated.department || 'Computer Science'
        }
      });

      if (!adminError && adminData?.user) {
        user = adminData.user;
      } else {
        // Fallback to standard signUp
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            data: {
              full_name: validated.full_name,
              role: validated.role,
              department: validated.department || 'Computer Science'
            }
          }
        });

        if (signUpError) {
          return res.status(400).json({ success: false, message: signUpError.message });
        }
        user = signUpData.user;
      }

      if (!user) {
        return res.status(400).json({ success: false, message: 'User registration failed' });
      }

      // Fetch or insert profile in Supabase 'profiles' table
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        const password_hash = await bcrypt.hash(validated.password, 10);
        const { data: newProfile, error: profileErr } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: validated.email,
            password_hash,
            full_name: validated.full_name,
            role: validated.role,
            department: validated.department || 'Computer Science'
          })
          .select()
          .single();

        if (profileErr) {
          console.error('[Auth] Profile creation error:', profileErr.message);
        } else {
          profile = newProfile;
        }
      }

      // If registered user is a student, ensure student record exists in Supabase 'students'
      if (validated.role === 'STUDENT') {
        await supabase
          .from('students')
          .upsert({
            id: `stu-${Date.now().toString().slice(-4)}`,
            user_id: user.id,
            student_code: `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
            full_name: validated.full_name,
            email: validated.email,
            department: validated.department || 'Computer Science',
            enrollment_year: 2026,
            current_gpa: 3.20,
            attendance_rate: 90.0,
            credits_earned: 0,
            credits_required: 120,
            predicted_risk: 'LOW',
            status: 'ACTIVE',
            gpa_history: [{ term: 'Fall 2026', gpa: 3.20 }]
          }, { onConflict: 'email' });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: validated.role,
          department: validated.department || 'Computer Science',
          full_name: validated.full_name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: profile || {
          id: user.id,
          email: user.email,
          full_name: validated.full_name,
          role: validated.role,
          department: validated.department || 'Computer Science'
        }
      });
    }

    // Direct Supabase table insert fallback if Auth service is disabled
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validated.email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered' });
    }

    const password_hash = await bcrypt.hash(validated.password, 10);
    const userId = `prof-${Date.now().toString().slice(-4)}`;
    
    const { data: newProfile, error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: validated.email,
        password_hash,
        full_name: validated.full_name,
        role: validated.role,
        department: validated.department || 'Computer Science',
        avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`
      })
      .select()
      .single();

    if (insertErr) {
      return res.status(500).json({ success: false, message: insertErr.message });
    }

    if (validated.role === 'STUDENT') {
      await supabase.from('students').insert({
        id: `stu-${Date.now().toString().slice(-4)}`,
        user_id: newProfile.id,
        student_code: `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
        full_name: newProfile.full_name,
        email: newProfile.email,
        department: newProfile.department,
        enrollment_year: 2026,
        current_gpa: 3.20,
        attendance_rate: 90.0,
        credits_earned: 0,
        credits_required: 120,
        predicted_risk: 'LOW',
        status: 'ACTIVE',
        gpa_history: [{ term: 'Fall 2026', gpa: 3.20 }]
      });
    }

    const token = jwt.sign(
      { id: newProfile.id, email: newProfile.email, role: newProfile.role, department: newProfile.department, full_name: newProfile.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: newProfile
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    if (supabase) {
      // 1. Try Supabase Auth signInWithPassword
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password
      });

      if (!authErr && authData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const userRole = profile?.role || authData.user.user_metadata?.role || 'STUDENT';
        const userDept = profile?.department || authData.user.user_metadata?.department || 'Computer Science';
        const userName = profile?.full_name || authData.user.user_metadata?.full_name || userRole;

        const token = jwt.sign(
          { id: authData.user.id, email: authData.user.email, role: userRole, department: userDept, full_name: userName },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: profile || {
            id: authData.user.id,
            email: authData.user.email,
            full_name: userName,
            role: userRole,
            department: userDept
          }
        });
      }
    }

    // 2. Query 'profiles' table in Supabase directly
    let profile = null;
    if (supabase) {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', validated.email)
        .maybeSingle();
      if (p) profile = p;
    }

    if (profile) {
      let isMatch = true;
      if (profile.password_hash) {
        isMatch = await bcrypt.compare(validated.password, profile.password_hash);
      }

      if (isMatch) {
        const token = jwt.sign(
          { id: profile.id, email: profile.email, role: profile.role, department: profile.department || 'Computer Science', full_name: profile.full_name },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        const { password_hash: _, ...userWithoutPass } = profile;
        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: userWithoutPass
        });
      }
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (supabase) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .maybeSingle();

      if (profile) {
        const { password_hash: _, ...userWithoutPass } = profile;
        return res.json({ success: true, user: userWithoutPass });
      }
    }

    // Fallback to token payload data if profile row was removed
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
        department: req.user.department
      }
    });
  } catch (err) {
    next(err);
  }
};
