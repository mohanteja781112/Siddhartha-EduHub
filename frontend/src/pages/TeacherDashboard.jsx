import React, { useState, useEffect } from 'react';
import { supabase, logoutStudent } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, BookOpen, Database, GraduationCap, Book, Award, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ExamsManagement from '../components/teacher/ExamsManagement';
import MarksEntry from '../components/teacher/MarksEntry';

const TeacherDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'exams'; // 'exams' | 'marks'
  const setActiveTab = (tab) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    }, { replace: true });
  };

  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [accessDeniedRole, setAccessDeniedRole] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login?role=teacher', { replace: true });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      setAccessDeniedRole(profile?.role || 'None/Unknown');
      setIsAuthChecking(false);
      return;
    }

    setIsAuthChecking(false);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-edu-blue"></div>
      </div>
    );
  }

  if (accessDeniedRole) {
    return (
      <div className="min-h-screen bg-[#FCFAF8] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-3xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You are currently logged in with an account that has the role: <strong className="text-red-600">'{accessDeniedRole}'</strong>. 
            You MUST be logged in as a 'teacher' or 'admin' to access this portal.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                logoutStudent();
                navigate('/login?role=teacher');
              }}
              className="w-full py-3 px-4 bg-edu-navy text-white rounded-xl font-bold hover:bg-blue-900 transition-colors shadow-md"
            >
              Logout & Switch Account
            </button>
            <button
              onClick={() => navigate(accessDeniedRole === 'student' ? '/student-dashboard' : '/login')}
              className="w-full py-3 px-4 text-edu-navy font-semibold hover:bg-blue-50 rounded-xl transition-colors"
            >
              Go to My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-12 bg-[#f8fbff]">
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


      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 flex flex-col items-center text-center"
        >
          <div className="inline-block relative">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-outfit">Teacher Portal</h1>
            <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-gradient-to-r from-edu-gold to-yellow-300 rounded-full"></div>
          </div>
          <p className="text-gray-500 mt-4 text-lg max-w-2xl font-medium">Manage exams, academic records, and monitor student performance</p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap justify-center bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm gap-2">
            <button
              onClick={() => { setActiveTab('exams'); setSearchParams({ tab: 'exams', view: 'list' }); }}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'exams' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <BookOpen size={18} /> Online Exams
            </button>
            <button
              onClick={() => setActiveTab('marks')}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'marks' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <Database size={18} /> Academic Records
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'marks' && <MarksEntry key="marks" />}
          {activeTab === 'exams' && <ExamsManagement key="exams" />}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherDashboard;
