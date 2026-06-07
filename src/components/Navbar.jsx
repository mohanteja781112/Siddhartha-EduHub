import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { logoutStudent, supabase } from '../lib/supabase';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const handleLogout = () => {
    logoutStudent();
    navigate('/login');
  };

  useEffect(() => {
    const fetchUserRole = async (userId) => {
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
      if (data) {
        setUserRole(data.role);
      }
    };

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        fetchUserRole(session.user.id);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchUserRole(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getDashboardLink = () => {
    if (userRole === 'admin' || userRole === 'super_admin') return '/admin';
    if (userRole === 'teacher') return '/teacher-dashboard';
    return '/student-dashboard';
  };

  const isDashboard = location.pathname.includes('-dashboard') || location.pathname.includes('/admin');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Teacher Portal', href: '/teacher-dashboard' },
  ];

  const filteredNavLinks = navLinks.filter(link => {
    if (user && link.name === 'Teacher Portal') return false;
    return true;
  });

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
      isDashboard 
        ? 'pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none' 
        : (isScrolled ? 'bg-white/70 backdrop-blur-lg shadow-md border-b border-white/50' : 'bg-white/30 backdrop-blur-md border-b border-white/20')
    }`}>
      <nav
        className={`w-full flex justify-between items-center transition-all duration-300 ${
          isDashboard 
            ? `pointer-events-auto glass-panel text-gray-800 px-6 py-3 rounded-2xl shadow-sm border border-white/60 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-apple' : 'bg-white/60 backdrop-blur-sm'}`
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 text-gray-800'
        }`}
      >
        <div className="flex justify-between items-center w-full">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer">
            <img className="h-10 w-auto bg-white rounded-xl shadow-sm p-1 object-contain" src="/logo.png" alt="Siddhartha EduHub Logo" />
            <span className="ml-3 font-outfit font-bold text-xl text-edu-navy hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-edu-navy to-edu-blue">
              Siddhartha EduHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            {filteredNavLinks.map((link) => {
              const isActive = location.pathname === link.href || (link.href !== '/' && location.pathname.startsWith(link.href));
              return (
              <Link
                key={link.name}
                to={link.href}
                className={`${isActive ? 'text-edu-blue font-bold' : 'text-gray-600 font-semibold'} hover:text-edu-blue text-sm transition-colors duration-200 relative group`}
              >
                {link.name}
                <span className={`absolute left-0 -bottom-1 h-0.5 bg-edu-gold transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
            )})}
            {isDashboard ? (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <LogOut size={16} /> Logout
              </button>
            ) : user ? (
              <Link to={getDashboardLink()}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-edu-gold to-yellow-500 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
                  <UserIcon size={20} />
                </div>
              </Link>
            ) : (
              <Link to="/admission">
                <button className="bg-gradient-to-r from-edu-gold to-yellow-500 text-white text-sm px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-edu-gold/50 transition-all duration-300 shadow-md shadow-edu-gold/30 hover:-translate-y-0.5">
                  Apply Now
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-edu-navy focus:outline-none"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`md:hidden pointer-events-auto glass-panel bg-white/95 mx-auto overflow-hidden shadow-apple border border-white/60 p-2 ${
            isDashboard ? 'mt-2 rounded-xl' : 'mt-0 rounded-b-2xl border-t-0'
          }`}
        >
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3 flex flex-col">
            {filteredNavLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
              <Link
                key={link.name}
                to={link.href}
                className={`${isActive ? 'text-edu-blue bg-edu-blue/5 font-bold' : 'text-gray-600 font-semibold'} hover:text-edu-blue hover:bg-white/50 block px-3 py-2 rounded-xl text-base transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            )})}
            <div className="border-t border-gray-100 mt-2 pt-4 space-y-3">
              {isDashboard ? (
                <button 
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-bold transition-all duration-300 shadow-md"
                >
                  <LogOut size={20} /> Logout
                </button>
              ) : user ? (
                <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-edu-gold to-yellow-500 text-white text-base px-5 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-edu-gold/50 transition-all duration-300 shadow-md shadow-edu-gold/30">
                    <UserIcon size={20} /> Go to Dashboard
                  </button>
                </Link>
              ) : (
                <Link to="/admission" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full bg-gradient-to-r from-edu-gold to-yellow-500 text-white text-base px-5 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-edu-gold/50 transition-all duration-300 shadow-md shadow-edu-gold/30">
                    Apply Now
                  </button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Navbar;
