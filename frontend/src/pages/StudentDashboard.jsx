import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, GraduationCap, Book, Award, Lightbulb } from 'lucide-react';
import { getStudentDashboardData, getStudentPayments, logoutStudent, supabase } from '../lib/supabase';

// Import newly refactored components
import StudentProfile from '../components/student/StudentProfile';
import StudentExams from '../components/student/StudentExams';
import StudentFees from '../components/student/StudentFees';

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [marks, setMarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTerm, setActiveTerm] = useState('FA1');
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard'; // 'dashboard', 'exams', 'take_exam', 'fees'
  
  const setActiveTab = (tab) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    }, { replace: true });
  };
  
  const [feePayments, setFeePayments] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);
  const [pastResults, setPastResults] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const authData = await getStudentDashboardData();
        if (authData.profile) {
          setProfile(authData.profile);
          setMarks(authData.marks);
          fetchExamsData(authData.profile.class, authData.profile.id);
          
          const payments = await getStudentPayments(authData.profile.id);
          setFeePayments(payments);
        } else {
          setError('Not authenticated');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        setError('Failed to load dashboard data');
        navigate('/login', { replace: true });
      }
      setIsLoading(false);
    };

    initDashboard();
  }, [navigate]);

  const fetchExamsData = async (studentClass, studentId) => {
    const romanToArabic = {
      'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
      'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10'
    };
    
    const arabicClass = romanToArabic[studentClass?.toUpperCase()] || studentClass;
    const romanClass = Object.keys(romanToArabic).find(key => romanToArabic[key] === String(studentClass)) || studentClass;
    const searchClasses = [...new Set([String(studentClass), arabicClass, romanClass])];

    const { data: examsData } = await supabase
      .from('exams')
      .select('*')
      .in('class', searchClasses)
      .eq('is_active', true);
      
    const { data: resultsData } = await supabase
      .from('student_exam_results')
      .select('*, exams(title, subject)')
      .eq('student_id', studentId);

    const now = new Date();
    const takenExamIds = (resultsData || []).map(r => r.exam_id);
    const available = (examsData || []).filter(e => {
      const isNotTaken = !takenExamIds.includes(e.id);
      const isNotExpired = (now - new Date(e.created_at)) <= 24 * 60 * 60 * 1000;
      return isNotTaken && isNotExpired;
    });
    
    setAvailableExams(available);
    setPastResults(resultsData || []);
  };

  const handleLogout = () => {
    logoutStudent();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FCFAF8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-edu-gold/30 border-t-edu-gold rounded-full animate-spin"></div>
          <p className="text-edu-navy font-semibold animate-pulse">Loading Student Data...</p>
        </div>
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


      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 mb-8 flex justify-center relative z-10">
        <div className="flex flex-wrap justify-center bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm gap-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('exams')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'exams' || activeTab === 'take_exam' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
          >
            Exams
          </button>
          <button 
            onClick={() => setActiveTab('fees')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'fees' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
          >
            Fees
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-0 relative z-10">
        {activeTab === 'dashboard' && (
          <StudentProfile 
            profile={profile} 
            marks={marks} 
            activeTerm={activeTerm} 
            setActiveTerm={setActiveTerm} 
            availableExams={availableExams} 
            setActiveTab={setActiveTab} 
          />
        )}

        {(activeTab === 'exams' || activeTab === 'take_exam') && (
          <StudentExams 
            profile={profile}
            availableExams={availableExams}
            pastResults={pastResults}
            fetchExamsData={fetchExamsData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'fees' && (
          <StudentFees 
            profile={profile}
            feePayments={feePayments}
          />
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
