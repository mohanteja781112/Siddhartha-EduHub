import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Loader2, ArrowRight, XCircle, Book, Wallet } from 'lucide-react';
import { getAllStudentsInfo, updateStudentDetails, deleteStudent } from '../../lib/supabase';

const StudentDirectory = () => {
  const [directoryData, setDirectoryData] = useState([]);
  const [isFetchingDirectory, setIsFetchingDirectory] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  useEffect(() => {
    fetchDirectoryData();
  }, []);

  const fetchDirectoryData = async () => {
    setIsFetchingDirectory(true);
    try {
      const data = await getAllStudentsInfo();
      setDirectoryData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingDirectory(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingEdit(true);
    try {
      const newTotalFees = parseInt(editStudentForm.total_fees, 10) || 0;
      let newPreviousDues = parseInt(editStudentForm.previous_dues, 10) || 0;
      let newPendingFees = selectedStudentForCard.pending_fees || 0;

      if (editStudentForm.reset_pending) {
        newPendingFees = newPreviousDues + newTotalFees;
      } else if (newTotalFees !== (selectedStudentForCard.total_fees || 0) || newPreviousDues !== (selectedStudentForCard.previous_dues || 0)) {
        const oldTotalAndDues = (selectedStudentForCard.total_fees || 0) + (selectedStudentForCard.previous_dues || 0);
        const newTotalAndDues = newTotalFees + newPreviousDues;
        const delta = newTotalAndDues - oldTotalAndDues;
        newPendingFees = Math.max(0, newPendingFees + delta);
      }

      const updates = {
        full_name: editStudentForm.full_name,
        class: editStudentForm.class,
        section: editStudentForm.section,
        parent_name: editStudentForm.parent_name,
        dob: editStudentForm.dob,
        phone: editStudentForm.phone,
        address: editStudentForm.address,
        total_fees: newTotalFees,
        previous_dues: newPreviousDues,
        pending_fees: newPendingFees
      };
      
      const updatedStudent = await updateStudentDetails(selectedStudentForCard.id, updates);
      
      // Update local state to reflect changes instantly
      setDirectoryData(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      setSelectedStudentForCard(updatedStudent);
      setIsEditingStudent(false);
      
      alert("Student profile updated successfully!");
    } catch (err) {
      alert("Error updating student: " + err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete ${selectedStudentForCard.full_name}? This action cannot be undone and will delete all their fee payments, marks, and records.`)) {
      return;
    }
    
    try {
      await deleteStudent(selectedStudentForCard.id);
      setDirectoryData(prev => prev.filter(s => s.id !== selectedStudentForCard.id));
      setSelectedStudentForCard(null);
      setIsEditingStudent(false);
      alert("Student deleted successfully.");
    } catch (err) {
      alert("Error deleting student: " + err.message);
    }
  };

  const filteredDirectoryData = directoryData.filter(student => 
    student.full_name?.toLowerCase().includes(directorySearchQuery.toLowerCase()) || 
    student.roll_number?.toLowerCase().includes(directorySearchQuery.toLowerCase())
  );

  return (
    <>
      <motion.div 
        key="directory-tab"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
        className="glass-card rounded-[2rem] flex flex-col min-h-[600px] overflow-hidden shadow-apple"
      >
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold text-edu-navy text-lg">Student Directory <span className="text-sm font-normal text-orange-700 ml-2 bg-orange-200/50 px-2 py-0.5 rounded-full">{filteredDirectoryData.length}</span></h3>
              <p className="text-xs text-gray-500">View complete student profiles</p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search name or roll no..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-edu-blue/50 text-sm"
              value={directorySearchQuery}
              onChange={(e) => setDirectorySearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-0 bg-gray-50/50">
          {isFetchingDirectory ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-edu-blue" size={32} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {filteredDirectoryData.map((student, index) => (
                <motion.div 
                  key={student.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-[1.5rem] p-6 cursor-pointer group flex flex-col transition-all duration-300 shadow-sm hover:shadow-apple border border-gray-100 hover:border-edu-blue/20 relative overflow-hidden"
                  onClick={() => setSelectedStudentForCard(student)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-edu-blue/5 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    {student.student_photo ? (
                      <motion.img 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        src={student.student_photo}
                        alt="Student"
                        className="w-16 h-16 rounded-full border-[3px] border-white shadow-md object-cover group-hover:border-edu-blue/30 transition-all duration-300"
                      />
                    ) : (
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-16 h-16 rounded-full border-[3px] border-white shadow-md flex items-center justify-center bg-gradient-to-br from-edu-navy to-blue-800 text-white text-2xl font-bold group-hover:shadow-lg transition-all duration-300"
                      >
                        {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
                      </motion.div>
                    )}
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full shadow-sm ${student.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {student.status || 'Active'}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1 leading-tight line-clamp-1 group-hover:text-edu-blue transition-colors relative z-10">{student.full_name}</h4>
                  <p className="text-sm text-gray-500 font-medium mb-4 relative z-10">Roll: <span className="text-edu-navy font-bold">{student.roll_number}</span></p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-500 items-center relative z-10">
                    <span className="font-medium bg-gray-50 px-3 py-1 rounded-lg">Class {student.class}{student.section ? `-${student.section}` : ''}</span>
                    <span className="flex items-center text-edu-navy font-bold group-hover:text-edu-blue transition-colors text-xs gap-1">
                      View Profile <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>
                </motion.div>
              ))}
              {filteredDirectoryData.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500">
                  <Users size={48} className="mx-auto mb-3 opacity-20" />
                  <p>No students found matching your search.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* STUDENT PROFILE CARD MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedStudentForCard && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="h-32 bg-gradient-to-r from-edu-navy via-[#1e4b78] to-edu-blue relative shrink-0">
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    <button 
                      onClick={() => {
                        if (isEditingStudent) {
                          setIsEditingStudent(false);
                        } else {
                          setEditStudentForm({
                            full_name: selectedStudentForCard.full_name || '',
                            class: selectedStudentForCard.class || '',
                            section: selectedStudentForCard.section || '',
                            parent_name: selectedStudentForCard.parent_name || '',
                            dob: selectedStudentForCard.dob || '',
                            phone: selectedStudentForCard.phone || '',
                            address: selectedStudentForCard.address || '',
                            total_fees: selectedStudentForCard.total_fees || 0,
                            previous_dues: selectedStudentForCard.previous_dues || 0,
                            reset_pending: false
                          });
                          setIsEditingStudent(true);
                        }
                      }} 
                      className="text-white/80 hover:text-white bg-black/20 hover:bg-black/40 px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm text-sm font-semibold flex items-center gap-1"
                    >
                      {isEditingStudent ? 'Cancel Edit' : 'Edit Profile'}
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedStudentForCard(null);
                        setIsEditingStudent(false);
                      }} 
                      className="text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-full transition-colors backdrop-blur-sm"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>

                <div className="px-6 sm:px-10 relative pb-6 shrink-0 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-16 sm:-mt-12 relative z-10">
                    {selectedStudentForCard.student_photo ? (
                      <img 
                        src={selectedStudentForCard.student_photo}
                        alt="Student"
                        className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-white shrink-0"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center bg-edu-navy text-white text-5xl font-bold shrink-0">
                        {selectedStudentForCard.full_name ? selectedStudentForCard.full_name.charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}
                    <div className="pb-2">
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{selectedStudentForCard.full_name}</h2>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${selectedStudentForCard.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {selectedStudentForCard.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-edu-blue font-semibold text-lg">Roll Number: {selectedStudentForCard.roll_number}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:px-10 overflow-y-auto flex-1 bg-gray-50/30">
                  {isEditingStudent ? (
                    <form onSubmit={handleEditSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                          <input type="text" required value={editStudentForm.full_name} onChange={(e) => setEditStudentForm({...editStudentForm, full_name: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-edu-blue focus:border-edu-blue outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Parent/Guardian Name</label>
                          <input type="text" value={editStudentForm.parent_name} onChange={(e) => setEditStudentForm({...editStudentForm, parent_name: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-edu-blue focus:border-edu-blue outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Class</label>
                          <input type="text" required value={editStudentForm.class} onChange={(e) => setEditStudentForm({...editStudentForm, class: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-edu-blue focus:border-edu-blue outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Section</label>
                          <input type="text" value={editStudentForm.section} onChange={(e) => setEditStudentForm({...editStudentForm, section: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-edu-blue focus:border-edu-blue outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Date of Birth</label>
                          <input type="date" value={editStudentForm.dob ? new Date(editStudentForm.dob).toISOString().split('T')[0] : ''} onChange={(e) => setEditStudentForm({...editStudentForm, dob: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-edu-blue focus:border-edu-blue outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                          <input type="text" value={editStudentForm.phone} onChange={(e) => setEditStudentForm({...editStudentForm, phone: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-edu-blue focus:border-edu-blue outline-none text-sm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Address</label>
                          <textarea value={editStudentForm.address} onChange={(e) => setEditStudentForm({...editStudentForm, address: e.target.value})} className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-edu-blue focus:border-edu-blue outline-none text-sm min-h-[80px]"></textarea>
                        </div>
                      </div>

                      <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl space-y-4">
                        <h4 className="font-bold text-orange-800 text-sm flex items-center gap-2"><Wallet size={16} /> Manage Financials</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-orange-900 uppercase tracking-wider mb-1">Total Fees (Current Year)</label>
                            <input type="number" required min="0" value={editStudentForm.total_fees} onChange={(e) => setEditStudentForm({...editStudentForm, total_fees: e.target.value})} className="w-full p-2.5 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm font-bold text-orange-900" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-orange-900 uppercase tracking-wider mb-1">Previous Year Dues</label>
                            <input type="number" min="0" value={editStudentForm.previous_dues} onChange={(e) => setEditStudentForm({...editStudentForm, previous_dues: e.target.value})} className="w-full p-2.5 bg-white border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-400 outline-none text-sm font-bold text-red-600" />
                          </div>
                        </div>
                        
                        <label className="flex items-start gap-3 mt-4 p-3 bg-white rounded-xl border border-orange-200 cursor-pointer hover:bg-orange-100/50 transition-colors">
                          <div className="flex items-center h-5">
                            <input type="checkbox" checked={editStudentForm.reset_pending} onChange={(e) => setEditStudentForm({...editStudentForm, reset_pending: e.target.checked})} className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                          </div>
                          <div className="text-sm">
                            <span className="font-bold text-gray-900">Reset Pending Fees for New Academic Year</span>
                            <p className="text-gray-500 text-xs mt-0.5">Check this if you are promoting the student. It sets their pending balance to: <span className="font-bold text-orange-800">(Previous Dues + Current Year Total)</span></p>
                          </div>
                        </label>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <button 
                          type="button" 
                          onClick={handleDeleteStudent}
                          className="text-red-600 hover:text-red-800 font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm flex items-center gap-2"
                        >
                          <XCircle size={16} /> Delete Student Permanently
                        </button>
                        <button type="submit" disabled={isSubmittingEdit} className="bg-gradient-to-r from-edu-navy to-blue-900 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2">
                          {isSubmittingEdit ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider border-b border-gray-200 pb-2 flex items-center gap-2"><Book size={16} className="text-edu-gold" /> Academic Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Class & Section</p>
                          <p className="font-bold text-gray-900">{selectedStudentForCard.class} {selectedStudentForCard.section ? `- ${selectedStudentForCard.section}` : ''}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">System Username</p>
                          <p className="font-mono text-sm font-semibold text-gray-700 break-all">{selectedStudentForCard.username}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Overall Marks</p>
                          <p className="font-bold text-gray-900">{selectedStudentForCard.overall_marks || 0}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Attendance</p>
                          <p className="font-bold text-gray-900">{selectedStudentForCard.attendance_percentage || 0}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider border-b border-gray-200 pb-2 flex items-center gap-2"><Users size={16} className="text-edu-gold" /> Personal Details</h3>
                      <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div>
                          <p className="text-xs text-gray-500">Parent/Guardian Name</p>
                          <p className="font-medium text-gray-900">{selectedStudentForCard.parent_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="font-medium text-gray-900">{selectedStudentForCard.dob ? new Date(selectedStudentForCard.dob).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone Number</p>
                          <p className="font-medium text-gray-900">{selectedStudentForCard.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="font-medium text-gray-900">{selectedStudentForCard.address || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 mt-2">
                      <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider border-b border-gray-200 pb-2 flex items-center gap-2"><Wallet size={16} className="text-edu-gold" /> Financial Status</h3>
                      <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <div className="flex-1 bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Total Fees</p>
                          <p className="font-bold text-2xl text-edu-navy">₹{(selectedStudentForCard.total_fees || 0).toLocaleString()}</p>
                        </div>
                        {(selectedStudentForCard.previous_dues > 0) && (
                          <div className="flex-1 bg-gradient-to-br from-orange-50 to-white p-4 rounded-xl border border-orange-100 shadow-sm">
                            <p className="text-xs text-orange-600 mb-1">Previous Year Dues</p>
                            <p className="font-bold text-2xl text-orange-700">₹{(selectedStudentForCard.previous_dues || 0).toLocaleString()}</p>
                          </div>
                        )}
                        <div className={`flex-1 p-4 rounded-xl border shadow-sm ${selectedStudentForCard.pending_fees > 0 ? 'bg-gradient-to-br from-red-50 to-white border-red-100' : 'bg-gradient-to-br from-green-50 to-white border-green-100'}`}>
                          <p className="text-xs text-gray-500 mb-1">Pending Balance</p>
                          <p className={`font-bold text-2xl ${selectedStudentForCard.pending_fees > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{(selectedStudentForCard.pending_fees || 0).toLocaleString()}
                          </p>
                          {selectedStudentForCard.pending_fees <= 0 && <p className="text-xs font-semibold text-green-700 mt-1">✓ Fully Paid</p>}
                        </div>
                      </div>
                    </div>

                  </div>
                  )}
                </div>
                
                <div className="p-4 sm:px-6 bg-gray-50 border-t border-gray-100 shrink-0 flex justify-end">
                  <button 
                    onClick={() => setSelectedStudentForCard(null)}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors"
                  >
                    Close Profile
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default StudentDirectory;
