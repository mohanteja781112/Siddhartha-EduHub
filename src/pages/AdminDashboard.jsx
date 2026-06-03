import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileText, CheckCircle, XCircle, 
  Users, AlertTriangle, ArrowRight, Loader2,
  Wallet, Database, Search, Plus, Shield
} from 'lucide-react';
import Papa from 'papaparse';
import { 
  adminBulkInsertStudents, getStudentSession, logoutStudent,
  getAdminFeesData, recordFeePayment, getStudentPayments,
  getAllProfiles, updateProfileRole
} from '../lib/supabase';

const AdminDashboard = () => {
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'fees'
  
  // --- Bulk Import State ---
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
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
  // --- Fee History State ---
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);
  const [studentPaymentHistory, setStudentPaymentHistory] = useState([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  // --- Role Management State ---
  const [profiles, setProfiles] = useState([]);
  const [isFetchingProfiles, setIsFetchingProfiles] = useState(false);
  const [updatingRoleFor, setUpdatingRoleFor] = useState(null);
  const navigate = useNavigate();

  // Verify Admin Session
  useEffect(() => {
    const checkAdmin = async () => {
      const session = await getStudentSession();
      if (!session || session.user.email !== 'admin@siddhartha.edu') {
        navigate('/login?role=admin');
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

  const handleLogout = async () => {
    await logoutStudent();
    navigate('/login?role=admin');
  };

  // --- Bulk Import Logic ---
  const EXPECTED_HEADERS = [
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
      await recordFeePayment(selectedStudentForPayment.id, amount, selectedStudentForPayment.pending_fees);
      alert('Payment recorded successfully!');
      setSelectedStudentForPayment(null);
      setPaymentAmount('');
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

  if (authChecking) {
    return <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center"><Loader2 className="animate-spin text-edu-navy" size={40} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans pb-12 relative">
      {/* Top Navbar */}
      <nav className="bg-gradient-to-r from-gray-900 to-edu-navy text-white px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto bg-white rounded-full p-1" />
            <h1 className="font-poppins font-bold text-lg hidden sm:block">EduHub | Admin Portal</h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm font-semibold hover:text-edu-gold transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-4 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'import' ? 'border-edu-blue text-edu-navy bg-blue-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <Database size={18} /> Bulk Import
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'fees' ? 'border-edu-blue text-edu-navy bg-blue-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <Wallet size={18} /> Fees Management
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'roles' ? 'border-edu-blue text-edu-navy bg-blue-50/50 rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <Shield size={18} /> Staff Roles
          </button>
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
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
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
                  className={`bg-white rounded-3xl p-8 border-2 border-dashed transition-all duration-300 text-center cursor-pointer ${file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-edu-gold hover:bg-yellow-50/30'}`}
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
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[600px] flex flex-col">
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
                      <button onClick={confirmUpload} disabled={isUploading} className="flex items-center gap-2 bg-gradient-to-r from-edu-gold to-yellow-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
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
                              <td className="p-4 text-gray-600"><span className="bg-blue-50 text-edu-blue px-2 py-1 rounded text-xs font-semibold">{student.class} - {student.section}</span></td>
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
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]"
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
                          <td className="p-4 text-gray-600 text-sm">{student.class} - {student.section}</td>
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
                                className="inline-flex items-center gap-1.5 bg-edu-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-edu-blue transition-colors shadow-sm"
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
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]"
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
                    <p className="text-sm text-gray-500">Roll No: {selectedStudentForHistory.roll_number} | Class {selectedStudentForHistory.class}-{selectedStudentForHistory.section}</p>
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
    </div>
  );
};

export default AdminDashboard;
