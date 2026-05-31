import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

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
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 py-4 ${
        isScrolled ? 'glassmorphism shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer">
            <img className="h-10 w-auto object-contain" src="/logo.png" alt="Siddhartha EduHub Logo" />
            <span className="ml-3 font-poppins font-bold text-xl text-edu-navy hidden sm:block">
              Siddhartha EduHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
              <Link
                key={link.name}
                to={link.href}
                className={`${isActive ? 'text-edu-blue' : 'text-edu-navy'} hover:text-edu-blue font-medium transition-colors duration-200 relative group`}
              >
                {link.name}
                <span className={`absolute left-0 -bottom-1 h-0.5 bg-edu-gold transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </Link>
            )})}
            <Link to="/login">
              <button className="text-edu-navy font-bold hover:text-edu-blue transition-colors duration-200">
                Student Portal
              </button>
            </Link>
            <Link to="/admission">
              <button className="bg-gradient-to-r from-edu-gold to-yellow-500 text-white px-6 py-2.5 rounded-full font-bold hover:shadow-lg hover:shadow-edu-gold/50 transition-all duration-300 shadow-md shadow-edu-gold/30 hover:-translate-y-0.5">
                Apply Now
              </button>
            </Link>
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
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden glassmorphism mt-2 mx-4 rounded-xl overflow-hidden"
        >
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3 flex flex-col">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
              <Link
                key={link.name}
                to={link.href}
                className={`${isActive ? 'text-edu-blue bg-edu-blue/5' : 'text-edu-navy'} hover:text-edu-blue hover:bg-white/50 block px-3 py-2 rounded-md font-medium transition-colors`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            )})}
            <div className="border-t border-gray-100 mt-2 pt-4 space-y-3">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-blue-50 text-edu-navy px-5 py-3 rounded-xl font-bold hover:bg-blue-100 transition-colors shadow-sm">
                  Student Portal
                </button>
              </Link>
              <Link to="/admission" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full bg-gradient-to-r from-edu-gold to-yellow-500 text-white px-5 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-edu-gold/50 transition-all duration-300 shadow-md shadow-edu-gold/30">
                  Apply Now
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
