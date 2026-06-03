import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Award, ChevronRight } from 'lucide-react';

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-20">
      
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Abstract Blobs */}
        <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[20%] right-[10%] w-80 h-80 bg-edu-gold rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[10%] left-[20%] w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Floating Icons */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-[15%] text-edu-blue/20"
        >
          <BookOpen size={80} strokeWidth={1} />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 25, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/3 right-[15%] text-edu-gold/30"
        >
          <GraduationCap size={100} strokeWidth={1} />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/3 right-[25%] text-edu-navy/10"
        >
          <Award size={60} strokeWidth={1} />
        </motion.div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        
        {/* Floating Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="-mt-[130px] -mb-[116px] z-20 relative"
        >
          <motion.img 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            src="/logo.png" 
            alt="Siddhartha EduHub" 
            className="w-80 h-80 md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] object-contain drop-shadow-2xl"
          />
        </motion.div>

        {/* Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-[56px] text-3xl md:text-5xl font-extrabold font-poppins text-edu-navy leading-tight tracking-tight mb-6"
        >
          Empowering Minds, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-edu-blue to-blue-600">
            Shaping Futures
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl text-base md:text-lg text-gray-600 font-medium italic mb-10 leading-relaxed"
        >
          "Education is the most powerful weapon which you can use to change the world. Every student deserves a platform to learn, grow, and succeed."
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto"
        >
          {/* Admin Login Button */}
          <Link to="/admin" className="w-full sm:w-auto group">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-edu-navy to-blue-900 text-white font-semibold rounded-full shadow-[0_10px_20px_rgba(7,_42,_64,_0.3)] hover:shadow-[0_15px_30px_rgba(7,_42,_64,_0.4)] transition-all duration-300"
            >
              Admin Login
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>

          {/* Student Login Button */}
          <Link to="/login" className="w-full sm:w-auto">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full flex items-center justify-center px-8 py-4 bg-white text-edu-navy font-bold rounded-full border-2 border-edu-blue/30 hover:border-edu-blue shadow-[0_8px_20px_rgba(7,42,64,0.1)] hover:shadow-[0_15px_30px_rgba(7,42,64,0.15)] hover:bg-blue-50/50 transition-all duration-300"
            >
              Student Login
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
