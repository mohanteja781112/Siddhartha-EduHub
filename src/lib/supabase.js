import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Database Helper Functions ---

export const loginStudent = async (username, password) => {
  try {
    // We map 'username' (which is actually Roll No) to an email format for Supabase Auth
    // E.g. '1001' becomes '1001@siddhartha.edu', 'admin' becomes 'admin@siddhartha.edu'
    const email = `${username.toLowerCase()}@siddhartha.edu`;
    
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
