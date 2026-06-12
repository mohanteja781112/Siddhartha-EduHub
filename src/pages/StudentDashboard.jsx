import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LogOut, User, BookOpen, GraduationCap, 
  CreditCard, Calendar as CalendarIcon, 
  Award, TrendingUp, Clock, Bell, MapPin, Mail, Phone,
  FileText, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Timer, Book, Lightbulb
} from 'lucide-react';
import { getStudentSession, getStudentDashboardData, getStudentPayments, logoutStudent, supabase } from '../lib/supabase';

const DashboardCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="glass-card rounded-[2rem] p-8 shadow-apple transition-all duration-300 hover:-translate-y-1 flex items-center gap-6"
  >
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${color}`}>
      <Icon size={30} />
    </div>
    <div>
      <p className="text-sm font-bold text-gray-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 font-outfit">{value}</h3>
    </div>
  </motion.div>
);

const StudentDashboard = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [marks, setMarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTerm, setActiveTerm] = useState('FA1');
  
  // Exams & Fees State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'exams', 'take_exam', 'fees'
  const [feePayments, setFeePayments] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);
  const [pastResults, setPastResults] = useState([]);
  
  // Exam Taking State
  const [currentExam, setCurrentExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const answersRef = useRef({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

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
    // Standardize the class formats to handle both 'III' and '3'
    const romanToArabic = {
      'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5',
      'VI': '6', 'VII': '7', 'VIII': '8', 'IX': '9', 'X': '10'
    };
    
    // Create an array of possible matching class names
    const arabicClass = romanToArabic[studentClass?.toUpperCase()] || studentClass;
    const romanClass = Object.keys(romanToArabic).find(key => romanToArabic[key] === String(studentClass)) || studentClass;
    const searchClasses = [...new Set([String(studentClass), arabicClass, romanClass])];

    // Fetch available exams matching any of the formats
    const { data: examsData } = await supabase
      .from('exams')
      .select('*')
      .in('class', searchClasses)
      .eq('is_active', true);
      
    // Fetch past results
    const { data: resultsData } = await supabase
      .from('student_exam_results')
      .select('*, exams(title, subject)')
      .eq('student_id', studentId);

    // Filter out exams already taken and exams older than 24 hours
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

  const startExam = async (exam) => {
    // Fetch questions for this exam
    const { data: qData, error } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', exam.id);

    if (error || !qData || qData.length === 0) {
      alert("No questions found for this exam.");
      return;
    }

    setQuestions(qData);
    setCurrentExam(exam);
    setAnswers({});
    answersRef.current = {};
    setIsSubmitting(false);
    setCurrentQuestionIndex(0);
    setTimeLeft(exam.time_limit_minutes * 60);
    setActiveTab('take_exam');

    // Start Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitExam(qData, answersRef.current, exam); // Auto submit with latest answers
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitExam = async (currentQuestions = questions, currentAnswers = answers, exam = currentExam) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    let score = 0;
    let total = 0;

    currentQuestions.forEach(q => {
      total += q.marks;
      
      // Get student's selections and format as a sorted comma-separated string (e.g., "A,C")
      const studentAnswerArray = currentAnswers[q.id] || [];
      const studentAnswerString = Array.isArray(studentAnswerArray) ? studentAnswerArray.sort().join(',') : studentAnswerArray;

      // Full Match Grading: Only award marks if their selections exactly match the correct options
      if (studentAnswerString === q.correct_option) {
        score += q.marks;
      }
    });

    const studentId = profile.id;

    // Save to database
    const { error } = await supabase
      .from('student_exam_results')
      .insert([{
        exam_id: exam.id,
        student_id: studentId,
        total_marks_obtained: score,
        total_marks: total
      }]);

    if (error) {
      if (error.code === '23505') {
         alert("Exam already submitted!");
         setActiveTab('exams');
         fetchExamsData(profile.class, profile.id);
      } else {
         alert("Error submitting exam: " + error.message);
      }
    } else {
      alert(`Exam Submitted! You scored ${score} out of ${total}`);
      setActiveTab('exams');
      fetchExamsData(profile.class, profile.id); // Refresh data
    }
    setIsSubmitting(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
        
        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-[2rem] p-8 relative overflow-hidden text-center flex flex-col items-center"
              >
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-edu-navy via-[#1e4b78] to-edu-blue opacity-90"></div>
                <div className="relative z-10 flex flex-col items-center mt-6">
                  <img 
                    src={profile?.student_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Student')}&background=0f172a&color=fff&size=150&bold=true`} 
                    alt="Student Profile" 
                    className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                  />
                  <h2 className="mt-4 text-2xl font-bold text-edu-navy">{profile?.full_name}</h2>
                  <div className="flex items-center gap-2 mt-1 mb-6 px-3 py-1 bg-blue-50 text-edu-blue rounded-full text-sm font-semibold">
                    <GraduationCap size={16} /> Class {profile?.class}{profile?.section ? ` - ${profile.section}` : ''}
                  </div>
                  <div className="w-full space-y-4 text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                        <User size={16} className="text-edu-gold" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-400">Roll Number</p>
                        <p className="font-semibold text-edu-navy">{profile?.roll_number}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                        <User size={16} className="text-edu-gold" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-400">Parent Name</p>
                        <p className="font-semibold text-edu-navy">{profile?.parent_name || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                        <CalendarIcon size={16} className="text-edu-gold" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-400">Date of Birth</p>
                        <p className="font-semibold text-edu-navy">
                          {profile?.dob ? (() => {
                            const d = new Date(profile.dob);
                            return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
                          })() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardCard title="Overall Marks" value={`${profile?.overall_marks || 0}%`} icon={TrendingUp} color="from-purple-500 to-indigo-600" delay={0.1} />
                <DashboardCard title="Current Rank" value="Top 15%" icon={Award} color="from-edu-gold to-yellow-500" delay={0.2} />
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-[2rem] overflow-hidden">
                <div className="p-8 border-b border-white/50 bg-white/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl font-bold text-gray-900 font-outfit flex items-center gap-2">
                    <BookOpen className="text-edu-gold" size={22} /> Academic Records
                  </h3>
                  {marks.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {Array.from(new Set(marks.map(m => m.exam_type || 'FA1'))).map(term => (
                        <button
                          key={term}
                          onClick={() => setActiveTerm(term)}
                          className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                            (activeTerm === term || (!activeTerm && term === 'FA1'))
                              ? 'bg-edu-navy text-white' 
                              : 'bg-white/60 text-gray-600 hover:bg-white'
                          }`}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider"><th className="p-4 font-bold">Subject</th><th className="p-4 font-bold text-right">Marks</th></tr></thead>
                    <tbody>
                      {marks.filter(m => (m.exam_type || 'FA1') === (activeTerm || 'FA1')).length > 0 ? (
                        marks.filter(m => (m.exam_type || 'FA1') === (activeTerm || 'FA1')).map(mark => (
                          <tr key={mark.id} className="border-b border-gray-100/50 hover:bg-white/50 transition-colors">
                            <td className="p-4 font-bold text-gray-800">{mark.subject}</td>
                            <td className="p-4 font-semibold text-edu-blue text-right">{mark.marks_obtained} / {mark.total_marks || 100}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="p-4 text-center text-gray-500">No marks available for this term.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* EXAMS VIEW */}
        {activeTab === 'exams' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 font-outfit">Exams Center</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Exams */}
              <div className="glass-card rounded-[2rem] p-8">
                <h3 className="text-xl font-bold text-gray-900 font-outfit mb-6 flex items-center gap-2">
                  <FileText className="text-edu-blue" size={24} /> Pending Exams
                </h3>
                <div className="space-y-4">
                  {availableExams.length === 0 ? (
                    <p className="text-gray-500 font-medium">No pending exams at the moment. Great job!</p>
                  ) : (
                    availableExams.map(exam => (
                      <div key={exam.id} className="p-5 border border-blue-100 bg-blue-50/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{exam.title}</h4>
                          <p className="text-sm font-semibold text-edu-blue">{exam.subject} • {exam.time_limit_minutes} mins</p>
                        </div>
                        <button 
                          onClick={() => startExam(exam)}
                          className="w-full sm:w-auto bg-gradient-to-r from-edu-navy to-blue-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        >
                          Start Exam
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Past Results */}
              <div className="glass-card rounded-[2rem] p-8">
                <h3 className="text-xl font-bold text-gray-900 font-outfit mb-6 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={24} /> Past Results
                </h3>
                <div className="space-y-4">
                  {pastResults.length === 0 ? (
                    <p className="text-gray-500 font-medium">You haven't completed any exams yet.</p>
                  ) : (
                    pastResults.map(res => (
                      <div key={res.id} className="p-5 border border-gray-100 bg-white/50 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">{res.exams?.title || 'Exam'}</h4>
                          <p className="text-xs font-semibold text-gray-500">{new Date(res.submitted_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-outfit font-bold text-edu-blue">{res.total_marks_obtained} <span className="text-sm text-gray-400">/ {res.total_marks}</span></p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAKE EXAM VIEW (Mobile Responsive) */}
        {activeTab === 'take_exam' && currentExam && questions.length > 0 && (
          <div className="max-w-3xl mx-auto">
            {/* Exam Header & Timer */}
            <div className="bg-white rounded-2xl p-4 shadow-md mb-6 flex justify-between items-center sticky top-20 z-40 border border-blue-100">
              <div>
                <h2 className="font-bold text-edu-navy text-lg sm:text-xl line-clamp-1">{currentExam.title}</h2>
                <p className="text-xs sm:text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-lg sm:text-xl ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-edu-blue'}`}>
                <Timer size={20} />
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Question Card */}
            <motion.div 
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6"
            >
              <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-6 leading-relaxed">
                <span className="font-bold text-edu-blue mr-2">Q{currentQuestionIndex + 1}.</span> 
                {questions[currentQuestionIndex].question_text}
              </h3>

              <div className="space-y-3 sm:space-y-4">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const currentQuestion = questions[currentQuestionIndex];
                  const optionText = currentQuestion[`option_${opt.toLowerCase()}`];
                  const currentSelections = answers[currentQuestion.id] || [];
                  const isSelected = currentSelections.includes(opt);
                  
                  // Check if this question is meant to be multiple choice or single choice
                  const isMultipleChoice = currentQuestion.correct_option.split(',').length > 1;
                  
                  return (
                    <button
                      key={opt}
                      onClick={() => {
                        let newSelections;
                        if (!isMultipleChoice) {
                          // Single choice: clicking an option replaces the old one, clicking same deselects
                          newSelections = isSelected ? [] : [opt];
                        } else {
                          // Multiple choice: toggle the clicked option
                          if (isSelected) {
                            newSelections = currentSelections.filter(o => o !== opt);
                          } else {
                            newSelections = [...currentSelections, opt];
                          }
                        }
                        const newAnswers = {...answers, [currentQuestion.id]: newSelections};
                        setAnswers(newAnswers);
                        answersRef.current = newAnswers;
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                        isSelected 
                          ? 'border-edu-blue bg-blue-50 shadow-md transform scale-[1.01]' 
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`shrink-0 w-6 h-6 ${isMultipleChoice ? 'rounded-md' : 'rounded-full'} border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isSelected ? 'border-edu-blue bg-edu-blue text-white' : 'border-gray-300 text-gray-500'
                      }`}>
                        {isSelected && (
                           isMultipleChoice 
                             ? <CheckCircle size={14} className="text-white" />
                             : <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className={`text-sm sm:text-base ${isSelected ? 'font-medium text-edu-navy' : 'text-gray-700'}`}>
                        <span className="font-bold text-gray-400 mr-2">{opt}.</span> {optionText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center gap-4">
              <button
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ChevronLeft size={20} /> <span className="hidden sm:inline">Previous</span>
              </button>

              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={() => submitExam()}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-md disabled:opacity-50"
                >
                  <CheckCircle size={20} /> {isSubmitting ? 'Submitting...' : 'Submit Exam'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  className="flex items-center gap-2 px-6 py-3 bg-edu-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
                >
                  <span className="hidden sm:inline">Next Question</span> <ChevronRight size={20} />
                </button>
              )}
            </div>
            
            {/* Progress Dots */}
            <div className="mt-8 flex justify-center gap-2 flex-wrap px-4">
              {questions.map((q, idx) => (
                <div 
                  key={q.id} 
                  className={`w-3 h-3 rounded-full ${
                    idx === currentQuestionIndex ? 'bg-edu-blue ring-4 ring-blue-100' :
                    answers[q.id] ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

          </div>
        )}

        {/* FEES VIEW */}
        {activeTab === 'fees' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 font-outfit">Fees & Payments</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-sm font-bold text-gray-500 mb-2">Total Fees</p>
                <h3 className="text-4xl font-bold text-gray-900 font-outfit">₹{(profile?.total_fees || 0).toLocaleString()}</h3>
              </div>
              <div className="glass-card rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm border-green-200">
                <p className="text-sm font-bold text-gray-500 mb-2">Paid Amount</p>
                <h3 className="text-4xl font-bold text-green-600 font-outfit">₹{((profile?.total_fees || 0) - (profile?.pending_fees || 0)).toLocaleString()}</h3>
              </div>
              <div className="glass-card rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm border-red-200">
                <p className="text-sm font-bold text-gray-500 mb-2">Pending Dues</p>
                <h3 className="text-4xl font-bold text-red-500 font-outfit">₹{(profile?.pending_fees || 0).toLocaleString()}</h3>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-8">
              <h3 className="text-xl font-bold text-gray-900 font-outfit mb-6 flex items-center gap-2">
                <CreditCard className="text-edu-gold" size={24} /> Payment History
              </h3>
              
              {feePayments.length === 0 ? (
                <p className="text-gray-500 font-medium text-center py-8">No payments recorded yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-100/50 bg-white/50 backdrop-blur-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-5 font-bold border-b border-gray-100">Transaction ID</th>
                        <th className="p-5 font-bold border-b border-gray-100">Date & Time</th>
                        <th className="p-5 font-bold border-b border-gray-100 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {feePayments.map(payment => (
                        <tr key={payment.id} className="hover:bg-white transition-colors">
                          <td className="p-5 font-mono text-xs font-semibold text-gray-600">
                            {payment.id.split('-')[0].toUpperCase()}
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${payment.payment_type === 'Concession' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {payment.payment_type || 'Standard'}
                            </span>
                          </td>
                          <td className="p-5 text-sm font-medium text-gray-700">{new Date(payment.payment_date).toLocaleString()}</td>
                          <td className="p-5 text-right font-bold text-green-600 text-lg">₹{payment.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentDashboard;
