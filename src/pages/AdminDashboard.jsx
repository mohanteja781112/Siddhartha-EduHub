import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Loader2, Wallet, Database, Search, Users, Shield, Book, GraduationCap, Award, Lightbulb, LogOut
} from 'lucide-react';
import { getStudentSession, logoutStudent } from '../lib/supabase';

// Import newly refactored modular components
import BulkOperations from '../components/admin/BulkOperations';
import FeesManagement from '../components/admin/FeesManagement';
import StudentDirectory from '../components/admin/StudentDirectory';
import RoleManagement from '../components/admin/RoleManagement';

const AdminDashboard = () => {
  const [authChecking, setAuthChecking] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'import'; // 'import' | 'fees' | 'directory' | 'roles'
  const navigate = useNavigate();

  const setActiveTab = (tab) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    }, { replace: true });
  };

  // Verify Admin Session
  useEffect(() => {
    const checkAdmin = async () => {
      const session = await getStudentSession();
      if (!session || session.user.email !== 'admin@siddhartha.edu') {
        navigate('/login?role=admin', { replace: true });
      } else {
        setAuthChecking(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleLogout = async () => {
    await logoutStudent();
    navigate('/login?role=admin');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <Loader2 className="animate-spin text-edu-navy" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] font-sans pb-12 relative overflow-hidden">
      {/* Background Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ y: [0, -20, 0], opacity: [0.05, 0.08, 0.05] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-20 left-10 text-edu-blue"
        >
          <GraduationCap size={120} />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 30, 0], opacity: [0.03, 0.06, 0.03] }} transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
          className="absolute top-60 right-20 text-edu-navy"
        >
          <Book size={150} />
        </motion.div>
        <motion.div 
          animate={{ y: [0, -15, 0], opacity: [0.04, 0.07, 0.04], rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-40 text-edu-gold"
        >
          <Award size={100} />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 25, 0], opacity: [0.03, 0.05, 0.03], rotate: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 3 }}
          className="absolute top-40 right-1/3 text-edu-blue"
        >
          <Lightbulb size={80} />
        </motion.div>
      </div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 flex flex-col items-center text-center"
        >
          <div className="inline-block relative">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-outfit">Admin Dashboard</h1>
            <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-gradient-to-r from-edu-gold to-yellow-300 rounded-full"></div>
          </div>
          <p className="text-gray-500 mt-4 text-lg max-w-2xl font-medium">Manage students, staff roles, and financials.</p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap justify-center bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm gap-2">
            <button
              onClick={() => setActiveTab('import')}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'import' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <Database size={18} /> Bulk Operations
            </button>
            <button
              onClick={() => setActiveTab('fees')}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'fees' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <Wallet size={18} /> Fees Management
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'directory' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <Users size={18} /> Student Directory
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'roles' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <Shield size={18} /> Staff Roles
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'import' && <BulkOperations />}
          {activeTab === 'fees' && <FeesManagement />}
          {activeTab === 'directory' && <StudentDirectory />}
          {activeTab === 'roles' && <RoleManagement />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
