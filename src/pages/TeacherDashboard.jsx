import React, { useState, useEffect } from 'react';
import { supabase, logoutStudent } from '../lib/supabase';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { LogOut, BookOpen, FileSpreadsheet, Plus, GraduationCap, Book, Award, Lightbulb, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'list';
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    if ((view === 'questions' || view === 'results') && !selectedExam) {
      setSearchParams({ view: 'list' });
    }
  }, [view, selectedExam, setSearchParams]);
  
  // New Exam Form State
  const [newExam, setNewExam] = useState({ title: '', class: '10', subject: '', time_limit_minutes: 30 });
  
  // New Question Form State
  const [newQuestion, setNewQuestion] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', marks: 1
  });
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);

  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login?role=teacher');
    } else {
      setIsAuthChecking(false);
      fetchExams();
    }
  };

  const handleLogout = () => {
    logoutStudent();
    navigate('/login?role=teacher');
  };

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
      setNewExam({ title: '', class: '10', subject: '', time_limit_minutes: 30 });
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

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExam) return;

    const { data, error } = await supabase
      .from('questions')
      .insert([
        { ...newQuestion, exam_id: selectedExam.id }
      ]);

    if (error) {
      alert('Error adding question: ' + error.message);
    } else {
      alert('Question added!');
      setNewQuestion({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', marks: 1 });
      fetchQuestions(selectedExam.id);
    }
  };

  const tableContainerClass = "bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_15px_50px_rgba(0,0,0,0.12)]";

  const renderExamList = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={tableContainerClass}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Managed Exams</h2>
        <button 
          onClick={() => setSearchParams({ view: 'create' })}
          className="flex items-center gap-2 bg-gradient-to-r from-edu-navy to-[#1e4b78] text-white px-5 py-2.5 rounded-xl hover:from-edu-blue hover:to-[#1e4b78] transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-edu-blue/30 transform hover:scale-[1.03] active:scale-95 font-medium group relative overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" /> 
          <span className="relative z-10">Create New Exam</span>
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
                  <td className="p-5 text-gray-600">Class {exam.class}</td>
                  <td className="p-5 text-gray-600">{exam.subject}</td>
                  <td className="p-5 text-gray-600">{exam.time_limit_minutes}</td>
                  <td className="p-5">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm inline-block
                      ${exam.is_active 
                        ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-200 shadow-green-100' 
                        : 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-100'}`}
                    >
                      {exam.is_active ? 'Active' : 'Inactive'}
                    </span>
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
        <h2 className="text-xl font-semibold text-gray-800">Create New Exam</h2>
        <button onClick={() => setSearchParams({ view: 'list' })} className="flex items-center gap-1.5 bg-gradient-to-r from-edu-navy to-[#1e4b78] text-white hover:from-edu-blue hover:to-[#1e4b78] transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-edu-blue/30 transform hover:-translate-y-0.5 px-4 py-2 rounded-xl text-sm font-medium"><ArrowLeft size={16} /> Cancel</button>
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
              {[1,2,3,4,5,6,7,8,9,10].map(c => <option key={c} value={c}>Class {c}</option>)}
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
            <p className="text-gray-500 text-sm mt-1">{selectedExam?.title} | Class {selectedExam?.class} | {selectedExam?.subject}</p>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Correct Option</label>
              <select className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-edu-blue transition-all" value={newQuestion.correct_option} onChange={e => setNewQuestion({...newQuestion, correct_option: e.target.value})}>
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
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
              <div className="flex justify-between items-start mb-3">
                <p className="font-semibold text-gray-800 text-lg">Q{i + 1}. <span className="font-normal">{q.question_text}</span></p>
                <span className="text-sm font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{q.marks} Marks</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mt-4">
                <div className={`p-3 rounded-lg border ${q.correct_option === 'A' ? 'bg-green-50 border-green-200 text-green-800 font-semibold' : 'bg-gray-50/50 border-gray-100 text-gray-600'}`}>A) {q.option_a}</div>
                <div className={`p-3 rounded-lg border ${q.correct_option === 'B' ? 'bg-green-50 border-green-200 text-green-800 font-semibold' : 'bg-gray-50/50 border-gray-100 text-gray-600'}`}>B) {q.option_b}</div>
                <div className={`p-3 rounded-lg border ${q.correct_option === 'C' ? 'bg-green-50 border-green-200 text-green-800 font-semibold' : 'bg-gray-50/50 border-gray-100 text-gray-600'}`}>C) {q.option_c}</div>
                <div className={`p-3 rounded-lg border ${q.correct_option === 'D' ? 'bg-green-50 border-green-200 text-green-800 font-semibold' : 'bg-gray-50/50 border-gray-100 text-gray-600'}`}>D) {q.option_d}</div>
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
          <p className="text-gray-500 text-sm mt-1">{selectedExam?.title} | Class {selectedExam?.class}</p>
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

  return (
    <div className="min-h-screen relative overflow-hidden pb-12 pt-28 bg-[#f8fbff]" style={{ background: 'linear-gradient(135deg, #f8fbff 0%, #eef6ff 50%, #ffffff 100%)' }}>
      
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10 text-center sm:text-left"
        >
          <div className="inline-block relative">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-poppins">Exams Overview</h1>
            <div className="absolute -bottom-2 left-0 w-1/2 h-1 bg-gradient-to-r from-edu-gold to-yellow-300 rounded-full"></div>
          </div>
          <p className="text-gray-600 mt-4 text-lg max-w-2xl">Manage exams and monitor student performance</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === 'list' && <motion.div key="list">{renderExamList()}</motion.div>}
          {view === 'create' && <motion.div key="create">{renderCreateExam()}</motion.div>}
          {view === 'questions' && <motion.div key="questions">{renderQuestions()}</motion.div>}
          {view === 'results' && <motion.div key="results">{renderResults()}</motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeacherDashboard;
