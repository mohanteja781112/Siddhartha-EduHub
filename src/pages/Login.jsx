import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { loginStudent } from '../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = new URLSearchParams(location.search).get('role');
  const isServerAdmin = role === 'admin';
  const isTeacher = role === 'teacher';

  const [username, setUsername] = useState(isServerAdmin ? 'admin' : '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Both username and password are required');
      return;
    }

    setIsLoading(true);

    try {
      // If admin logs in, route to admin portal
      if (username.toLowerCase() === 'admin') {
        await loginStudent(username, password);
        navigate('/admin');
        return;
      }

      // Authenticate against Supabase Auth (we will append @siddhartha.edu in the supabase.js wrapper)
      await loginStudent(username, password);
      // Success - redirect to correct dashboard
      if (isTeacher) {
        navigate('/teacher-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials and ensure Supabase is configured.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF8] pt-24 pb-12 flex items-center justify-center px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-edu-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-edu-gold/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/50 relative z-10"
      >
        <div className="text-center">
          <img src="/logo.png" alt="Siddhartha EduHub" className="mx-auto h-16 w-auto" />
          <h2 className="mt-6 text-3xl font-poppins font-bold text-edu-navy">
            {isServerAdmin ? 'Admin Portal' : isTeacher ? 'Teacher Portal' : 'Student Portal'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isServerAdmin ? 'Sign in with your admin credentials' : isTeacher ? 'Sign in with your teacher credentials' : 'Sign in to access your dashboard'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border border-red-100"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <div className="space-y-5">
            <div className="relative">
              <label className="text-sm font-semibold text-edu-navy mb-1.5 block">
                {isServerAdmin ? 'Admin Username' : isTeacher ? 'Teacher Email/Username' : 'Roll Number'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-3 py-3 border border-gray-200 rounded-xl bg-white/50 focus:ring-4 focus:ring-edu-gold/20 focus:border-edu-gold transition-all duration-300 text-edu-navy placeholder:text-gray-400"
                  placeholder="e.g. 1001 or admin"
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-edu-navy block">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-3 py-3 border border-gray-200 rounded-xl bg-white/50 focus:ring-4 focus:ring-edu-gold/20 focus:border-edu-gold transition-all duration-300 text-edu-navy placeholder:text-gray-400"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-edu-navy to-blue-900 hover:shadow-lg hover:shadow-blue-900/30 hover:-translate-y-0.5 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-edu-navy/20 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  {isServerAdmin ? 'Admin Login' : isTeacher ? 'Teacher Login' : 'Student Login'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </div>
          
          <div className="text-center mt-6">
            <Link to="/" className="text-sm font-medium text-gray-500 hover:text-edu-gold transition-colors">
              &larr; Return to Homepage
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
