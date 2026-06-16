import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, ChevronDown, Send, GraduationCap, BookOpen, Award, BookMarked, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SocialIcons = {
  Facebook: ({ size = 24, ...props }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  Instagram: ({ size = 24, ...props }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>,
  Youtube: ({ size = 24, ...props }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>,
  Linkedin: ({ size = 24, ...props }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
};

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-edu-navy/10 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-5 text-left focus:outline-none"
      >
        <span className="font-poppins font-medium text-edu-navy pr-4">{question}</span>
        <ChevronDown 
          className={`w-5 h-5 text-edu-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-5 pt-0 text-gray-600 leading-relaxed border-t border-edu-navy/5">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("https://formsubmit.co/ajax/siddharthaenglishmedium2005@gmail.com", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: "New Inquiry from Website",
          _template: "table",
          "Name": formData.name,
          "Phone Number": formData.phone || "N/A",
          "Message": formData.message
        })
      });

      const data = await response.json();
      
      if (data.success === "true" || data.success === true) {
        setIsSuccess(true);
        // Reset form
        setFormData({ name: '', phone: '', message: '' });
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        alert("Failed to submit form. Please try again.");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("An error occurred while sending the message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF8] pt-[80px] font-sans pb-0 overflow-x-hidden">
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 overflow-hidden border-b border-edu-navy/5">
        {/* Decorative Background Elements (5-10% opacity) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5 text-edu-navy">
          <GraduationCap className="absolute top-10 left-[10%] w-32 h-32 rotate-[-15deg]" />
          <BookOpen className="absolute bottom-10 left-[20%] w-24 h-24 rotate-[10deg]" />
          <Award className="absolute top-20 right-[15%] w-40 h-40 rotate-[25deg]" />
          <BookMarked className="absolute bottom-20 right-[5%] w-20 h-20 rotate-[-20deg]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-poppins text-edu-navy mb-6"
          >
            Get In Touch
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600 leading-relaxed"
          >
            We're here to help students, parents, and educators. Reach out to us for admissions, academic inquiries, support, or general information.
          </motion.p>
        </div>
      </section>

      {/* Info Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              icon: MapPin,
              title: "Visit Us",
              lines: ["Siddhartha e-Techno School", "Anakapalle, Andhra Pradesh, India"]
            },
            {
              icon: Phone,
              title: "Call Us",
              lines: ["+91 90301 82586", "+91 81219 96757"]
            },
            {
              icon: Mail,
              title: "Email Us",
              lines: ["siddharthaenglishmedium2005@gmail.com", "adarikishan16@gmail.com"]
            }
          ].map((card, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-lg shadow-edu-navy/5 border border-edu-navy/5 text-center flex flex-col items-center hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-edu-gold">
                <card.icon className="w-8 h-8" />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-edu-navy mb-4">{card.title}</h3>
              {card.lines.map((line, i) => (
                <p key={i} className="text-gray-600">{line}</p>
              ))}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Contact Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column - Contact Info & Socials */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div>
              <h2 className="text-3xl font-poppins font-bold text-edu-navy mb-8">Contact Information</h2>
              <div className="space-y-6 text-gray-600">
                <div>
                  <h4 className="font-semibold text-edu-navy mb-1">School Name:</h4>
                  <p>Siddhartha e-Techno School</p>
                </div>
                <div>
                  <h4 className="font-semibold text-edu-navy mb-1">Address:</h4>
                  <p>Sagi Subbaraju gari veedhi, near RamRaj cotton shop, Anakapalle - 531002</p>
                </div>
                <div>
                  <h4 className="font-semibold text-edu-navy mb-1">Phone:</h4>
                  <p>+91 90301 82586</p>
                  <p>+91 81219 96757</p>
                </div>
                <div>
                  <h4 className="font-semibold text-edu-navy mb-1">Email:</h4>
                  <p>siddharthaenglishmedium2005@gmail.com</p>
                </div>
                <div>
                  <h4 className="font-semibold text-edu-navy mb-1">Working Hours:</h4>
                  <p>Monday – Saturday, 9:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-poppins font-bold text-edu-navy mb-6">Connect With Us</h2>
              <div className="flex gap-4">
                {[SocialIcons.Facebook, SocialIcons.Instagram, SocialIcons.Youtube, SocialIcons.Linkedin].map((Icon, idx) => (
                  <a 
                    key={idx} 
                    href="#"
                    className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-edu-navy hover:bg-edu-navy hover:text-edu-gold transition-colors duration-300 shadow-sm"
                  >
                    <Icon size={24} />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Premium Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
          >
            <h2 className="text-2xl font-poppins font-bold text-edu-navy mb-8">Send Us A Message</h2>
            <form className="space-y-6" onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-edu-gold focus:border-transparent transition-all bg-gray-50 focus:bg-white" placeholder="Ram" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-edu-gold focus:border-transparent transition-all bg-gray-50 focus:bg-white" placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea name="message" value={formData.message} onChange={handleInputChange} required rows="5" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-edu-gold focus:border-transparent transition-all bg-gray-50 focus:bg-white resize-none" placeholder="How can we help you?"></textarea>
              </div>
              <motion.button 
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-edu-navy to-blue-900 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send Message
                  </>
                )}
              </motion.button>
              {isSuccess && (
                <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 text-center font-medium">
                  Your message has been sent successfully! We'll get back to you soon.
                </div>
              )}
            </form>
          </motion.div>

        </div>
      </section>

      {/* Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-poppins font-bold text-edu-navy mb-4">Find Us</h2>
          <p className="text-gray-600">Visit our campus and experience a world-class learning environment.</p>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl overflow-hidden shadow-2xl shadow-edu-navy/10 border border-white/50 glassmorphism h-[400px] relative bg-gray-200"
        >
          {/* Using an iframe to query the exact school location */}
          <iframe 
            src="https://maps.google.com/maps?q=17.687029,83.01358&t=&z=16&ie=UTF8&iwloc=&output=embed" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="School Location Map"
            className="absolute inset-0 grayscale hover:grayscale-0 transition-all duration-700"
          ></iframe>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-poppins font-bold text-edu-navy mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Quick answers to common questions about Siddhartha EduHub.</p>
          </div>
          <div className="space-y-4">
            <FAQItem 
              question="How can I apply for admission?" 
              answer="You can apply online through our admissions portal or visit the school campus during working hours to collect an application form. Our admissions team will guide you through the process." 
            />
            <FAQItem 
              question="How do I access the student portal?" 
              answer="Once enrolled, students and parents are provided with unique login credentials. Click on the 'Student Login' button on the homepage to access grades, schedules, and announcements." 
            />
            <FAQItem 
              question="Who can I contact for technical support?" 
              answer="For any technical issues regarding the student or parent portal, please email support@siddharthaeduhub.com or call our technical helpdesk during school hours." 
            />
            <FAQItem 
              question="How can parents track student progress?" 
              answer="Parents can log into the dedicated Parent Portal to monitor attendance, academic performance, teacher remarks, and upcoming events in real-time." 
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 relative overflow-hidden bg-edu-navy">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-edu-navy to-blue-900 opacity-90"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-edu-gold/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-poppins font-bold text-white mb-6 leading-tight"
          >
            Ready to Become Part of Our Learning Community?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/80 mb-10 max-w-2xl mx-auto"
          >
            Join Siddhartha EduHub and experience education that inspires success, creativity, and lifelong growth.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <Link to="/admission">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-edu-gold to-yellow-500 text-white font-bold rounded-full shadow-lg shadow-edu-gold/30 hover:shadow-edu-gold/50 flex items-center gap-2 w-full sm:w-auto"
              >
                Apply Now <ChevronRight size={20} />
              </motion.button>
            </Link>
            <Link to="/about">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-full hover:bg-white/20 transition-colors w-full sm:w-auto"
              >
                About Us
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default ContactUs;
