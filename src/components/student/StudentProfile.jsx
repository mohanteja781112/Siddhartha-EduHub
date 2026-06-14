import React from 'react';
import { motion } from 'framer-motion';
import { User, Calendar as CalendarIcon, GraduationCap, FileText, CreditCard, BookOpen } from 'lucide-react';

const StudentProfile = ({ 
  profile, 
  marks, 
  activeTerm, 
  setActiveTerm, 
  availableExams, 
  setActiveTab 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="space-y-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-[2rem] p-8 relative overflow-hidden text-center flex flex-col items-center shadow-apple"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-edu-navy via-[#1e4b78] to-edu-blue opacity-90"></div>
          <div className="relative z-10 flex flex-col items-center mt-6">
            <img 
              src={profile?.student_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Student')}&background=0f172a&color=fff&size=150&bold=true`} 
              alt="Student Profile" 
              className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover bg-white"
            />
            <h2 className="mt-4 text-2xl font-bold text-edu-navy">{profile?.full_name}</h2>
            <div className="flex items-center gap-2 mt-1 mb-6 px-3 py-1 bg-blue-50 text-edu-blue rounded-full text-sm font-semibold">
              <GraduationCap size={16} /> Class {profile?.class}{profile?.section ? ` - ${profile.section}` : ''}
            </div>
            <div className="w-full space-y-4 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <User size={16} className="text-edu-gold" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400">Roll Number</p>
                  <p className="font-semibold text-edu-navy">{profile?.roll_number}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <User size={16} className="text-edu-gold" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400">Parent Name</p>
                  <p className="font-semibold text-edu-navy">{profile?.parent_name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                  <CalendarIcon size={16} className="text-edu-gold" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-gray-400">Date of Birth</p>
                  <p className="font-semibold text-edu-navy">
                    {profile?.dob ? (() => {
                      const d = new Date(profile.dob);
                      return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
                    })() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
            onClick={() => setActiveTab('exams')}
            className="glass-card rounded-[2rem] p-6 shadow-apple hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center gap-5 cursor-pointer border border-transparent hover:border-blue-100 group"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br from-blue-500 to-edu-blue group-hover:scale-105 transition-transform">
              <FileText size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-0.5">Pending Exams</p>
              <h3 className="text-2xl font-bold text-gray-900 font-outfit">
                {availableExams.length > 0 ? (
                    <span className="text-red-500">{availableExams.length} Due</span>
                ) : (
                    <span className="text-green-500">All Clear</span>
                )}
              </h3>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            onClick={() => setActiveTab('fees')}
            className="glass-card rounded-[2rem] p-6 shadow-apple hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center gap-5 cursor-pointer border border-transparent hover:border-red-100 group"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br from-orange-400 to-red-500 group-hover:scale-105 transition-transform">
              <CreditCard size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-0.5">Fee Dues</p>
              <h3 className="text-2xl font-bold text-gray-900 font-outfit">
                {profile?.pending_fees > 0 ? (
                    <span className="text-red-500">₹{(profile.pending_fees).toLocaleString()}</span>
                ) : (
                    <span className="text-green-500">No Dues</span>
                )}
              </h3>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-[2rem] overflow-hidden shadow-apple">
          <div className="p-8 border-b border-white/50 bg-white/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900 font-outfit flex items-center gap-2">
              <BookOpen className="text-edu-gold" size={22} /> Academic Records
            </h3>
            {marks.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {Array.from(new Set(marks.map(m => m.exam_type || 'FA1'))).map(term => (
                  <button
                    key={term}
                    onClick={() => setActiveTerm(term)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                      (activeTerm === term || (!activeTerm && term === 'FA1'))
                        ? 'bg-edu-navy text-white' 
                        : 'bg-white/60 text-gray-600 hover:bg-white'
                    }`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider"><th className="p-4 font-bold">Subject</th><th className="p-4 font-bold text-right">Marks</th></tr></thead>
              <tbody>
                {marks.filter(m => (m.exam_type || 'FA1') === (activeTerm || 'FA1')).length > 0 ? (
                  marks.filter(m => (m.exam_type || 'FA1') === (activeTerm || 'FA1')).map(mark => (
                    <tr key={mark.id} className="border-b border-gray-100/50 hover:bg-white/50 transition-colors">
                      <td className="p-4 font-bold text-gray-800">{mark.subject}</td>
                      <td className="p-4 font-semibold text-edu-blue text-right">{mark.marks_obtained} / {mark.total_marks || 100}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="2" className="p-4 text-center text-gray-500">No marks available for this term.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentProfile;
