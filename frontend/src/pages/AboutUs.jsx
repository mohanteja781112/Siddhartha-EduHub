import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, BookOpen, Target, Eye, Shield, Users, 
  Trophy, Lightbulb, Heart, CheckCircle2, Award, ChevronRight, X, Monitor, Library, Activity, PenTool
} from 'lucide-react';

const CountUp = ({ end, duration = 2.5, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let startTime = null;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Easing function for smooth deceleration
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        setCount(Math.floor(easeOutQuart * end));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const AboutUs = () => {
  const [lightboxImg, setLightboxImg] = useState(null);

  // Close lightbox on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxImg(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const galleryImages = [
    { id: 1, src: "/campus5.jpeg", alt: "Main Campus Building", className: "md:col-span-2 md:row-span-2" },
    { id: 2, src: "/campus2.jpeg", alt: "Smart Classroom", className: "" },
    { id: 3, src: "/campus3.jpeg", alt: "Science Laboratory", className: "", imgClassName: "object-bottom" },
    { id: 4, src: "/campus4.jpeg", alt: "Library & Learning Center", className: "" },
    { id: 5, src: "/campus1.jpeg", alt: "Sports & Activities", className: "" },
  ];

  return (
    <div className="min-h-screen bg-[#FCFAF8] pt-[80px] font-sans pb-0 overflow-x-hidden">
      
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 md:py-28 overflow-hidden border-b border-edu-navy/5">
        {/* Decorative Background Elements (5-10% opacity) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5 text-edu-navy">
          <GraduationCap className="absolute top-10 left-[10%] w-32 h-32 rotate-[-15deg]" />
          <BookOpen className="absolute bottom-20 left-[5%] w-24 h-24 rotate-[10deg]" />
          <Award className="absolute top-20 right-[15%] w-40 h-40 rotate-[20deg]" />
          <Target className="absolute bottom-10 right-[5%] w-28 h-28 rotate-[-10deg]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-edu-gold/10 text-edu-gold font-bold text-sm mb-6 shadow-[0_0_15px_rgba(251,212,109,0.5)] border border-edu-gold/30 backdrop-blur-sm"
          >
            <Trophy size={16} />
            <span>Excellence in Education</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-poppins font-bold text-edu-navy mb-6 leading-tight"
          >
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-edu-gold to-yellow-600">Siddhartha EduHub</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            Empowering minds, nurturing character, and inspiring lifelong learning through academic excellence and holistic development.
          </motion.p>
        </div>
      </section>

      {/* School Introduction Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-poppins font-bold text-edu-navy leading-tight">
                A Legacy of <br/><span className="text-edu-gold">Academic Excellence</span>
              </h2>
              <div className="w-20 h-1.5 bg-gradient-to-r from-edu-gold to-yellow-500 rounded-full"></div>
              
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Established with a vision to redefine education, Siddhartha EduHub has grown into a premier institution dedicated to fostering intellectual curiosity and character development. Our rich history is built on the foundation of providing quality education that adapts to the changing world.
                </p>
                <p>
                  Our educational philosophy revolves around student-centered learning. We believe that every child is unique, and our approach is tailored to identify and nurture individual talents. By integrating traditional values with modern teaching methodologies, we prepare our students to excel in a globalized society.
                </p>
                <p>
                  At Siddhartha EduHub, education extends beyond the classroom walls. We emphasize holistic development, ensuring our students grow academically, socially, and emotionally in a supportive and stimulating environment.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative max-w-md mx-auto lg:ml-auto"
            >
              {/* Decorative background shadow */}
              <div className="absolute inset-0 bg-gradient-to-tr from-edu-navy to-edu-blue rounded-[2.5rem] transform translate-x-4 translate-y-4 opacity-20 transition-transform group-hover:translate-x-6 group-hover:translate-y-6"></div>
              
              {/* Main image container */}
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl group border-[8px] sm:border-[12px] border-white bg-gray-50">
                <img 
                  src="./school_image.png" 
                  alt="School Campus" 
                  className="w-full h-auto max-h-[700px] object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                
                {/* Premium gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-edu-navy/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-8">
                  <span className="text-white font-bold font-outfit tracking-wider text-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                    Siddhartha EduHub
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-[#FCFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-10 shadow-lg shadow-edu-navy/5 border border-edu-navy/5 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-100 text-edu-navy rounded-2xl flex items-center justify-center mb-6">
                  <Eye size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-poppins font-bold text-edu-navy mb-4">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  To create future-ready learners equipped with knowledge, values, creativity, and leadership skills, enabling them to make meaningful contributions to the global community.
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-10 shadow-lg shadow-edu-navy/5 border border-edu-navy/5 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-4 -mt-4 transition-transform duration-500 group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-amber-100 text-edu-gold rounded-2xl flex items-center justify-center mb-6">
                  <Target size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-poppins font-bold text-edu-navy mb-4">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">
                  To provide high-quality education that promotes academic excellence, character development, innovation, and social responsibility in a safe and nurturing environment.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* School Achievements (Count Up) */}
      <section className="py-20 bg-edu-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
           <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {[
              { icon: Users, end: 1000, suffix: '+', label: "Happy Students" },
              { icon: BookOpen, end: 50, suffix: '+', label: "Faculty Members" },
              { icon: Trophy, end: 95, suffix: '%', label: "Academic Success" },
              { icon: Award, end: 20, suffix: '+', label: "Years of Excellence" },
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 text-edu-gold">
                  <stat.icon size={32} />
                </div>
                <h4 className="text-4xl md:text-5xl font-bold font-poppins mb-2">
                  <CountUp end={stat.end} suffix={stat.suffix} />
                </h4>
                <p className="text-white/80 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-edu-navy mb-4">Why Choose Siddhartha EduHub</h2>
            <div className="w-24 h-1.5 bg-edu-gold rounded-full mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: "Academic Excellence", desc: "Top-quality education and highly experienced faculty." },
              { icon: Monitor, title: "Modern Learning", desc: "Smart classrooms and digital education tools." },
              { icon: Activity, title: "Holistic Development", desc: "Sports, arts, leadership, and extracurricular activities." },
              { icon: Shield, title: "Safe Environment", desc: "Secure, supportive, and student-friendly campus." },
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#FCFAF8] p-8 rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-edu-navy/5 transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-edu-navy group-hover:scale-110 group-hover:text-edu-gold transition-transform duration-300">
                  <feature.icon size={28} />
                </div>
                <h4 className="text-lg font-bold text-edu-navy mb-3">{feature.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Principal's Message */}
      <section className="py-20 bg-gradient-to-b from-[#FCFAF8] to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[40px] shadow-2xl shadow-edu-navy/5 overflow-hidden border border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
              <div className="lg:col-span-2 relative h-80 lg:h-auto">
                <img 
                  src="./siddhartha_principal.jpeg" 
                  alt="Principal" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent lg:hidden"></div>
                <div className="absolute bottom-6 left-6 lg:hidden text-white">
                  <h4 className="text-xl font-bold font-poppins">Dr. Adari Jaya sankar</h4>
                  <p className="text-white/80 text-sm">Correspondent, Siddhartha EduHub</p>
                </div>
              </div>
              <div className="lg:col-span-3 p-10 md:p-16 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-edu-gold/10 rounded-full flex items-center justify-center shrink-0 text-edu-gold">
                    <PenTool size={24} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-poppins font-bold text-edu-navy">Message from the Correspondent</h3>
                </div>
                <div className="space-y-4 text-gray-600 italic leading-relaxed mb-8">
                  <p>
                    "Education is not just about the accumulation of facts, but the preparation of life itself. At Siddhartha EduHub, we are committed to providing a vibrant learning environment that nurtures curiosity, instills strong moral values, and inspires our students to achieve their highest potential."
                  </p>
                  <p>
                    "We believe that every child has a spark of genius waiting to be ignited. Our dedicated faculty, state-of-the-art facilities, and comprehensive curriculum are all designed to fan that spark into a flame of brilliance. We invite you to join our community and embark on a journey of discovery and excellence."
                  </p>
                </div>
                <div className="hidden lg:block">
                  <h4 className="text-lg font-bold font-poppins text-edu-navy">Mr. Adari Jaya Sankar</h4>
                  <p className="text-gray-500 text-sm">Correspondent, Siddhartha EduHub</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School Gallery */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-edu-navy mb-4">Campus Life & Learning Environment</h2>
            <p className="text-gray-600">Explore our vibrant campus and enriching educational atmosphere.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
            {galleryImages.map((img) => (
              <motion.div 
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 0.98 }}
                onClick={() => setLightboxImg(img.src)}
                className={`relative rounded-2xl overflow-hidden cursor-pointer group shadow-lg shadow-black/5 ${img.className || ''}`}
              >
                <img 
                  src={img.src} 
                  alt={img.alt} 
                  className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${img.imgClassName || ''}`}
                />
                <div className="absolute inset-0 bg-edu-navy/0 group-hover:bg-edu-navy/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 font-medium translate-y-4 group-hover:translate-y-0 transition-all duration-300">View Image</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20 bg-[#FCFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-edu-navy mb-4">Our Core Values</h2>
            <div className="w-24 h-1.5 bg-edu-gold rounded-full mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { title: "Integrity", icon: Shield },
              { title: "Excellence", icon: Trophy },
              { title: "Innovation", icon: Lightbulb },
              { title: "Respect", icon: Heart },
              { title: "Leadership", icon: Target },
              { title: "Responsibility", icon: CheckCircle2 },
            ].map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md border border-gray-100 text-center group transition-all"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-edu-navy group-hover:bg-edu-navy group-hover:text-white transition-colors duration-300">
                  <value.icon size={24} />
                </div>
                <h4 className="text-lg font-bold text-gray-800">{value.title}</h4>
              </motion.div>
            ))}
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
            <Link to="/contact">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-full hover:bg-white/20 transition-colors w-full sm:w-auto"
              >
                Contact Us
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={() => setLightboxImg(null)}
          >
            <X size={32} />
          </button>
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={lightboxImg} 
            alt="Preview" 
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AboutUs;
