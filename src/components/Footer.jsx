import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

const SocialIcons = {
  Facebook: ({ size = 24, ...props }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  Instagram: ({ size = 24, ...props }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>,
  Youtube: ({ size = 24, ...props }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>,
  Linkedin: ({ size = 24, ...props }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
};

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-edu-navy text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* Logo & About */}
          <div className="space-y-6 lg:col-span-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Siddhartha EduHub" className="h-12 w-auto bg-white rounded-full p-1" />
              <span className="font-poppins font-bold text-xl">Siddhartha EduHub</span>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              Empowering minds and shaping futures through quality education, holistic development, and a commitment to academic excellence.
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="font-poppins font-semibold text-lg mb-6 border-b border-white/20 pb-2 inline-block">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: 'Home', path: '/' },
                { name: 'About Us', path: '/about' },
                { name: 'Contact Us', path: '/contact' }
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path}
                    className="text-gray-300 hover:text-edu-gold transition-colors duration-200 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-edu-gold/50 group-hover:bg-edu-gold transition-colors"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-4">
            <h3 className="font-poppins font-semibold text-lg mb-6 border-b border-white/20 pb-2 inline-block">Contact Us</h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-edu-gold shrink-0 mt-0.5" />
                <span>Siddhartha e-Techno School,<br />Anakapalle, Andhra Pradesh, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-edu-gold shrink-0" />
                <span>+91 90301 82586</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-edu-gold shrink-0" />
                <a href="mailto:siddharthaenglishmedium2005@gmail.com" className="hover:text-white transition-colors break-all">siddharthaenglishmedium2005@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="lg:col-span-2">
            <h3 className="font-poppins font-semibold text-lg mb-6 border-b border-white/20 pb-2 inline-block">Follow Us</h3>
            <div className="flex gap-4">
              {[
                { Icon: SocialIcons.Facebook, href: '#' },
                { Icon: SocialIcons.Instagram, href: '#' },
                { Icon: SocialIcons.Youtube, href: '#' },
                { Icon: SocialIcons.Linkedin, href: '#' }
              ].map(({ Icon, href }, index) => (
                <a 
                  key={index} 
                  href={href}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-edu-gold hover:text-edu-navy transition-all duration-300"
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
            <div className="mt-8">
              <Link 
                to="/contact"
                className="inline-block px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-sm font-medium hover:bg-white hover:text-edu-navy transition-colors duration-300"
              >
                Request Information
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>&copy; {currentYear} Siddhartha EduHub. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
