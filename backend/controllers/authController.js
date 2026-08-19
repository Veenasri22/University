import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';
import { supabase } from '../config/db.js';

export const register = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    let user = null;

    if (supabase) {
      // 1. Register with Supabase Auth
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

        if (!signUpError && signUpData?.user) {
          user = signUpData.user;
        }
      }

      // 2. Fetch or insert profile in 'profiles' table (clean columns only)
      let profile = null;
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        profile = p;
      }

      if (!profile) {
        const profilePayload = {
          email: validated.email,
          full_name: validated.full_name,
          role: validated.role,
          avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`
        };
        if (user?.id) profilePayload.id = user.id;

        const { data: newProfile, error: profErr } = await supabase
          .from('profiles')
          .insert(profilePayload)
          .select()
          .single();

        if (!profErr) {
          profile = newProfile;
        } else {
          console.error('[Auth] Profile creation warning:', profErr.message);
        }
      }

      const activeUserId = profile?.id || user?.id || null;

      // 3. If role is STUDENT, create student record in Supabase 'students' table
      if (validated.role === 'STUDENT') {
        const studentCode = `STU-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const studentPayload = {
          ...(activeUserId && { user_id: activeUserId }),
          student_id_number: studentCode,
          course: validated.department || 'B.Tech Computer Science',
          cgpa: 3.20,
          current_risk_level: 'LOW',
          status: 'ACTIVE'
        };

        const { data: stuData, error: stuErr } = await supabase
          .from('students')
          .insert(studentPayload)
          .select('*, profiles(full_name, email)')
          .single();

        if (stuErr) {
          console.error('[Auth] Student table creation error:', stuErr.message);
        } else {
          console.log('[Auth] Successfully created student record in Supabase DB:', stuData.id);
        }
      }

      const token = jwt.sign(
        {
          id: activeUserId || `user-${Date.now()}`,
          email: validated.email,
          role: validated.role,
          department: validated.department || 'Computer Science',
          full_name: validated.full_name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully in Supabase',
        token,
        user: profile || {
          id: activeUserId,
          email: validated.email,
          full_name: validated.full_name,
          role: validated.role,
          department: validated.department || 'Computer Science'
        }
      });
    }

    return res.status(500).json({ success: false, message: 'Supabase client unconfigured' });
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

      // 2. Query 'profiles' table directly by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', validated.email)
        .maybeSingle();

      if (profile) {
        const token = jwt.sign(
          { id: profile.id, email: profile.email, role: profile.role, department: profile.department || 'Computer Science', full_name: profile.full_name },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          message: 'Login successful',
          token,
          user: profile
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .maybeSingle();

      if (profile) {
        return res.json({ success: true, user: profile });
      }
    }

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
