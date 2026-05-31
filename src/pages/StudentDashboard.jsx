import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LogOut, User, BookOpen, GraduationCap, 
  CreditCard, Calendar as CalendarIcon, 
  Award, TrendingUp, Clock, Bell, MapPin, Mail, Phone
} from 'lucide-react';
import { getStudentSession, getStudentDashboardData, logoutStudent } from '../lib/supabase';

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
  const navigate = useNavigate();

  useEffect(() => {
    const initDashboard = async () => {
      const currentSession = await getStudentSession();
      if (!currentSession) {
        navigate('/login');
        return;
      }
      setSession(currentSession);

      try {
        const { profile: pData, marks: mData } = await getStudentDashboardData();
        setProfile(pData);
        setMarks(mData);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError('Failed to load dashboard data. Please ensure your Supabase database is properly configured.');
      } finally {
        setIsLoading(false);
      }
    };

    initDashboard();
  }, [navigate]);

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

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FCFAF8] flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-lg text-center shadow-lg border border-red-100">
          <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
          <p className="text-sm mb-6">{error || 'Profile not found.'}</p>
          <button 
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const attendancePercentage = profile.attendance_percentage || 0;
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
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 mr-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bell size={16} />
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">{profile.full_name}</p>
              <p className="text-xs text-blue-200">{profile.class} - {profile.section}</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile & Attendance */}
        <div className="space-y-8">
          
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-edu-navy to-blue-800"></div>
            <div className="relative z-10 flex flex-col items-center mt-6">
              <img 
                src={profile.student_photo || 'https://via.placeholder.com/150'} 
                alt="Student Profile" 
                className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover bg-white"
              />
              <h2 className="mt-4 text-2xl font-bold text-edu-navy">{profile.full_name}</h2>
              <div className="flex items-center gap-2 mt-1 mb-6 px-3 py-1 bg-blue-50 text-edu-blue rounded-full text-sm font-semibold">
                <GraduationCap size={16} /> {profile.class} - Section {profile.section}
              </div>
              
              <div className="w-full space-y-4 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <User size={16} className="text-edu-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Roll Number</p>
                    <p className="font-semibold text-edu-navy">{profile.roll_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <Phone size={16} className="text-edu-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Phone</p>
                    <p className="font-semibold text-edu-navy">{profile.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-edu-gold" />
                  </div>
                  <div className="break-all">
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="font-semibold text-edu-navy">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-edu-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Address</p>
                    <p className="font-semibold text-edu-navy">{profile.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Attendance Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-lg font-bold text-edu-navy mb-6 flex items-center gap-2">
              <CalendarIcon className="text-edu-gold" size={20} /> Attendance Overview
            </h3>
            <div className="flex items-center justify-between">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="38" className="stroke-gray-100" strokeWidth="8" fill="none" />
                  <motion.circle 
                    initial={{ strokeDashoffset: strokeDasharray }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="64" cy="64" r="38" 
                    className={`${attendancePercentage >= 75 ? 'stroke-green-500' : 'stroke-orange-500'}`} 
                    strokeWidth="8" fill="none" 
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-bold text-edu-navy">{attendancePercentage}%</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-semibold text-gray-600">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-semibold text-gray-600">Absent</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">*Target: 75% minimum</p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Right Column: Stats, Marks, Fees */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Top Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DashboardCard 
              title="Overall Academic Marks" 
              value={`${profile.overall_marks || 0}%`}
              icon={TrendingUp} 
              color="from-purple-500 to-indigo-600" 
              delay={0.1} 
            />
            <DashboardCard 
              title="Current Term Rank" 
              value="Top 15%" 
              icon={Award} 
              color="from-edu-gold to-yellow-500" 
              delay={0.2} 
            />
          </div>

          {/* Academic Marks Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-edu-navy flex items-center gap-2">
                <BookOpen className="text-edu-gold" size={20} /> Term 1 Results
              </h3>
              <button className="text-sm text-edu-blue font-semibold hover:underline">Download Report</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 font-semibold">Subject</th>
                    <th className="p-4 font-semibold text-center">Marks</th>
                    <th className="p-4 font-semibold text-center">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {marks.length > 0 ? (
                    marks.map((mark) => (
                      <tr key={mark.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-edu-navy">{mark.subject}</td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-gray-700">{mark.marks}</span><span className="text-gray-400 text-sm">/100</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            mark.grade.includes('A') ? 'bg-green-100 text-green-700' : 
                            mark.grade.includes('B') ? 'bg-blue-100 text-blue-700' : 
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {mark.grade}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-gray-400">
                        No marks recorded for this term yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Fee Status */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-bold text-edu-navy mb-6 flex items-center gap-2">
                <CreditCard className="text-edu-gold" size={20} /> Fee Status
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-500">Total Fees</span>
                    <span className="font-bold text-edu-navy">₹{profile.total_fees?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-500">Pending Amount</span>
                    <span className="font-bold text-red-500">₹{profile.pending_fees?.toLocaleString() || 0}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${profile.total_fees ? ((profile.total_fees - profile.pending_fees) / profile.total_fees) * 100 : 0}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-green-500 h-full rounded-full"
                    ></motion.div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  {profile.pending_fees > 0 ? (
                    <button className="w-full py-3 bg-edu-navy text-white rounded-xl font-bold hover:bg-blue-900 transition-colors shadow-md">
                      Pay Pending ₹{profile.pending_fees.toLocaleString()}
                    </button>
                  ) : (
                    <div className="w-full py-3 bg-green-50 text-green-600 rounded-xl font-bold text-center border border-green-200">
                      Fully Paid 🎉
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recent Activities */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-bold text-edu-navy mb-6 flex items-center gap-2">
                <Clock className="text-edu-gold" size={20} /> Recent Activities
              </h3>
              
              <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {[
                  { title: "Science Assignment Graded", time: "2 hours ago", color: "bg-green-500" },
                  { title: "Term 1 Results Published", time: "Yesterday", color: "bg-edu-gold" },
                  { title: "Library Book Due", time: "3 days ago", color: "bg-orange-500" },
                  { title: "Fee Reminder Sent", time: "Last Week", color: "bg-red-500" }
                ].map((activity, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-3 h-3 rounded-full border-4 border-white ${activity.color} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-4 md:left-1/2 -translate-x-1/2`}></div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] ml-12 md:ml-0 p-3 bg-gray-50 rounded-xl border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                      <h4 className="text-sm font-bold text-edu-navy">{activity.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
