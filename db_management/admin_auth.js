import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Error: Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env file.");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// === EDIT THE EMAIL AND NEW PASSWORD HERE ===
const TARGET_EMAIL = 'admin@your_school.edu'; // REPLACE WITH TARGET EMAIL
const NEW_PASSWORD = 'Your_New_Secure_Password_123!'; // REPLACE WITH NEW PASSWORD
// ============================================

async function manageAdminAuth() {
  console.log(`Processing admin account for: ${TARGET_EMAIL}...`);
  
  // 1. Attempt to create the user first
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: TARGET_EMAIL,
    password: NEW_PASSWORD,
    email_confirm: true 
  });

  if (createError) {
    if (createError.message.includes('already') || createError.message.includes('registered')) {
      console.log("Account already exists! Updating password instead...");
      
      // Look up the user's ID
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', TARGET_EMAIL)
        .single();

      if (!profile) {
        console.error(`❌ Could not find the user in the profiles table to update.`);
        return;
      }

      // Update their password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, { 
        password: NEW_PASSWORD 
      });

      if (updateError) {
        console.error("❌ Error updating password:", updateError.message);
      } else {
        console.log(`✅ Successfully updated password for existing admin: ${TARGET_EMAIL}`);
      }
    } else {
      console.error("❌ Error creating admin account:", createError.message);
    }
    return;
  }

  // 2. If creation was successful, we must assign them the 'admin' role in profiles
  const newUserId = createData.user.id;
  
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({ id: newUserId, email: TARGET_EMAIL, role: 'admin' });

  if (profileError) {
    console.error("❌ Error assigning admin role in profiles table:", profileError.message);
  } else {
    console.log(`✅ Successfully created NEW admin account: ${TARGET_EMAIL}`);
    console.log(`Assigned role: admin`);
  }
}

manageAdminAuth();
