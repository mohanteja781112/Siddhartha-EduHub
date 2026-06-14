import React, { useState, useEffect, useRef } from 'react';
import { supabase, logoutStudent, getAllStudentsInfo, adminBulkInsertMarks } from '../lib/supabase';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { LogOut, BookOpen, FileSpreadsheet, Plus, GraduationCap, Book, Award, Lightbulb, ArrowLeft, Trash2, Database, UploadCloud, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'exams'; // 'exams' | 'marks'
  const setActiveTab = (tab) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    }, { replace: true });
  };
  const view = searchParams.get('view') || 'list';
  const [selectedExam, setSelectedExam] = useState(null);

  // Marks Upload State
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState('FA1');
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [studentsCache, setStudentsCache] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if ((view === 'questions' || view === 'results') && !selectedExam) {
      setSearchParams({ view: 'list' }, { replace: true });
    }
  }, [view, selectedExam, setSearchParams]);
  
  // New Exam Form State
  const [newExam, setNewExam] = useState({ title: '', class: 'X', subject: '', time_limit_minutes: 30 });
  
  const toRoman = (val) => {
    const map = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V', '6': 'VI', '7': 'VII', '8': 'VIII', '9': 'IX', '10': 'X' };
    return map[String(val)] || val;
  };
  
  // New Question Form State
  const [newQuestion, setNewQuestion] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: ['A'], marks: 1
  });
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);

  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [accessDeniedRole, setAccessDeniedRole] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login?role=teacher', { replace: true });
      return;
    }

    // Verify role to prevent "leftover" student logins from accessing teacher portal
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
      setAccessDeniedRole(profile?.role || 'None/Unknown');
      setIsAuthChecking(false);
      return;
    }

    setIsAuthChecking(false);
    fetchExams();
  };

  const handleLogout = () => {
    logoutStudent();
    navigate('/login?role=teacher');
  };

  useEffect(() => {
    if (activeTab === 'marks' && studentsCache.length === 0) {
      getAllStudentsInfo().then(setStudentsCache);
    }
  }, [activeTab, studentsCache.length]);

  const fetchExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching exams:', error);
    } else {
      setExams(data || []);
    }
    setLoading(false);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) {
      alert("Please login first");
      navigate('/login');
      return;
    }

    const { data, error } = await supabase
      .from('exams')
      .insert([
        { ...newExam, created_by: userData.user.id, is_active: false }
      ])
      .select();

    if (error) {
      alert('Error creating exam: ' + error.message);
    } else {
      alert('Exam created successfully!');
      setSearchParams({ view: 'list' });
      fetchExams();
      setNewExam({ title: '', class: 'X', subject: '', time_limit_minutes: 30 });
    }
  };

  const fetchQuestions = async (examId) => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId);
    if (!error) setQuestions(data || []);
  };

  const fetchResults = async (examId) => {
    const { data, error } = await supabase
      .from('student_exam_results')
      .select(`
        *,
        students (
          full_name, roll_number
        )
      `)
      .eq('exam_id', examId);
    if (!error) setResults(data || []);
  };

  const handleLaunchExam = async () => {
    if (!selectedExam) return;
    const { error } = await supabase
      .from('exams')
      .update({ is_active: true })
      .eq('id', selectedExam.id);

    if (error) {
      alert('Error launching exam: ' + error.message);
    } else {
      alert('Exam Launched successfully! Students can now see it.');
      setSelectedExam({ ...selectedExam, is_active: true });
      fetchExams();
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam? This will also delete all its questions and student results. This action cannot be undone.")) return;

    // First delete questions and results to avoid foreign key errors
    await supabase.from('questions').delete().eq('exam_id', examId);
    await supabase.from('student_exam_results').delete().eq('exam_id', examId);

    const { error } = await supabase.from('exams').delete().eq('id', examId);
    
    if (error) {
      alert("Error deleting exam: " + error.message);
    } else {
      fetchExams();
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExam) return;

      const questionToSave = { 
        ...newQuestion, 
        exam_id: selectedExam.id,
        correct_option: newQuestion.correct_option.sort().join(',')
      };

      const { error } = await supabase
      .from('questions')
      .insert([questionToSave]);

    if (error) {
      alert('Error adding question: ' + error.message);
    } else {
      alert('Question added!');
      setNewQuestion({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: ['A'], marks: 1 });
      fetchQuestions(selectedExam.id);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    const { error } = await supabase.from('questions').delete().eq('id', questionId);
    
    if (error) {
      alert("Error deleting question: " + error.message);
    } else {
      fetchQuestions(selectedExam.id);
    }
  };

  const tableContainerClass = "glass-card p-8 rounded-[2rem] shadow-apple border-white/80 transition-all duration-300";

  const renderExamList = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={tableContainerClass}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 font-outfit">Managed Exams</h2>
        <button 
          onClick={() => setSearchParams({ view: 'create' })}
          className="flex items-center gap-2 bg-gradient-to-r from-edu-navy to-blue-900 text-white px-6 py-3 rounded-xl hover:shadow-apple transition-all duration-300 shadow-premium transform hover:-translate-y-0.5 font-bold group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
          Create New Exam
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edu-blue"></div>
        </div>
      ) : exams.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No exams created yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100/50 bg-white/50 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-600 border-b border-gray-100 sticky top-0 backdrop-blur-md">
                <th className="p-5 font-semibold text-sm tracking-wide">Title</th>
                <th className="p-5 font-semibold text-sm tracking-wide">Class</th>
                <th className="p-5 font-semibold text-sm tracking-wide">Subject</th>
                <th className="p-5 font-semibold text-sm tracking-wide">Time (Mins)</th>
                <th className="p-5 font-semibold text-sm tracking-wide">Status</th>
                <th className="p-5 font-semibold text-sm tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={exam.id} 
                  className="border-b border-gray-50 even:bg-gray-50/40 hover:bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                >
                  <td className="p-5 font-medium text-gray-800">{exam.title}</td>
                  <td className="p-5 text-gray-600">Class {toRoman(exam.class)}</td>
                  <td className="p-5 text-gray-600">{exam.subject}</td>
                  <td className="p-5 text-gray-600">{exam.time_limit_minutes}</td>
                  <td className="p-5">
                    {(() => {
                      const isExpired = (new Date() - new Date(exam.created_at)) > 24 * 60 * 60 * 1000;
                      if (isExpired) {
                        return (
                          <span className="px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm inline-block bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300">
                            Expired (24h+)
                          </span>
                        );
                      }
                      return (
                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm inline-block
                          ${exam.is_active 
                            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200 shadow-green-100' 
                            : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-100'}`}
                        >
                          {exam.is_active ? 'Active' : 'Inactive'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-5 flex gap-2">
                    <button 
                      onClick={() => { setSelectedExam(exam); fetchQuestions(exam.id); setSearchParams({ view: 'questions' }); }}
                      className="flex items-center gap-1.5 text-sm bg-white/80 backdrop-blur-sm text-edu-blue border border-edu-blue/20 px-3 py-2 rounded-lg hover:bg-edu-blue hover:text-white transition-all duration-300 shadow-sm hover:shadow-edu-blue/30 hover:-translate-y-0.5"
                    >
                      <BookOpen size={16} /> Manage Questions
                    </button>
                    <button 
                      onClick={() => { setSelectedExam(exam); fetchResults(exam.id); setSearchParams({ view: 'results' }); }}
                      className="flex items-center gap-1.5 text-sm bg-white/80 backdrop-blur-sm text-purple-600 border border-purple-200 px-3 py-2 rounded-lg hover:bg-purple-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-purple-600/30 hover:-translate-y-0.5"
                    >
                      <FileSpreadsheet size={16} /> View Results
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="flex items-center justify-center text-sm bg-white/80 backdrop-blur-sm text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-red-600/30 hover:-translate-y-0.5"
                      title="Delete Exam"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );

  const renderCreateExam = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`${tableContainerClass} max-w-2xl mx-auto`}
    >
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-gray-800 font-outfit">Create New Exam</h2>
        <button onClick={() => setSearchParams({ view: 'list' })} className="flex items-center gap-1.5 bg-white text-gray-600 hover:text-edu-navy hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-apple border border-gray-200 hover:-translate-y-0.5 px-5 py-2.5 rounded-xl text-sm font-bold"><ArrowLeft size={16} /> Cancel</button>
      </div>
      
      <form onSubmit={handleCreateExam} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Title</label>
          <input 
            type="text" required
            className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue focus:bg-white outline-none transition-all duration-200"
            value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})}
            placeholder="e.g. Weekly Math Test 1"
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
            <select 
              className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue focus:bg-white outline-none transition-all duration-200"
              value={newExam.class} onChange={e => setNewExam({...newExam, class: e.target.value})}
            >
              {['I','II','III','IV','V','VI','VII','VIII','IX','X'].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
            <input 
              type="text" required
              className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue focus:bg-white outline-none transition-all duration-200"
              value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})}
              placeholder="e.g. Mathematics"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Limit (Minutes)</label>
          <input 
            type="number" required min="1"
            className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue focus:bg-white outline-none transition-all duration-200"
            value={newExam.time_limit_minutes} onChange={e => setNewExam({...newExam, time_limit_minutes: e.target.value})}
          />
        </div>
        <div className="pt-6">
          <button type="submit" className="w-full bg-gradient-to-r from-edu-navy to-[#1e4b78] text-white py-3.5 rounded-xl hover:from-edu-blue hover:to-[#1e4b78] transition-all duration-300 font-semibold shadow-lg shadow-edu-blue/20 transform hover:-translate-y-0.5 hover:shadow-xl">
            Create Exam
          </button>
        </div>
      </form>
    </motion.div>
  );

  const renderQuestions = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className={tableContainerClass}>
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Manage Questions</h2>
            <p className="text-gray-500 text-sm mt-1">{selectedExam?.title} | Class {toRoman(selectedExam?.class)} | {selectedExam?.subject}</p>
          </div>
          <button onClick={() => setSearchParams({ view: 'list' })} className="flex items-center gap-1.5 bg-gradient-to-r from-edu-navy to-[#1e4b78] text-white hover:from-edu-blue hover:to-[#1e4b78] transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-edu-blue/30 transform hover:-translate-y-0.5 px-4 py-2 rounded-xl text-sm font-medium"><ArrowLeft size={16} /> Back to Exams</button>
        </div>

        <form onSubmit={handleAddQuestion} className="space-y-5 bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-100 shadow-inner">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><Plus size={18} className="text-edu-blue" /> Add New Question</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Question Text</label>
            <textarea 
              required rows="2"
              className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue outline-none transition-all"
              value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Option A</label>
              <input type="text" required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue transition-all" value={newQuestion.option_a} onChange={e => setNewQuestion({...newQuestion, option_a: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Option B</label>
              <input type="text" required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue transition-all" value={newQuestion.option_b} onChange={e => setNewQuestion({...newQuestion, option_b: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Option C</label>
              <input type="text" required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue transition-all" value={newQuestion.option_c} onChange={e => setNewQuestion({...newQuestion, option_c: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Option D</label>
              <input type="text" required className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue transition-all" value={newQuestion.option_d} onChange={e => setNewQuestion({...newQuestion, option_d: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Correct Option(s) (Select all that apply)</label>
              <div className="flex gap-4">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-edu-blue rounded border-gray-300 focus:ring-edu-blue"
                      checked={newQuestion.correct_option.includes(opt)}
                      onChange={(e) => {
                        const newOptions = e.target.checked 
                          ? [...newQuestion.correct_option, opt]
                          : newQuestion.correct_option.filter(o => o !== opt);
                        // Prevent unchecking all
                        if (newOptions.length > 0) {
                          setNewQuestion({...newQuestion, correct_option: newOptions});
                        }
                      }}
                    />
                    <span className="font-semibold text-gray-700">Option {opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Marks</label>
              <input type="number" min="1" className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue transition-all" value={newQuestion.marks} onChange={e => setNewQuestion({...newQuestion, marks: e.target.value})} />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" className="flex items-center justify-center gap-2 bg-gradient-to-r from-edu-navy to-[#1e4b78] text-white px-6 py-2.5 rounded-xl hover:from-edu-blue hover:to-[#1e4b78] transition-all duration-300 font-medium shadow-md hover:shadow-lg hover:shadow-edu-blue/30 transform hover:-translate-y-0.5">
              Save Question
            </button>
          </div>
        </form>
      </div>

      <div className={tableContainerClass}>
        <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-3">Existing Questions ({questions.length})</h3>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              key={q.id} 
              className="p-5 border border-gray-100 rounded-xl bg-white hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex justify-between items-start mb-3 gap-4">
                <p className="font-semibold text-gray-800 text-lg">Q{i + 1}. <span className="font-normal">{q.question_text}</span></p>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full whitespace-nowrap">{q.marks} Marks</span>
                  {!selectedExam?.is_active && (
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-4">
                <div className={`p-3 rounded-lg border ${q.correct_option.split(',').includes('A') ? 'bg-green-50 border-green-200 text-green-800 font-semibold' : 'bg-gray-50/50 border-gray-100 text-gray-600'}`}>A) {q.option_a}</div>
                <div className={`p-3 rounded-lg border ${q.correct_option.split(',').includes('B') ? 'bg-green-50 border-green-200 text-green-800 font-semibold' : 'bg-gray-50/50 border-gray-100 text-gray-600'}`}>B) {q.option_b}</div>
                <div className={`p-3 rounded-lg border ${q.correct_option.split(',').includes('C') ? 'bg-green-50 border-green-200 text-green-800 font-semibold' : 'bg-gray-50/50 border-gray-100 text-gray-600'}`}>C) {q.option_c}</div>
                <div className={`p-3 rounded-lg border ${q.correct_option.split(',').includes('D') ? 'bg-green-50 border-green-200 text-green-800 font-semibold' : 'bg-gray-50/50 border-gray-100 text-gray-600'}`}>D) {q.option_d}</div>
              </div>
            </motion.div>
          ))}
          {questions.length === 0 && <p className="text-gray-500 italic">No questions added yet.</p>}
        </div>
        
        {!selectedExam?.is_active && questions.length > 0 && (
          <div className="mt-10 flex justify-end">
            <button 
              onClick={handleLaunchExam}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg shadow-green-500/30 transform hover:scale-105"
            >
              Launch Exam
            </button>
          </div>
        )}
        {selectedExam?.is_active && (
          <div className="mt-10 flex justify-end">
             <span className="bg-gradient-to-r from-green-100 to-green-200 text-green-800 px-8 py-3 rounded-xl font-bold border border-green-300 shadow-sm flex items-center gap-2">
               <span className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
               </span>
               Exam is Live
             </span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderResults = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={tableContainerClass}
    >
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Exam Results</h2>
          <p className="text-gray-500 text-sm mt-1">{selectedExam?.title} | Class {toRoman(selectedExam?.class)}</p>
        </div>
        <button onClick={() => setSearchParams({ view: 'list' })} className="flex items-center gap-1.5 bg-gradient-to-r from-edu-navy to-[#1e4b78] text-white hover:from-edu-blue hover:to-[#1e4b78] transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-edu-blue/30 transform hover:-translate-y-0.5 px-4 py-2 rounded-xl text-sm font-medium"><ArrowLeft size={16} /> Back to Exams</button>
      </div>
      
      {results.length === 0 ? <p className="text-gray-500 text-center py-8">No students have taken this exam yet.</p> : (
        <div className="overflow-x-auto rounded-xl border border-gray-100/50 bg-white/50 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-600 border-b border-gray-100 sticky top-0">
                <th className="p-5 font-semibold text-sm tracking-wide">Student Name</th>
                <th className="p-5 font-semibold text-sm tracking-wide">Roll Number</th>
                <th className="p-5 font-semibold text-sm tracking-wide">Score</th>
                <th className="p-5 font-semibold text-sm tracking-wide">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, index) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                  key={res.id} 
                  className="border-b border-gray-50 even:bg-gray-50/40 hover:bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <td className="p-5 font-medium text-gray-800">{res.students?.full_name}</td>
                  <td className="p-5 text-gray-600">{res.students?.roll_number}</td>
                  <td className="p-5 font-bold text-edu-blue bg-blue-50/30">{res.total_marks_obtained} / {res.total_marks}</td>
                  <td className="p-5 text-gray-500 text-sm">{new Date(res.submitted_at).toLocaleString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );

  const renderUploadMarks = () => (
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
           // Standard List Format
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
           // Subject-wise Columns Format
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
    } catch (err) { alert("Error: " + err.message); } 
    finally { setIsUploading(false); }
  };

  if (accessDeniedRole) {
    return (
      <div className="min-h-screen bg-[#FCFAF8] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-3xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You are currently logged in with an account that has the role: <strong className="text-red-600">'{accessDeniedRole}'</strong>. 
            You MUST be logged in as a 'teacher' or 'admin' to access this portal.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                logoutStudent();
                navigate('/login?role=teacher');
              }}
              className="w-full py-3 px-4 bg-edu-navy text-white rounded-xl font-bold hover:bg-blue-900 transition-colors shadow-md"
            >
              Logout & Switch Account
            </button>
            <button
              onClick={() => navigate(accessDeniedRole === 'student' ? '/student-dashboard' : '/login')}
              className="w-full py-3 px-4 text-edu-navy font-semibold hover:bg-blue-50 rounded-xl transition-colors"
            >
              Go to My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-12 bg-[#f8fbff]">
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 flex flex-col items-center text-center"
        >
          <div className="inline-block relative">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-outfit">Teacher Portal</h1>
            <div className="absolute -bottom-2 left-1/4 right-1/4 h-1 bg-gradient-to-r from-edu-gold to-yellow-300 rounded-full"></div>
          </div>
          <p className="text-gray-500 mt-4 text-lg max-w-2xl font-medium">Manage exams, academic records, and monitor student performance</p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap justify-center bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm gap-2">
            <button
              onClick={() => { setActiveTab('exams'); setSearchParams({ view: 'list' }); }}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'exams' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <BookOpen size={18} /> Online Exams
            </button>
            <button
              onClick={() => setActiveTab('marks')}
              className={`py-2.5 px-6 font-bold text-sm transition-all rounded-xl flex items-center gap-2.5 ${activeTab === 'marks' ? 'bg-gradient-to-r from-edu-navy to-blue-900 text-white shadow-premium' : 'text-gray-600 hover:text-edu-navy hover:bg-white hover:shadow-apple border border-transparent hover:border-white'}`}
            >
              <Database size={18} /> Academic Records
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'marks' && renderUploadMarks()}
          {activeTab === 'exams' && view === 'list' && <motion.div key="list">{renderExamList()}</motion.div>}
          {activeTab === 'exams' && view === 'create' && <motion.div key="create">{renderCreateExam()}</motion.div>}
          {activeTab === 'exams' && view === 'questions' && <motion.div key="questions">{renderQuestions()}</motion.div>}
          {activeTab === 'exams' && view === 'results' && <motion.div key="results">{renderResults()}</motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherDashboard;
