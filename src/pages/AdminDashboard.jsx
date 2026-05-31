import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileText, CheckCircle, XCircle, 
  Users, AlertTriangle, ArrowRight, Loader2
} from 'lucide-react';
import Papa from 'papaparse';
import { adminBulkInsertStudents, getStudentSession, logoutStudent } from '../lib/supabase';

const AdminDashboard = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success' or 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [authChecking, setAuthChecking] = useState(true);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Verify Admin Session
  React.useEffect(() => {
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

  // Expected CSV columns
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
        // Validation check
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
      error: (error) => {
        setErrorMessage('Error reading the CSV file.');
        setIsParsing(false);
      }
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const confirmUpload = async () => {
    if (previewData.length === 0) return;
    
    setIsUploading(true);
    setErrorMessage('');

    try {
      // Clean data before insertion
      const cleanedData = previewData.map(student => {
        // We create a copy of the student object
        const cleanStudent = { ...student };
        
        // Remove the password field because we do NOT want to store plain-text passwords 
        // in the public.students table (they are securely stored in auth.users by the script)
        delete cleanStudent.password;

        // Ensure integer fields are properly cast
        cleanStudent.total_fees = cleanStudent.total_fees ? parseInt(cleanStudent.total_fees, 10) : 0;
        cleanStudent.attendance_percentage = 0;
        cleanStudent.overall_marks = 0;
        cleanStudent.pending_fees = cleanStudent.total_fees;
        
        // If dob is missing in CSV, provide a fallback or ensure it's handled
        if (!cleanStudent.dob) {
          cleanStudent.dob = '01012000'; // Default fallback if not in CSV
        }
        
        return cleanStudent;
      });

      await adminBulkInsertStudents(cleanedData);
      
      setUploadStatus('success');
      setFile(null);
      setPreviewData([]);
    } catch (err) {
      setUploadStatus('error');
      // Usually unique constraint errors (e.g. duplicate username)
      if (err.code === '23505') {
        setErrorMessage('One or more usernames in this file already exist in the database. Please ensure all usernames are unique.');
      } else {
        setErrorMessage(err.message || 'Failed to insert records.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await logoutStudent();
    navigate('/login?role=admin');
  };

  if (authChecking) {
    return <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans pb-12">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-edu-navy font-poppins">Bulk Student Import</h2>
          <p className="text-gray-500 mt-2">Upload a CSV file to enroll multiple students at once.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Instructions & Upload Zone */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-edu-navy mb-4 flex items-center gap-2">
                <FileText className="text-edu-gold" size={20} /> CSV Format Requirements
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your file must include exactly the following column headers in the first row:
              </p>
              <div className="flex flex-wrap gap-2">
                {EXPECTED_HEADERS.map(header => (
                  <span key={header} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono border border-gray-200">
                    {header}
                  </span>
                ))}
              </div>
            </div>

            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`bg-white rounded-3xl p-8 border-2 border-dashed transition-all duration-300 text-center cursor-pointer ${
                file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-edu-gold hover:bg-yellow-50/30'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="text-green-500 mb-3" size={48} />
                  <p className="font-bold text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
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

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border border-red-100"
                >
                  <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {uploadStatus === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 text-green-700 p-6 rounded-2xl flex flex-col items-center text-center shadow-sm border border-green-200"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Import Successful!</h3>
                  <p className="text-sm">The students have been successfully saved to the database.</p>
                </motion.div>
              )}
            </AnimatePresence>

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
                  <button 
                    onClick={confirmUpload}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-gradient-to-r from-edu-gold to-yellow-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <><Loader2 size={18} className="animate-spin" /> Importing...</>
                    ) : (
                      <>Import {previewData.length} Students <ArrowRight size={18} /></>
                    )}
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
                        <th className="p-4 font-semibold border-b">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {previewData.map((student, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-edu-navy">{student.full_name}</td>
                          <td className="p-4 text-gray-600 font-mono text-sm">{student.username}</td>
                          <td className="p-4 text-gray-600">
                            <span className="bg-blue-50 text-edu-blue px-2 py-1 rounded text-xs font-semibold">
                              {student.class} - {student.section}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 font-medium">{student.roll_number}</td>
                          <td className="p-4 text-gray-500 text-sm">{student.phone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <FileText size={64} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium text-gray-500">Waiting for data</p>
                    <p className="text-sm mt-2 max-w-sm">Upload a valid CSV file using the panel on the left to see a preview of the student data before importing.</p>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
