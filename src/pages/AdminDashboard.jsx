import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  UploadCloud, FileText, CheckCircle, XCircle, 
  Users, AlertTriangle, ArrowRight, Loader2,
  Wallet, Database, Search, Plus, Shield, Book, GraduationCap, Award, Lightbulb
} from 'lucide-react';
import Papa from 'papaparse';
import { 
  adminBulkInsertStudents, getStudentSession, logoutStudent,
  getAdminFeesData, recordFeePayment, getStudentPayments,
  getAllProfiles, updateProfileRole, getAllStudentsInfo, toggleProfileStatus, updateStudentDetails, bulkPromoteStudents, deleteStudent, bulkDeleteStudents
} from '../lib/supabase';

const AdminDashboard = () => {
  const [authChecking, setAuthChecking] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'import'; // 'import' | 'fees'
  
  const setActiveTab = (tab) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    }, { replace: true });
  };
  
  // --- Bulk Import State ---
  const [importMode, setImportMode] = useState('new'); // 'new' | 'promote'
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  // --- Fees Management State ---
  const [feesData, setFeesData] = useState([]);
  const [isFetchingFees, setIsFetchingFees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Standard');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
  // --- Fee History State ---
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);
  const [studentPaymentHistory, setStudentPaymentHistory] = useState([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  // --- Role Management State ---
  const [profiles, setProfiles] = useState([]);
  const [isFetchingProfiles, setIsFetchingProfiles] = useState(false);
  const [updatingRoleFor, setUpdatingRoleFor] = useState(null);
  
  // --- Student Directory State ---
  const [directoryData, setDirectoryData] = useState([]);
  const [isFetchingDirectory, setIsFetchingDirectory] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);
  const [directorySearchQuery, setDirectorySearchQuery] = useState('');
  
  // --- Edit Student State ---
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const navigate = useNavigate();

  // Verify Admin Session
  useEffect(() => {
    const checkAdmin = async () => {
      const session = await getStudentSession();
      if (!session || session.user.email !== 'admin@siddhartha.edu') {
        navigate('/login?role=admin', { replace: true });
      } else {
        setAuthChecking(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (activeTab === 'fees') {
      fetchFeesData();
    } else if (activeTab === 'roles') {
      fetchProfilesData();
    } else if (activeTab === 'directory') {
      fetchDirectoryData();
    }
  }, [activeTab]);

  const fetchProfilesData = async () => {
    setIsFetchingProfiles(true);
    try {
      const data = await getAllProfiles();
      setProfiles(data);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    } finally {
      setIsFetchingProfiles(false);
    }
  };

  const handleRoleChange = async (profileId, newRole) => {
    setUpdatingRoleFor(profileId);
    try {
      await updateProfileRole(profileId, newRole);
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
    } catch (err) {
      alert("Error updating role: " + err.message);
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  const handleStatusChange = async (profileId, isActive) => {
    setUpdatingRoleFor(profileId);
    try {
      await toggleProfileStatus(profileId, isActive);
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_active: isActive } : p));
    } catch (err) {
      alert("Error updating status: " + err.message);
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  const fetchFeesData = async () => {
    setIsFetchingFees(true);
    try {
      const data = await getAdminFeesData();
      setFeesData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingFees(false);
    }
  };

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
      
      // Also update feesData if full_name or class changed
      setFeesData(prev => prev.map(s => s.id === updatedStudent.id ? { ...s, full_name: updatedStudent.full_name, class: updatedStudent.class, section: updatedStudent.section } : s));
      
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
      setFeesData(prev => prev.filter(s => s.id !== selectedStudentForCard.id));
      setSelectedStudentForCard(null);
      setIsEditingStudent(false);
      alert("Student deleted successfully.");
    } catch (err) {
      alert("Error deleting student: " + err.message);
    }
  };

  const handleLogout = async () => {
    await logoutStudent();
    navigate('/login?role=admin');
  };

  // --- Bulk Import Logic ---
  const EXPECTED_HEADERS = importMode === 'delete'
    ? ['roll_number']
    : importMode === 'promote'
      ? ['roll_number', 'class', 'total_fees']
      : [
          'username', 'password', 'full_name', 'class', 'section', 
          'roll_number', 'email', 'phone', 'address', 'total_fees'
        ];

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setErrorMessage('Please upload a valid CSV file.');
      return;
    }

    setFile(selectedFile);
    setErrorMessage('');
    setIsParsing(true);
    setUploadStatus(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields;
        const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setErrorMessage(`Missing required columns: ${missingHeaders.join(', ')}`);
          setPreviewData([]);
        } else {
          setPreviewData(results.data);
        }
        setIsParsing(false);
      },
      error: () => {
        setErrorMessage('Error reading the CSV file.');
        setIsParsing(false);
      }
    });
  };

  const confirmUpload = async () => {
    if (previewData.length === 0) return;
    
    setIsUploading(true);
    setErrorMessage('');

    try {
      if (importMode === 'delete') {
        if (!window.confirm(`DANGER: You are about to permanently delete ${previewData.length} students. All their fee records, marks, and profiles will be destroyed. Do you wish to proceed?`)) {
          setIsUploading(false);
          return;
        }
        const rollNumbers = previewData.map(student => student.roll_number);
        await bulkDeleteStudents(rollNumbers);
      } else if (importMode === 'promote') {
        const cleanedData = previewData.map(student => ({
          roll_number: student.roll_number,
          class: student.class,
          total_fees: student.total_fees
        }));
        await bulkPromoteStudents(cleanedData);
      } else {
        const cleanedData = previewData.map(student => {
          const cleanStudent = { ...student };
          delete cleanStudent.password;
          
          cleanStudent.total_fees = cleanStudent.total_fees ? parseInt(cleanStudent.total_fees, 10) : 0;
          cleanStudent.attendance_percentage = 0;
          cleanStudent.overall_marks = 0;
          cleanStudent.pending_fees = cleanStudent.total_fees;
          
          if (!cleanStudent.dob) cleanStudent.dob = '01012000'; 
          return cleanStudent;
        });

        await adminBulkInsertStudents(cleanedData);
      }
      
      setUploadStatus('success');
      setFile(null);
      setPreviewData([]);
    } catch (err) {
      setUploadStatus('error');
      if (err.code === '23505') {
        setErrorMessage('One or more usernames in this file already exist in the database. Please ensure all usernames are unique.');
      } else {
        setErrorMessage(err.message || 'Failed to insert records.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // --- Fees Management Logic ---
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentForPayment || !paymentAmount) return;

    const amount = parseInt(paymentAmount, 10);
    if (amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await recordFeePayment(selectedStudentForPayment.id, amount, selectedStudentForPayment.pending_fees, paymentType);
      alert('Payment recorded successfully!');
      setSelectedStudentForPayment(null);
      setPaymentAmount('');
      setPaymentType('Standard');
      fetchFeesData(); // Refresh the list
    } catch (err) {
      alert('Error recording payment: ' + err.message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleViewHistory = async (student) => {
    setSelectedStudentForHistory(student);
    setIsFetchingHistory(true);
    try {
      const history = await getStudentPayments(student.id);
      setStudentPaymentHistory(history);
    } catch (err) {
      alert("Error fetching history: " + err.message);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const filteredFeesData = feesData.filter(student => 
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectoryData = directoryData.filter(student => 
    student.full_name?.toLowerCase().includes(directorySearchQuery.toLowerCase()) || 
    student.roll_number?.toLowerCase().includes(directorySearchQuery.toLowerCase())
  );

  if (authChecking) {
    return <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center"><Loader2 className="animate-spin text-edu-navy" size={40} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] font-sans pb-12 relative overflow-hidden">
      {/* Background Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ y: [0, -20, 0], opacity: [0.05, 0.08, 0.05] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute top-20 left-10 text-edu-blue"
        >
          <GraduationCap size={120} />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 30, 0], opacity: [0.03, 0.06, 0.03] }} transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
          className="absolute top-60 right-20 text-edu-navy"
        >
          <Book size={150} />
        </motion.div>
        <motion.div 
          animate={{ y: [0, -15, 0], opacity: [0.04, 0.07, 0.04], rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 left-40 text-edu-gold"
        >
          <Award size={100} />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 25, 0], opacity: [0.03, 0.05, 0.03], rotate: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 3 }}
          className="absolute top-40 right-1/3 text-edu-blue"
        >
          <Lightbulb size={80} />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 flex flex-col items-center text-center"
        >
          <div className="inline-block relative">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-outfit">Admin Dashboard</h1>
            <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-gradient-to-r from-edu-gold to-yellow-300 rounded-full"></div>
          </div>
          <p className="text-gray-500 mt-4 text-lg max-w-2xl font-medium">Manage students, staff roles, and financials.</p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap justify-center bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm gap-2">
            <button
              onClick={() => setActiveTab('import')}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'import' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <Database size={18} /> Bulk Import
            </button>
            <button
              onClick={() => setActiveTab('fees')}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'fees' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <Wallet size={18} /> Fees Management
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'directory' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <Users size={18} /> Student Directory
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'roles' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <Shield size={18} /> Staff Roles
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {/* BULK IMPORT TAB */}
          {activeTab === 'import' && (
            <motion.div 
              key="import-tab"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column - Instructions & Upload */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Mode Toggle */}
                <div className="glass-card rounded-[2rem] p-2 flex flex-col sm:flex-row gap-2 bg-gray-100/50">
                  <button 
                    onClick={() => { setImportMode('new'); setFile(null); setPreviewData([]); setErrorMessage(''); setUploadStatus(null); }}
                    className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${importMode === 'new' ? 'bg-white shadow-md text-edu-navy' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Add New Students
                  </button>
                  <button 
                    onClick={() => { setImportMode('promote'); setFile(null); setPreviewData([]); setErrorMessage(''); setUploadStatus(null); }}
                    className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${importMode === 'promote' ? 'bg-white shadow-md text-edu-navy' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Yearly Promotion
                  </button>
                  <button 
                    onClick={() => { setImportMode('delete'); setFile(null); setPreviewData([]); setErrorMessage(''); setUploadStatus(null); }}
                    className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${importMode === 'delete' ? 'bg-red-50 shadow-md text-red-600 border border-red-100' : 'text-gray-500 hover:text-red-500'}`}
                  >
                    Bulk Delete
                  </button>
                </div>

                <div className="glass-card rounded-[2rem] p-8">
                  <h3 className="font-bold text-edu-navy mb-4 flex items-center gap-2">
                    <FileText className="text-edu-gold" size={20} /> CSV Format Requirements
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">Your file must include exactly the following column headers in the first row:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXPECTED_HEADERS.map(header => (
                      <span key={header} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono border border-gray-200">
                        {header}
                      </span>
                    ))}
                  </div>
                </div>

                <div 
                  onDragOver={e => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      fileInputRef.current.files = e.dataTransfer.files;
                      handleFileUpload({ target: { files: e.dataTransfer.files } });
                    }
                  }}
                  className={`glass-card rounded-[2rem] p-10 transition-all duration-300 text-center cursor-pointer border-2 ${file ? 'border-green-400 bg-green-50/50' : 'border-dashed border-gray-300 hover:border-edu-gold hover:bg-white/80 hover:shadow-apple'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  
                  {file ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="text-green-500 mb-3" size={48} />
                      <p className="font-bold text-gray-800">{file.name}</p>
                      <button className="mt-4 text-xs font-semibold text-edu-blue hover:underline" onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewData([]); }}>
                        Choose a different file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="text-gray-400 mb-4" size={48} />
                      <p className="font-bold text-edu-navy mb-1">Click to upload CSV</p>
                      <p className="text-sm text-gray-500">or drag and drop it here</p>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border border-red-100">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <p>{errorMessage}</p>
                  </div>
                )}
                {uploadStatus === 'success' && (
                  <div className="bg-green-50 text-green-700 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm border border-green-200">
                    <CheckCircle className="text-green-600 mb-3" size={32} />
                    <h3 className="font-bold text-lg mb-1">Import Successful!</h3>
                  </div>
                )}
              </div>

              {/* Right Column - Data Preview */}
              <div className="lg:col-span-2">
                <div className="glass-card rounded-[2rem] flex flex-col h-[600px] overflow-hidden shadow-apple">
                  <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-edu-blue">
                        <Users size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-edu-navy text-lg">Data Preview</h3>
                        <p className="text-xs text-gray-500">
                          {isParsing ? 'Parsing...' : previewData.length > 0 ? `${previewData.length} students found` : 'No data loaded'}
                        </p>
                      </div>
                    </div>
                    {previewData.length > 0 && (
                      <button onClick={confirmUpload} disabled={isUploading} className="flex items-center gap-2 bg-gradient-to-r from-edu-navy to-blue-900 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isUploading ? <><Loader2 size={18} className="animate-spin" /> Importing...</> : <>Import {previewData.length} Students <ArrowRight size={18} /></>}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto p-0">
                    {previewData.length > 0 ? (
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-white sticky top-0 shadow-sm z-10">
                          <tr className="text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold border-b">Name</th>
                            <th className="p-4 font-semibold border-b">Username</th>
                            <th className="p-4 font-semibold border-b">Class/Sec</th>
                            <th className="p-4 font-semibold border-b">Roll No</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {previewData.map((student, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-bold text-edu-navy">{student.full_name}</td>
                              <td className="p-4 text-gray-600 font-mono text-sm">{student.username}</td>
                              <td className="p-4 text-gray-600"><span className="bg-blue-50 text-edu-blue px-2 py-1 rounded text-xs font-semibold">{student.class}{student.section ? ` - ${student.section}` : ''}</span></td>
                              <td className="p-4 text-gray-600 font-medium">{student.roll_number}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <FileText size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-gray-500">Waiting for data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* FEES MANAGEMENT TAB */}
          {activeTab === 'fees' && (
            <motion.div 
              key="fees-tab"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass-card rounded-[2rem] flex flex-col min-h-[600px] overflow-hidden shadow-apple"
            >
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-edu-navy text-lg">Student Fees Dashboard</h3>
                    <p className="text-xs text-gray-500">View balances and add payments</p>
                  </div>
                </div>
                
                <div className="relative w-full sm:w-64">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search name or roll no..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-edu-blue/50 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto p-0">
                {isFetchingFees ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-edu-blue" size={32} />
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-white sticky top-0 shadow-sm z-10">
                      <tr className="text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
                        <th className="p-4 font-semibold border-b">Student</th>
                        <th className="p-4 font-semibold border-b">Class/Sec</th>
                        <th className="p-4 font-semibold border-b">Total Fees</th>
                        <th className="p-4 font-semibold border-b">Pending</th>
                        <th className="p-4 font-semibold border-b text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredFeesData.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-edu-navy">{student.full_name}</p>
                            <p className="text-xs text-gray-500">Roll: {student.roll_number}</p>
                          </td>
                          <td className="p-4 text-gray-600 text-sm">{student.class}{student.section ? ` - ${student.section}` : ''}</td>
                          <td className="p-4 text-gray-600 font-medium">₹{student.total_fees?.toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              student.pending_fees <= 0 ? 'bg-green-100 text-green-700' : 
                              student.pending_fees < student.total_fees ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              ₹{student.pending_fees?.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button 
                              onClick={() => handleViewHistory(student)}
                              className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors shadow-sm"
                            >
                              <FileText size={16} /> History
                            </button>
                            {student.pending_fees > 0 ? (
                              <button 
                                onClick={() => setSelectedStudentForPayment(student)}
                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-edu-navy to-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-apple transition-all shadow-premium"
                              >
                                <Plus size={16} /> Add Payment
                              </button>
                            ) : (
                              <span className="inline-flex items-center px-4 py-2 text-sm font-semibold text-green-600 bg-green-50 rounded-lg">Cleared</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredFeesData.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-gray-500">No students found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* ROLE MANAGEMENT TAB */}
          {activeTab === 'roles' && (
            <motion.div 
              key="roles-tab"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="glass-card rounded-[2rem] flex flex-col min-h-[600px] overflow-hidden shadow-apple"
            >
              <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-edu-navy text-lg">Staff Role Management</h3>
                    <p className="text-xs text-gray-500">Manage access levels for your staff</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-0">
                {isFetchingProfiles ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-edu-blue" size={32} />
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-white sticky top-0 shadow-sm z-10">
                      <tr className="text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
                        <th className="p-4 font-semibold border-b">Account Email</th>
                        <th className="p-4 font-semibold border-b">Current Role</th>
                        <th className="p-4 font-semibold border-b">Login Status</th>
                        <th className="p-4 font-semibold border-b">Change Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {profiles.map((profile) => (
                        <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-edu-navy">{profile.email || <span className="text-gray-400 italic">No email linked</span>}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              profile.role === 'admin' ? 'bg-red-100 text-red-700' : 
                              profile.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {profile.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleStatusChange(profile.id, profile.is_active === false ? true : false)}
                              disabled={updatingRoleFor === profile.id || profile.email === 'admin@siddhartha.edu'}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${profile.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.is_active !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className={`ml-3 text-xs font-bold ${profile.is_active !== false ? 'text-green-600' : 'text-gray-500'}`}>
                              {profile.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <select 
                                className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-edu-blue focus:border-edu-blue block p-2"
                                value={profile.role}
                                disabled={updatingRoleFor === profile.id || profile.email === 'admin@siddhartha.edu'}
                                onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                              >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                              </select>
                              {updatingRoleFor === profile.id && <Loader2 className="animate-spin text-edu-blue" size={16} />}
                              {profile.email === 'admin@siddhartha.edu' && <span className="text-xs text-gray-400 italic">Super Admin</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {profiles.length === 0 && (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-gray-500">No profiles found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* STUDENT DIRECTORY TAB */}
          {activeTab === 'directory' && (
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
                    <h3 className="font-bold text-edu-navy text-lg">Student Directory</h3>
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
                        {/* Decorative background gradient that appears on hover */}
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
          )}

        </AnimatePresence>
      </div>

      {/* PAYMENT MODAL */}
      <AnimatePresence>
        {selectedStudentForPayment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-edu-navy p-5 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg">Record Fee Payment</h3>
                <button onClick={() => setSelectedStudentForPayment(null)} className="text-white/70 hover:text-white transition-colors"><XCircle size={20} /></button>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-sm">
                  <p className="flex justify-between mb-2"><span className="text-gray-500">Student:</span> <span className="font-bold text-edu-navy">{selectedStudentForPayment.full_name} ({selectedStudentForPayment.roll_number})</span></p>
                  <p className="flex justify-between mb-2"><span className="text-gray-500">Total Fees:</span> <span className="font-semibold text-gray-700">₹{selectedStudentForPayment.total_fees?.toLocaleString()}</span></p>
                  <p className="flex justify-between"><span className="text-gray-500">Current Pending:</span> <span className="font-bold text-red-500">₹{selectedStudentForPayment.pending_fees?.toLocaleString()}</span></p>
                </div>

                <form onSubmit={handlePaymentSubmit}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Amount (₹)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={selectedStudentForPayment.pending_fees}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-edu-blue focus:border-edu-blue outline-none text-lg font-bold text-edu-navy"
                    placeholder="Enter amount"
                  />
                  
                  <div className="mt-4">
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Payment Type</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-edu-blue focus:border-edu-blue outline-none text-lg font-bold text-edu-navy"
                    >
                      <option value="Standard">Standard Payment (Cash/Online)</option>
                      <option value="Concession">Fee Concession / Discount</option>
                    </select>
                  </div>
                  
                  <div className="mt-8 flex gap-3">
                    <button type="button" onClick={() => setSelectedStudentForPayment(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmittingPayment}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {isSubmittingPayment ? <Loader2 size={20} className="animate-spin" /> : 'Confirm Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HISTORY MODAL */}
      <AnimatePresence>
        {selectedStudentForHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="bg-edu-navy p-5 text-white flex justify-between items-center shrink-0">
                <h3 className="font-bold text-lg flex items-center gap-2"><Wallet size={20} /> Payment History</h3>
                <button onClick={() => { setSelectedStudentForHistory(null); setStudentPaymentHistory([]); }} className="text-white/70 hover:text-white transition-colors"><XCircle size={20} /></button>
              </div>
              
              <div className="p-6 bg-gray-50 border-b border-gray-100 shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xl text-edu-navy">{selectedStudentForHistory.full_name}</h4>
                    <p className="text-sm text-gray-500">Roll No: {selectedStudentForHistory.roll_number} | Class {selectedStudentForHistory.class}{selectedStudentForHistory.section ? ` - ${selectedStudentForHistory.section}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Fees: <span className="font-semibold text-gray-700">₹{selectedStudentForHistory.total_fees?.toLocaleString()}</span></p>
                    <p className="text-sm text-gray-500">Pending: <span className="font-bold text-red-500">₹{selectedStudentForHistory.pending_fees?.toLocaleString()}</span></p>
                  </div>
                </div>
              </div>

              <div className="overflow-auto p-0 flex-1">
                {isFetchingHistory ? (
                  <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin text-edu-blue" size={32} /></div>
                ) : studentPaymentHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Wallet size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No payments have been recorded for this student yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-white sticky top-0 shadow-sm z-10">
                      <tr className="text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
                        <th className="p-4 font-semibold border-b">Transaction ID</th>
                        <th className="p-4 font-semibold border-b">Date & Time</th>
                        <th className="p-4 font-semibold border-b text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {studentPaymentHistory.map((payment, idx) => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-mono text-xs text-gray-500">
                            {payment.id.split('-')[0].toUpperCase()}
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${payment.payment_type === 'Concession' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {payment.payment_type || 'Standard'}
                            </span>
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">Installment {studentPaymentHistory.length - idx}</span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{new Date(payment.payment_date).toLocaleString()}</td>
                          <td className="p-4 text-right font-bold text-green-600">₹{payment.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STUDENT PROFILE CARD MODAL */}
      <AnimatePresence>
        {selectedStudentForCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Card Header Background */}
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

              {/* Profile Image & Header */}
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

              {/* Scrollable Content */}
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

                    {/* Financial Edit Section */}
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
                    
                    {/* Academic Info */}
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

                  {/* Personal Info */}
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

                  {/* Financial Info */}
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
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
