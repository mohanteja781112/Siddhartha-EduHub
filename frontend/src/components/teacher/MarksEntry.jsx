import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, UploadCloud, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { getAllStudentsInfo, adminBulkInsertMarks } from '../../lib/supabase';

const MarksEntry = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('FA1');
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [studentsCache, setStudentsCache] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getAllStudentsInfo().then(setStudentsCache);
  }, []);

  const handleMarksFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    Papa.parse(selectedFile, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const rawData = results.data;
        if (rawData.length === 0) {
          setIsParsing(false);
          return;
        }

        const headers = Object.keys(rawData[0]).map(k => k.trim());
        const hasSubject = headers.some(h => h.toLowerCase() === 'subject');
        const hasMarks = headers.some(h => h.toLowerCase() === 'marks');

        let normalizedData = [];

        if (hasSubject && hasMarks) {
           normalizedData = rawData.map(row => {
             const rollKey = Object.keys(row).find(k => k.toLowerCase().replace(/[\s_]/g, '') === 'rollnumber');
             const subjKey = Object.keys(row).find(k => k.toLowerCase() === 'subject');
             const marksKey = Object.keys(row).find(k => k.toLowerCase() === 'marks');
             const totalMarksKey = Object.keys(row).find(k => k.toLowerCase().replace(/[\s_]/g, '') === 'totalmarks');
             return {
               roll_number: row[rollKey],
               subject: row[subjKey],
               marks: row[marksKey],
               total_marks: totalMarksKey ? row[totalMarksKey] : 100
             };
           });
        } else {
           const ignoreCols = ['name', 'studentname', 'student_name', 'student', 'id', 'sno', 's.no'];
           
           rawData.forEach(row => {
             const rollKey = Object.keys(row).find(k => k.toLowerCase().replace(/[\s_]/g, '') === 'rollnumber');
             const totalMarksKey = Object.keys(row).find(k => k.toLowerCase().replace(/[\s_]/g, '') === 'totalmarks');
             const rollNumber = row[rollKey];
             const totalMarks = totalMarksKey ? row[totalMarksKey] : 100;
             if (!rollNumber) return;

             Object.keys(row).forEach(key => {
                const normalizedKey = key.trim();
                const lowerKey = normalizedKey.toLowerCase().replace(/[\s_]/g, '');
                
                if (lowerKey !== 'rollnumber' && lowerKey !== 'totalmarks' && !ignoreCols.includes(lowerKey)) {
                   if (row[key] && String(row[key]).trim() !== '') {
                     normalizedData.push({
                       roll_number: rollNumber,
                       subject: normalizedKey,
                       marks: row[key],
                       total_marks: totalMarks
                     });
                   }
                }
             });
           });
        }

        setPreviewData(normalizedData);
        setIsParsing(false);
      }
    });
  };

  const confirmMarksUpload = async () => {
    if (previewData.length === 0) return;
    setIsUploading(true);
    try {
      const marksToInsert = [];
      const errors = [];
      previewData.forEach(row => {
        const student = studentsCache.find(s => s.roll_number === row.roll_number);
        if (student) {
          marksToInsert.push({ student_id: student.id, subject: row.subject, marks_obtained: row.marks, exam_type: selectedTerm, total_marks: row.total_marks || 100 });
        } else {
          errors.push(`Roll number ${row.roll_number} not found.`);
        }
      });
      if (errors.length > 0) {
        alert("Warnings/Errors:\n" + errors.join('\n'));
        if (marksToInsert.length === 0) { setIsUploading(false); return; }
        if (!window.confirm(`Found ${marksToInsert.length} valid records. Proceed?`)) { setIsUploading(false); return; }
      }
      await adminBulkInsertMarks(marksToInsert);
      alert('Marks uploaded successfully!');
      setFile(null); setPreviewData([]);
    } catch (err) { 
      alert("Error: " + err.message); 
    } finally { 
      setIsUploading(false); 
    }
  };

  return (
    <motion.div 
      key="marks-tab"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-card rounded-[2rem] p-8 shadow-apple">
          <h3 className="font-bold text-edu-navy mb-4 flex items-center gap-2">
            <Database className="text-edu-gold" size={20} /> Academic Records
          </h3>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Enter Term</label>
            <input 
              list="exam-terms"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue outline-none font-bold text-edu-navy"
              placeholder="e.g., FA1, SA1, etc."
            />
            <datalist id="exam-terms">
              <option value="FA1">FA1 (Formative Assessment 1)</option>
              <option value="FA2">FA2 (Formative Assessment 2)</option>
              <option value="SA1">SA1 (Summative Assessment 1)</option>
              <option value="FA3">FA3 (Formative Assessment 3)</option>
              <option value="FA4">FA4 (Formative Assessment 4)</option>
              <option value="SA2">SA2 (Summative Assessment 2)</option>
              <option value="Final Exams">Final Exams</option>
            </datalist>
          </div>
          
          <div 
            onDragOver={e => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                fileInputRef.current.files = e.dataTransfer.files;
                handleMarksFileUpload({ target: { files: e.dataTransfer.files } });
              }
            }}
            className={`border-2 border-dashed p-8 rounded-2xl text-center cursor-pointer transition-all ${file ? 'border-green-400 bg-green-50/50' : 'border-gray-300 hover:border-edu-gold hover:bg-white/80'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleMarksFileUpload} className="hidden" />
            {file ? (
              <div className="flex flex-col items-center">
                <CheckCircle className="text-green-500 mb-3" size={40} />
                <p className="font-bold text-gray-800 text-sm">{file.name}</p>
                <button className="mt-2 text-xs text-edu-blue hover:underline" onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewData([]); }}>Remove</button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="text-gray-400 mb-3" size={40} />
                <p className="font-bold text-edu-navy text-sm mb-1">Click to upload marks CSV</p>
                <p className="text-xs text-gray-500">or drag and drop</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="glass-card rounded-[2rem] flex flex-col h-[500px] overflow-hidden shadow-apple">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-edu-navy text-lg">Data Preview</h3>
              <p className="text-xs text-gray-500">{isParsing ? 'Parsing...' : previewData.length > 0 ? `${previewData.length} records found` : 'No data loaded'}</p>
            </div>
            {previewData.length > 0 && (
              <button 
                onClick={confirmMarksUpload} 
                disabled={isUploading || studentsCache.length === 0} 
                className="bg-gradient-to-r from-edu-navy to-blue-900 text-white px-6 py-2 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all text-sm"
              >
                {isUploading ? 'Uploading...' : 'Save to Database'}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-0">
            {previewData.length > 0 ? (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-white sticky top-0 shadow-sm z-10">
                  <tr className="text-gray-400 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold border-b">Roll No</th>
                    <th className="p-4 font-semibold border-b">Subject</th>
                    <th className="p-4 font-semibold border-b">Marks</th>
                    <th className="p-4 font-semibold border-b">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-edu-navy">{row.roll_number}</td>
                      <td className="p-4 text-gray-600">{row.subject}</td>
                      <td className="p-4 font-bold text-edu-blue">{row.marks}</td>
                      <td className="p-4 text-gray-600">{row.total_marks || 100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400"><p>Waiting for data</p></div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarksEntry;
