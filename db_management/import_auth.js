import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Setup for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("âŒ Error: Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env file.");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper: Generate a secure random password (8 chars, letters + numbers)
const generatePassword = () => {
  return crypto.randomBytes(4).toString('hex'); // 8 char hex string
};

// Helper: Parse DDMMYYYY or DD-MM-YYYY to YYYY-MM-DD
const parseDateToISO = (dateStr) => {
  if (!dateStr) return '2000-01-01'; // Fallback
  dateStr = dateStr.trim();
  
  // If it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  
  // If it's DDMMYYYY
  if (/^\d{8}$/.test(dateStr)) {
    const d = dateStr.substring(0, 2);
    const m = dateStr.substring(2, 4);
    const y = dateStr.substring(4, 8);
    return `${y}-${m}-${d}`;
  }
  
  // If it's DD-MM-YYYY or DD/MM/YYYY
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    let [d, m, y] = parts;
    if (d.length === 1) d = '0' + d;
    if (m.length === 1) m = '0' + m;
    if (y.length === 2) y = '20' + y;
    return `${y}-${m}-${d}`;
  }
  
  return '2000-01-01'; // Fallback
};

const importUsers = async () => {
  console.log('Reading students_credentials.csv...');
  
  const csvPath = path.join(__dirname, '..', 'data', 'students_credentials.csv');
  const exportCsvPath = path.join(__dirname, '..', 'data', 'students_credentials_export.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('âŒ Error: students_credentials.csv not found!');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rollIndex = headers.indexOf('Student PEN');

  if (rollIndex === -1) {
    console.error('âŒ Error: CSV must contain at least a "Student PEN" column.');
    return;
  }

  console.log(`Found ${lines.length - 1} students. Starting secure Auth import...`);

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;
  
  // Fetch existing students to avoid overwriting their data (like paid fees or marks)
  const { data: existingStudents, error: fetchError } = await supabaseAdmin.from('students').select('roll_number');
  if (fetchError) {
    console.error('âŒ Error fetching existing students:', fetchError.message);
    return;
  }
  const existingRolls = new Set(existingStudents.map(s => String(s.roll_number)));

  // Prepare export headers
  const exportLines = [];
  exportLines.push([...headers, 'email', 'generated_password'].join(','));

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',').map(col => col.trim());
    const rollNo = String(columns[rollIndex]);

    if (!rollNo) continue;

    // Build student profile dynamically from headers
    const rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = columns[index];
    });

    if (existingRolls.has(rollNo)) {
      console.log(`â­ï¸ Skipped ${rollNo}: Already exists in database (preventing data overwrite).`);
      
      // Preserve them in the export file just so the list remains complete
      const existingEmail = `${rollNo}@siddhartha.edu`;
      const existingPassword = rowData['password'] || rowData['generated_password'] || 'UNKNOWN (Already Existed)';
      exportLines.push([...columns, existingEmail, existingPassword].join(','));
      
      skipCount++;
      continue;
    }

    const studentProfile = {
      class: rowData['Class'],
      full_name: rowData['Name'],
      roll_number: rowData['Student PEN'],
      parent_name: rowData['Parent Name'],
      total_fees: rowData['FEES'],
      username: rowData['username'] || rollNo,
      status: rowData['status'] || 'Active'
    };

    // Generate credentials
    const email = `${rollNo}@siddhartha.edu`;
    const password = rowData['password'] || rowData['generated_password'] || generatePassword();
    
    // Process types
    if (rowData['DOB']) {
      studentProfile.dob = parseDateToISO(rowData['DOB']);
    } else {
      studentProfile.dob = '2000-01-01';
    }

    if (studentProfile.total_fees) {
      studentProfile.total_fees = parseInt(studentProfile.total_fees, 10);
      studentProfile.pending_fees = studentProfile.total_fees;
    }
    
    studentProfile.overall_marks = 0;
    if (!studentProfile.pending_fees) studentProfile.pending_fees = 0;
    if (!studentProfile.total_fees) studentProfile.total_fees = 0;
    
    // Keep email strictly internal
    studentProfile.email = email;

    try {
      let authUserId;
      // 1. Create Supabase Auth Account
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true 
      });

      if (authError) {
        if (authError.message.includes('already') || authError.message.includes('registered')) {
          // User exists, find their ID
          // Since the database trigger automatically adds them to profiles, we can get their ID there
          const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();
            
          let foundUser = null;
          if (profileData && profileData.id) {
            foundUser = { id: profileData.id };
          } else {
            // Fallback to searching auth users with pagination if not in profiles
            let page = 1;
            while (true) {
              const { data: authPage } = await supabaseAdmin.auth.admin.listUsers({ page: page, perPage: 100 });
              if (!authPage || !authPage.users || authPage.users.length === 0) break;
              foundUser = authPage.users.find(u => u.email === email);
              if (foundUser) break;
              page++;
            }
          }

          if (foundUser && foundUser.id) {
            authUserId = foundUser.id;
            // Ensure password is set to the CSV password
            await supabaseAdmin.auth.admin.updateUserById(authUserId, { password: password });
          } else {
            console.error(`âš ï¸ Failed to find existing Auth for ${rollNo}:`, authError.message);
            errorCount++;
            continue;
          }
        } else {
          console.error(`âš ï¸ Failed to create Auth for ${rollNo}:`, authError.message);
          errorCount++;
          continue;
        }
      } else {
        authUserId = authData.user.id;
      }

      studentProfile.auth_user_id = authUserId;

      // 2. Insert into profiles table
      const { error: profileRoleError } = await supabaseAdmin
        .from('profiles')
        .upsert({ id: authUserId, role: 'student', email: email });

      if (profileRoleError) {
        console.error(`âš ï¸ Failed to upsert role profile for ${rollNo}:`, profileRoleError.message);
        errorCount++;
        continue; 
      }

      // 3. Insert into students table
      const { error: dbError } = await supabaseAdmin
        .from('students')
        .upsert(studentProfile, { onConflict: 'roll_number' });

      if (dbError) {
        console.error(`âš ï¸ Failed to insert DB profile for ${rollNo}:`, dbError.message);
        errorCount++;
      } else {
        console.log(`âœ… Success: ${rollNo} (Password: ${password})`);
        
        // Add to export list so school can print passwords
        exportLines.push([...columns, email, password].join(','));
        successCount++;
      }
      
    } catch (err) {
      console.error(`âš ï¸ Unexpected error for ${rollNo}:`, err.message);
      errorCount++;
    }
  }

  // Write credentials export file
  if (exportLines.length > 1) {
    fs.writeFileSync(exportCsvPath, exportLines.join('\n'), 'utf-8');
    console.log(`\nðŸ’¾ Saved credentials to: ${exportCsvPath}`);
  }

  console.log('\n===================================');
  console.log('ðŸŽ‰ Import Complete!');
  console.log(`Successfully created: ${successCount}`);
  console.log(`Skipped (Already Existed): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('===================================');
};

importUsers();
