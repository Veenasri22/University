import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mockStore } from '../services/mockStore.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

export const register = async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = mockStore.profiles.find(p => p.email.toLowerCase() === validated.email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered' });
    }

    const password_hash = await bcrypt.hash(validated.password, 10);
    const newProfile = {
      id: `prof-${Date.now().toString().slice(-4)}`,
      email: validated.email,
      password_hash,
      full_name: validated.full_name,
      role: validated.role,
      department: validated.department || 'Computer Science',
      avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      created_at: new Date().toISOString()
    };

    mockStore.profiles.push(newProfile);

    // If role is STUDENT, also create student record
    if (validated.role === 'STUDENT') {
      mockStore.students.push({
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

    const { password_hash: _, ...userWithoutPass } = newProfile;

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: userWithoutPass
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    const user = mockStore.profiles.find(p => p.email.toLowerCase() === validated.email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(validated.password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, department: user.department, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password_hash: _, ...userWithoutPass } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPass
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = mockStore.profiles.find(p => p.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    const { password_hash: _, ...userWithoutPass } = user;
    res.json({ success: true, user: userWithoutPass });
  } catch (err) {
    next(err);
  }
};
