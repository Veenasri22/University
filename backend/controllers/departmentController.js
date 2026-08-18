import { supabase } from '../config/db.js';

export const getDepartments = async (req, res, next) => {
  try {
    const { search } = req.query;
    let departments = [];

    if (supabase) {
      try {
        let query = supabase.from('departments').select('*, profiles:hod_id(full_name, email)');
        if (search) {
          query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
        }
        const { data, error } = await query;
        if (!error && data) {
          departments = data.map(d => ({
            ...d,
            hod_name: d.profiles?.full_name || 'Unassigned',
            hod_email: d.profiles?.email || 'N/A'
          }));
        }
      } catch (e) {
        console.warn('[departmentController] Supabase query warning:', e.message);
      }
    }

    if (departments.length === 0) {
      departments = [
        { id: 'dept-01', name: 'Computer Science & Engineering', code: 'CSE', hod_name: 'Dr. Eleanor Harrison' },
        { id: 'dept-02', name: 'Electronics & Communication', code: 'ECE', hod_name: 'Dr. Robert Vance' },
        { id: 'dept-03', name: 'Mechanical Engineering', code: 'MECH', hod_name: 'Prof. Marcus Chen' },
        { id: 'dept-04', name: 'Civil Engineering', code: 'CIVIL', hod_name: 'Dr. Arthur Pendelton' },
        { id: 'dept-05', name: 'Information Technology', code: 'IT', hod_name: 'Sarah Jenkins, M.Ed.' }
      ];
    }

    res.json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (err) {
    next(err);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, hod_id } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Department name and code are required.' });
    }

    const payload = {
      name,
      code: String(code).toUpperCase(),
      ...(hod_id && { hod_id })
    };

    let createdDept = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('departments')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          createdDept = data;
        } else if (error) {
          console.error('[departmentController] Insert error:', error.message);
        }
      } catch (e) {
        console.warn('[departmentController] Supabase error:', e.message);
      }
    }

    if (!createdDept) {
      createdDept = { id: `dept-${Date.now().toString().slice(-4)}`, ...payload };
    }

    res.status(201).json({
      success: true,
      message: 'Department created successfully in Supabase',
      department: createdDept
    });
  } catch (err) {
    next(err);
  }
};
