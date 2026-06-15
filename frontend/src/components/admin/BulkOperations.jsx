import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle, XCircle, AlertTriangle, ArrowRight, Loader2, Users } from 'lucide-react';
import Papa from 'papaparse';
import { bulkPromoteStudents, bulkDeleteStudents } from '../../lib/supabase';

const BulkOperations = () => {
  const [importMode, setImportMode] = useState('promote'); // 'promote' | 'delete'
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  const EXPECTED_HEADERS = importMode === 'delete'
    ? ['roll_number']
    : ['roll_number', 'class', 'total_fees']; // 'promote' mode

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
      } else {
        const cleanedData = previewData.map(student => ({
          roll_number: student.roll_number,
          class: student.class,
          total_fees: student.total_fees
        }));
        await bulkPromoteStudents(cleanedData);
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

  return (
    <motion.div 
      key="import-tab"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* Left Column - Instructions & Upload */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Mode Toggle */}
        <div className="glass-card rounded-2xl p-2 flex flex-col sm:flex-row gap-2 bg-gray-100/50">
          <button 
            onClick={() => { setImportMode('promote'); setFile(null); setPreviewData([]); setErrorMessage(''); setUploadStatus(null); }}
            className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${importMode === 'promote' ? 'bg-gradient-to-r from-edu-navy to-blue-900 shadow-md text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Yearly Promotion
          </button>
          <button 
            onClick={() => { setImportMode('delete'); setFile(null); setPreviewData([]); setErrorMessage(''); setUploadStatus(null); }}
            className={`flex-1 py-2 px-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${importMode === 'delete' ? 'bg-red-600 shadow-md text-white border border-red-700' : 'text-gray-500 hover:text-red-500'}`}
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
                      <td className="p-4 font-bold text-edu-navy">{student.full_name || 'N/A'}</td>
                      <td className="p-4 text-gray-600 font-mono text-sm">{student.username || 'N/A'}</td>
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
  );
};

export default BulkOperations;
