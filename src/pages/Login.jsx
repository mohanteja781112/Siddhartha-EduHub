import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle, RefreshCw, Shield, GraduationCap, Presentation } from 'lucide-react';
import { loginStudent, logoutStudent, supabase } from '../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const roleParam = new URLSearchParams(location.search).get('role');
  const targetRole = roleParam === 'admin' ? 'admin' : roleParam === 'teacher' ? 'teacher' : 'student';
  const isServerAdmin = targetRole === 'admin';
  const isTeacher = targetRole === 'teacher';

  const [username, setUsername] = useState(isServerAdmin ? 'admin' : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingSession, setExistingSession] = useState(null);
  const [existingRole, setExistingRole] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setExistingSession(session);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, is_active')
            .eq('id', session.user.id)
            .single();
            
          if (profile && profile.is_active === false && session.user.email !== 'admin16@siddhartha.edu') {
            await logoutStudent();
            setExistingSession(null);
            setExistingRole(null);
            return;
          }

          let currentRole = 'student';
          if (profile && profile.role) {
            currentRole = profile.role;
          } else if (session.user.email === 'admin16@siddhartha.edu') {
            currentRole = 'admin';
          }
          
          setExistingRole(currentRole);

          if (currentRole === targetRole) {
            if (currentRole === 'admin') navigate('/admin', { replace: true });
            else if (currentRole === 'teacher') navigate('/teacher-dashboard', { replace: true });
            else navigate('/student-dashboard', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkExistingSession();
  }, [targetRole, navigate]);

  const handleLogoutAndSwitch = async () => {
    setIsLoading(true);
    await logoutStudent();
    setExistingSession(null);
    setExistingRole(null);
    setIsLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Both username and password are required');
      return;
    }

    setIsLoading(true);

    try {
      await loginStudent(username, password);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.email !== 'admin16@siddhartha.edu') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_active')
          .eq('id', session.user.id)
          .single();
          
        if (profile && profile.is_active === false) {
          await logoutStudent();
          throw new Error('Your account has been deactivated. Please contact the administrator.');
        }
      }

      if (username.toLowerCase() === 'admin' || isServerAdmin) {
        navigate('/admin', { replace: true });
        return;
      }

      if (isTeacher) {
        navigate('/teacher-dashboard', { replace: true });
      } else {
        navigate('/student-dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] flex items-center justify-center pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Animated Background Ornaments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-edu-blue/10 to-transparent blur-3xl opacity-60"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-edu-gold/10 to-transparent blur-3xl opacity-60"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-5xl bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-premium border border-white/80 overflow-hidden relative z-10 flex flex-col md:flex-row"
      >
        {/* Left Side: Brand & Visuals */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-edu-navy to-[#113a57] p-12 flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <motion.img 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              src="/logo.png" alt="Siddhartha EduHub" className="h-16 w-auto bg-white/10 backdrop-blur-md rounded-2xl p-2 shadow-lg mb-8" 
            />
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-4xl lg:text-5xl font-bold font-outfit leading-tight mb-4"
            >
              Welcome to <br/><span className="text-edu-gold">Siddhartha EduHub</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-blue-100 text-lg max-w-sm"
            >
              Your complete digital campus. Streamline academics, track progress, and stay connected.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="relative z-10 flex gap-4 text-blue-200/60"
          >
            <div className="flex items-center gap-2 text-sm"><Shield size={16} /> Secure Portal</div>
          </motion.div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white/50">
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex md:hidden justify-center mb-6">
              <img src="/logo.png" alt="Logo" className="h-16 w-auto shadow-sm rounded-xl" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 font-outfit flex items-center justify-center md:justify-start gap-3">
              {isServerAdmin ? <Shield className="text-edu-gold" size={32} /> : isTeacher ? <Presentation className="text-edu-blue" size={32} /> : <GraduationCap className="text-edu-blue" size={32} />}
              {isServerAdmin ? 'Admin Portal' : isTeacher ? 'Teacher Portal' : 'Student Portal'}
            </h2>
            <p className="mt-2 text-gray-500 font-medium">Please sign in to your account</p>
          </div>
          
          <AnimatePresence mode="wait">
            {isCheckingSession ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-edu-blue/20 border-t-edu-blue rounded-full animate-spin"></div>
              </motion.div>
            ) : existingRole && existingRole !== targetRole ? (
              <motion.div key="switch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-100 p-6 rounded-2xl text-center shadow-inner">
                  <User className="mx-auto h-12 w-12 text-edu-blue mb-4 bg-white p-2.5 rounded-2xl shadow-sm" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2 font-outfit">Active Session Detected</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    You are currently logged in as an <strong className="text-edu-navy capitalize">{existingRole}</strong>. 
                    Switch to the <strong className="text-edu-blue capitalize">{targetRole}</strong> portal?
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleLogoutAndSwitch}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70"
                    >
                      {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><RefreshCw size={18} /> Logout & Switch</>}
                    </button>
                    <button
                      onClick={() => {
                        if (existingRole === 'admin') navigate('/admin', { replace: true });
                        else if (existingRole === 'teacher') navigate('/teacher-dashboard', { replace: true });
                        else navigate('/student-dashboard', { replace: true });
                      }}
                      className="w-full py-3.5 px-4 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" onSubmit={handleLogin}>
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50/80 backdrop-blur-sm text-red-600 p-4 rounded-2xl flex items-start gap-3 text-sm font-medium border border-red-100 shadow-sm"
                    >
                      <AlertCircle size={20} className="shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block font-outfit">
                      {isServerAdmin ? 'Admin Username' : isTeacher ? 'Email or Username' : 'Roll Number'}
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-edu-blue">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-edu-blue transition-colors" />
                      </div>
                      <input
                        type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl bg-white/80 focus:bg-white focus:ring-4 focus:ring-edu-blue/10 focus:border-edu-blue transition-all duration-300 text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal outline-none shadow-sm"
                        placeholder={isServerAdmin ? "admin" : isTeacher ? "teacher@siddhartha.edu or teacher" : "e.g. 1001"}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block font-outfit">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-edu-blue transition-colors" />
                      </div>
                      <input
                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl bg-white/80 focus:bg-white focus:ring-4 focus:ring-edu-blue/10 focus:border-edu-blue transition-all duration-300 text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal outline-none shadow-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit" disabled={isLoading}
                    className="group relative w-full flex justify-center py-4 px-4 text-base font-bold rounded-2xl text-white bg-edu-navy hover:bg-edu-blue shadow-lg shadow-edu-navy/20 hover:shadow-xl hover:shadow-edu-blue/30 transform hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-edu-navy/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                    {isLoading ? (
                      <div className="flex items-center gap-2 relative z-10">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Authenticating...
                      </div>
                    ) : (
                      <span className="flex items-center gap-2 relative z-10">
                        Sign In
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </button>
                </div>
                
                <div className="text-center mt-8">
                  <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-edu-blue transition-colors">
                    <ArrowRight size={14} className="rotate-180" /> Return to Homepage
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
