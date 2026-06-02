import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LogOut, User, BookOpen, GraduationCap, 
  CreditCard, Calendar as CalendarIcon, 
  Award, TrendingUp, Clock, Bell, MapPin, Mail, Phone,
  FileText, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Timer
} from 'lucide-react';
import { getStudentSession, getStudentDashboardData, logoutStudent, supabase } from '../lib/supabase';

const DashboardCard = ({ title, value, icon: Icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50 flex items-center gap-5"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${color}`}>
      <Icon size={26} />
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-edu-navy">{value}</h3>
    </div>
  </motion.div>
);

const StudentDashboard = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [marks, setMarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Exams State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'exams', 'take_exam'
  const [availableExams, setAvailableExams] = useState([]);
  const [pastResults, setPastResults] = useState([]);
  
  // Exam Taking State
  const [currentExam, setCurrentExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
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
        } else {
          setError('Not authenticated');
          navigate('/login');
        }
      } catch (err) {
        console.error("Dashboard error:", err);
        setError('Failed to load dashboard data');
        navigate('/login');
      }
      setIsLoading(false);
    };

    initDashboard();
  }, [navigate]);

  const fetchExamsData = async (studentClass, studentId) => {
    // Fetch available exams
    const { data: examsData } = await supabase
      .from('exams')
      .select('*')
      .eq('class', studentClass)
      .eq('is_active', true);
      
    // Fetch past results
    const { data: resultsData } = await supabase
      .from('student_exam_results')
      .select('*, exams(title, subject)')
      .eq('student_id', studentId);

    // Filter out exams already taken
    const takenExamIds = (resultsData || []).map(r => r.exam_id);
    const available = (examsData || []).filter(e => !takenExamIds.includes(e.id));
    
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
    setCurrentQuestionIndex(0);
    setTimeLeft(exam.time_limit_minutes * 60);
    setActiveTab('take_exam');

    // Start Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitExam(qData, {}, exam); // Auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitExam = async (currentQuestions = questions, currentAnswers = answers, exam = currentExam) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    let score = 0;
    let total = 0;

    currentQuestions.forEach(q => {
      total += q.marks;
      if (currentAnswers[q.id] === q.correct_option) {
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
      alert("Error submitting exam: " + error.message);
    } else {
      alert(`Exam Submitted! You scored ${score} out of ${total}`);
      setActiveTab('exams');
      fetchExamsData(profile.class, profile.id); // Refresh data
    }
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

  const attendancePercentage = profile?.attendance_percentage || 0;
  const strokeDasharray = 2 * Math.PI * 38;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * attendancePercentage) / 100;

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans pb-12">
      
      {/* Top Navbar */}
      <nav className="bg-edu-navy text-white px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto bg-white rounded-full p-1" />
            <h1 className="font-poppins font-bold text-lg hidden sm:block">Siddhartha EduHub | Student Portal</h1>
          </div>
          
          {/* Navigation Tabs */}
          <div className="hidden md:flex bg-white/10 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'dashboard' ? 'bg-white text-edu-navy shadow' : 'text-white hover:bg-white/20'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'exams' || activeTab === 'take_exam' ? 'bg-white text-edu-navy shadow' : 'text-white hover:bg-white/20'}`}
            >
              Weekly Exams
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{profile?.full_name}</p>
              <p className="text-xs text-blue-200">Class {profile?.class} - {profile?.section}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Tabs (visible only on small screens) */}
      <div className="md:hidden bg-edu-navy px-4 pb-4">
        <div className="flex bg-white/10 p-1 rounded-xl w-full">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'dashboard' ? 'bg-white text-edu-navy shadow' : 'text-white hover:bg-white/20'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('exams')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'exams' || activeTab === 'take_exam' ? 'bg-white text-edu-navy shadow' : 'text-white hover:bg-white/20'}`}
          >
            Exams
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-edu-navy to-blue-800"></div>
                <div className="relative z-10 flex flex-col items-center mt-6">
                  <img 
                    src={profile?.student_photo || 'https://via.placeholder.com/150'} 
                    alt="Student Profile" 
                    className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                  />
                  <h2 className="mt-4 text-2xl font-bold text-edu-navy">{profile?.full_name}</h2>
                  <div className="flex items-center gap-2 mt-1 mb-6 px-3 py-1 bg-blue-50 text-edu-blue rounded-full text-sm font-semibold">
                    <GraduationCap size={16} /> Class {profile?.class} - {profile?.section}
                  </div>
                  {/* Info lines ... omitted for brevity in draft, wait I need to include them so it's not broken */}
                  <div className="w-full space-y-4 text-sm">
                    <div className="flex items-center gap-3 text-gray-600"><div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0"><User size={16} className="text-edu-gold" /></div><div><p className="text-xs text-gray-400">Roll Number</p><p className="font-semibold text-edu-navy">{profile?.roll_number}</p></div></div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-edu-navy mb-6 flex items-center gap-2"><CalendarIcon className="text-edu-gold" size={20} /> Attendance</h3>
                <div className="flex items-center justify-between">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="38" className="stroke-gray-100" strokeWidth="8" fill="none" />
                      <motion.circle initial={{ strokeDashoffset: strokeDasharray }} animate={{ strokeDashoffset }} transition={{ duration: 1.5, ease: "easeOut" }} cx="64" cy="64" r="38" className={`${attendancePercentage >= 75 ? 'stroke-green-500' : 'stroke-orange-500'}`} strokeWidth="8" fill="none" strokeDasharray={strokeDasharray} strokeLinecap="round" />
                    </svg>
                    <div className="absolute text-center"><span className="text-2xl font-bold text-edu-navy">{attendancePercentage}%</span></div>
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

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50"><h3 className="text-lg font-bold text-edu-navy flex items-center gap-2"><BookOpen className="text-edu-gold" size={20} /> Academic Records</h3></div>
                <div className="overflow-x-auto p-4">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wider"><th className="p-3">Subject</th><th className="p-3">Marks</th></tr></thead>
                    <tbody>
                      {marks.map(mark => <tr key={mark.id} className="border-b border-gray-50"><td className="p-3 font-medium">{mark.subject}</td><td className="p-3">{mark.marks}</td></tr>)}
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
            <h2 className="text-2xl font-bold text-edu-navy">Weekly Exams</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Exams */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-edu-navy mb-4 flex items-center gap-2">
                  <FileText className="text-edu-blue" size={20} /> Pending Exams
                </h3>
                <div className="space-y-4">
                  {availableExams.length === 0 ? (
                    <p className="text-gray-500 text-sm">No pending exams at the moment. Great job!</p>
                  ) : (
                    availableExams.map(exam => (
                      <div key={exam.id} className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-edu-navy">{exam.title}</h4>
                          <p className="text-sm text-gray-600">{exam.subject} • {exam.time_limit_minutes} mins</p>
                        </div>
                        <button 
                          onClick={() => startExam(exam)}
                          className="w-full sm:w-auto bg-edu-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          Start Exam
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Past Results */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-edu-navy mb-4 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} /> Past Results
                </h3>
                <div className="space-y-4">
                  {pastResults.length === 0 ? (
                    <p className="text-gray-500 text-sm">You haven't completed any exams yet.</p>
                  ) : (
                    pastResults.map(res => (
                      <div key={res.id} className="p-4 border border-gray-100 bg-gray-50 rounded-xl flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-edu-navy">{res.exams?.title || 'Exam'}</h4>
                          <p className="text-xs text-gray-500">{new Date(res.submitted_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-edu-blue">{res.total_marks_obtained} <span className="text-sm text-gray-400">/ {res.total_marks}</span></p>
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
                  const optionText = questions[currentQuestionIndex][`option_${opt.toLowerCase()}`];
                  const isSelected = answers[questions[currentQuestionIndex].id] === opt;
                  
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswers({...answers, [questions[currentQuestionIndex].id]: opt})}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                        isSelected 
                          ? 'border-edu-blue bg-blue-50 shadow-md transform scale-[1.01]' 
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isSelected ? 'border-edu-blue bg-edu-blue text-white' : 'border-gray-300 text-gray-500'
                      }`}>
                        {opt}
                      </div>
                      <span className={`text-sm sm:text-base ${isSelected ? 'font-medium text-edu-navy' : 'text-gray-700'}`}>
                        {optionText}
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
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-md"
                >
                  <CheckCircle size={20} /> Submit Exam
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

      </div>
    </div>
  );
};

export default StudentDashboard;
