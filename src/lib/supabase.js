import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Initialize Supabase client with explicit persistence settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// --- Database Helper Functions ---

export const loginStudent = async (username, password) => {
  try {
    // We map 'username' (which is actually Roll No) to an email format for Supabase Auth
    // E.g. '1001' becomes '1001@siddhartha.edu', 'admin' becomes 'admin@siddhartha.edu'
    // If the user already types the full email (e.g., 'teacher2@siddhartha.edu'), we use it as is.
    const email = username.includes('@') 
      ? username.toLowerCase() 
      : `${username.toLowerCase()}@siddhartha.edu`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      throw new Error('Invalid Roll Number or Password');
    }
    
    return data;
  } catch (error) {
    console.error('Error logging in:', error.message);
    throw error;
  }
};

export const logoutStudent = async () => {
  await supabase.auth.signOut();
};

export const getStudentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getStudentDashboardData = async () => {
  try {
    const session = await getStudentSession();
    if (!session) return { data: null, error: 'Not authenticated' };

    // Since RLS is now based on auth_user_id = auth.uid(), we can just select all 
    // and Supabase will automatically filter it to ONLY this student's row.
    const { data: profileData, error: profileError } = await supabase
      .from('students')
      .select('*')
      .single();

    if (profileError) throw profileError;

    const { data: marksData, error: marksError } = await supabase
      .from('student_marks')
      .select('*')
      .eq('student_id', profileData.id);

    if (marksError) throw marksError;

    return { profile: profileData, marks: marksData || [] };
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message);
    throw error;
  }
};

export const adminBulkInsertStudents = async (studentsArray) => {
  try {
    // Supabase insert supports an array of objects for bulk insert
    // 'upsert' can be used if we want to overwrite existing matching usernames,
    // or 'insert' to just add them. Let's use insert but we can handle duplicates via ON CONFLICT if needed,
    // though the default js client `.insert()` might fail if a unique constraint (like username) is violated.
    // To keep it simple and robust, we'll try to insert them.
    const { data, error } = await supabase
      .from('students')
      .insert(studentsArray)
      .select();

    if (error) {
      throw error;
    }

    return { success: true, count: data?.length || 0, data };
  } catch (error) {
    console.error('Error in bulk insert:', error.message);
    throw error;
  }
};

export const adminBulkInsertMarks = async (marksArray) => {
  try {
    const { data, error } = await supabase
      .from('student_marks')
      .insert(marksArray)
      .select();

    if (error) {
      throw error;
    }

    return { success: true, count: data?.length || 0, data };
  } catch (error) {
    console.error('Error in bulk insert marks:', error.message);
    throw error;
  }
};

// --- Fees Management Helper Functions ---

export const recordFeePayment = async (studentId, amount, currentPending, paymentType = 'Standard') => {
  try {
    // 1. Insert payment record
    const { error: insertError } = await supabase
      .from('fee_payments')
      .insert([{ student_id: studentId, amount: amount, payment_type: paymentType }]);

    if (insertError) throw insertError;

    // 2. Update student pending fees
    const newPending = Math.max(0, currentPending - amount);
    const { error: updateError } = await supabase
      .from('students')
      .update({ pending_fees: newPending })
      .eq('id', studentId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error recording fee payment:', error.message);
    throw error;
  }
};

export const getStudentPayments = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from('fee_payments')
      .select('*')
      .eq('student_id', studentId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payments:', error.message);
    throw error;
  }
};

export const getAdminFeesData = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, roll_number, class, section, total_fees, pending_fees')
      .order('class', { ascending: true })
      .order('roll_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching admin fees data:', error.message);
    throw error;
  }
};

export const getAllStudentsInfo = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('class', { ascending: true })
      .order('roll_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all students info:', error.message);
    throw error;
  }
};

// --- RBAC Profile Management ---

export const getAllProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('email', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching profiles:', error.message);
    throw error;
  }
};

export const updateProfileRole = async (profileId, newRole) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile role:', error.message);
    throw error;
  }
};

export const toggleProfileStatus = async (profileId, isActive) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', profileId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error toggling profile status:', error.message);
    throw error;
  }
};

export const updateStudentDetails = async (studentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating student details:', error.message);
    throw error;
  }
};

export const deleteStudent = async (studentId) => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
      
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error.message);
    throw error;
  }
};

export const bulkPromoteStudents = async (promotionsArray) => {
  try {
    let successCount = 0;
    let errors = [];

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < promotionsArray.length; i += batchSize) {
      const batch = promotionsArray.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (student) => {
        try {
          const { roll_number, class: newClass, total_fees } = student;
          const newTotalFees = parseInt(total_fees, 10) || 0;
          
          // Fetch existing to get ID and current pending fees
          const { data: existing, error: fetchErr } = await supabase
            .from('students')
            .select('id, pending_fees')
            .eq('roll_number', roll_number)
            .single();
            
          if (fetchErr) throw fetchErr;
          
          // Delete offline marks (FA1, SA1, etc)
          await supabase.from('student_marks').delete().eq('student_id', existing.id);
          
          // Delete online exam results
          await supabase.from('student_exam_results').delete().eq('student_id', existing.id);
          
          const previousDues = existing.pending_fees > 0 ? existing.pending_fees : 0;
          const newPendingFees = previousDues + newTotalFees;

          const { error } = await supabase
            .from('students')
            .update({ 
              class: newClass, 
              total_fees: newTotalFees, 
              previous_dues: previousDues,
              pending_fees: newPendingFees,
              overall_marks: 0
            })
            .eq('roll_number', roll_number);
            
          if (error) throw error;
          successCount++;
        } catch (err) {
          errors.push(`Roll ${student.roll_number}: ${err.message}`);
        }
      }));
    }

    if (errors.length > 0) {
      console.warn(`Bulk promotion completed with ${errors.length} errors:`, errors);
      if (successCount === 0) throw new Error(errors[0]);
    }

    return { success: true, count: successCount, errors };
  } catch (error) {
    console.error('Error in bulk promotion:', error.message);
    throw error;
  }
};

export const bulkDeleteStudents = async (rollNumbersArray) => {
  try {
    let successCount = 0;
    let errors = [];

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < rollNumbersArray.length; i += batchSize) {
      const batch = rollNumbersArray.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (roll_number) => {
        try {
          const { error } = await supabase
            .from('students')
            .delete()
            .eq('roll_number', roll_number);
            
          if (error) throw error;
          successCount++;
        } catch (err) {
          errors.push(`Roll ${roll_number}: ${err.message}`);
        }
      }));
    }

    if (errors.length > 0) {
      console.warn(`Bulk delete completed with ${errors.length} errors:`, errors);
      if (successCount === 0) throw new Error(errors[0]);
    }

    return { success: true, count: successCount, errors };
  } catch (error) {
    console.error('Error in bulk delete:', error.message);
    throw error;
  }
};
