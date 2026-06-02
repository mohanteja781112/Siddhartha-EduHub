import React, { useState, useEffect } from 'react';
import { supabase, logoutStudent } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const TeacherDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list', 'create', 'questions', 'results'
  const [selectedExam, setSelectedExam] = useState(null);
  
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
      setView('list');
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

  const renderExamList = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Managed Exams</h2>
        <button 
          onClick={() => setView('create')}
          className="bg-edu-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create New Exam
        </button>
      </div>
      
      {loading ? <p className="text-gray-500">Loading exams...</p> : exams.length === 0 ? <p className="text-gray-500">No exams created yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Class</th>
                <th className="p-4 font-medium">Subject</th>
                <th className="p-4 font-medium">Time (Mins)</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => (
                <tr key={exam.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{exam.title}</td>
                  <td className="p-4 text-gray-600">Class {exam.class}</td>
                  <td className="p-4 text-gray-600">{exam.subject}</td>
                  <td className="p-4 text-gray-600">{exam.time_limit_minutes}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${exam.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {exam.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button 
                      onClick={() => { setSelectedExam(exam); fetchQuestions(exam.id); setView('questions'); }}
                      className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
                    >
                      Manage Questions
                    </button>
                    <button 
                      onClick={() => { setSelectedExam(exam); fetchResults(exam.id); setView('results'); }}
                      className="text-sm bg-purple-50 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-100 transition-colors"
                    >
                      View Results
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderCreateExam = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Create New Exam</h2>
        <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">Back</button>
      </div>
      
      <form onSubmit={handleCreateExam} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
          <input 
            type="text" required
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-edu-blue focus:border-transparent outline-none transition-all"
            value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})}
            placeholder="e.g. Weekly Math Test 1"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select 
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-edu-blue outline-none transition-all"
              value={newExam.class} onChange={e => setNewExam({...newExam, class: e.target.value})}
            >
              {[1,2,3,4,5,6,7,8,9,10].map(c => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input 
              type="text" required
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-edu-blue outline-none transition-all"
              value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})}
              placeholder="e.g. Mathematics"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (Minutes)</label>
          <input 
            type="number" required min="1"
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-edu-blue outline-none transition-all"
            value={newExam.time_limit_minutes} onChange={e => setNewExam({...newExam, time_limit_minutes: e.target.value})}
          />
        </div>
        <div className="pt-4">
          <button type="submit" className="w-full bg-edu-blue text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Create Exam
          </button>
        </div>
      </form>
    </div>
  );

  const renderQuestions = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Manage Questions</h2>
            <p className="text-gray-500 text-sm mt-1">{selectedExam?.title} | Class {selectedExam?.class} | {selectedExam?.subject}</p>
          </div>
          <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">Back to Exams</button>
        </div>

        <form onSubmit={handleAddQuestion} className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-4">Add New Question</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
            <textarea 
              required rows="2"
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-edu-blue outline-none"
              value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Option A</label>
              <input type="text" required className="w-full p-2 border border-gray-200 rounded-lg" value={newQuestion.option_a} onChange={e => setNewQuestion({...newQuestion, option_a: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Option B</label>
              <input type="text" required className="w-full p-2 border border-gray-200 rounded-lg" value={newQuestion.option_b} onChange={e => setNewQuestion({...newQuestion, option_b: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Option C</label>
              <input type="text" required className="w-full p-2 border border-gray-200 rounded-lg" value={newQuestion.option_c} onChange={e => setNewQuestion({...newQuestion, option_c: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Option D</label>
              <input type="text" required className="w-full p-2 border border-gray-200 rounded-lg" value={newQuestion.option_d} onChange={e => setNewQuestion({...newQuestion, option_d: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correct Option</label>
              <select className="w-full p-2 border border-gray-200 rounded-lg" value={newQuestion.correct_option} onChange={e => setNewQuestion({...newQuestion, correct_option: e.target.value})}>
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
              <input type="number" min="1" className="w-full p-2 border border-gray-200 rounded-lg" value={newQuestion.marks} onChange={e => setNewQuestion({...newQuestion, marks: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="bg-edu-blue text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Save Question
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-800 mb-4">Existing Questions ({questions.length})</h3>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
              <div className="flex justify-between items-start mb-2">
                <p className="font-medium text-gray-800">Q{i + 1}. {q.question_text}</p>
                <span className="text-sm font-medium text-gray-500">{q.marks} Marks</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                <div className={`p-2 rounded ${q.correct_option === 'A' ? 'bg-green-100 text-green-800 font-medium' : 'bg-white text-gray-600 border'}`}>A) {q.option_a}</div>
                <div className={`p-2 rounded ${q.correct_option === 'B' ? 'bg-green-100 text-green-800 font-medium' : 'bg-white text-gray-600 border'}`}>B) {q.option_b}</div>
                <div className={`p-2 rounded ${q.correct_option === 'C' ? 'bg-green-100 text-green-800 font-medium' : 'bg-white text-gray-600 border'}`}>C) {q.option_c}</div>
                <div className={`p-2 rounded ${q.correct_option === 'D' ? 'bg-green-100 text-green-800 font-medium' : 'bg-white text-gray-600 border'}`}>D) {q.option_d}</div>
              </div>
            </div>
          ))}
          {questions.length === 0 && <p className="text-gray-500">No questions added yet.</p>}
        </div>
        
        {!selectedExam?.is_active && questions.length > 0 && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleLaunchExam}
              className="bg-green-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg"
            >
              Launch Exam
            </button>
          </div>
        )}
        {selectedExam?.is_active && (
          <div className="mt-8 flex justify-end">
             <span className="bg-green-100 text-green-800 px-6 py-2 rounded-lg font-bold border border-green-200">Exam is Live</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Exam Results</h2>
          <p className="text-gray-500 text-sm mt-1">{selectedExam?.title} | Class {selectedExam?.class}</p>
        </div>
        <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">Back to Exams</button>
      </div>
      
      {results.length === 0 ? <p className="text-gray-500">No students have taken this exam yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <th className="p-4 font-medium">Student Name</th>
                <th className="p-4 font-medium">Roll Number</th>
                <th className="p-4 font-medium">Score</th>
                <th className="p-4 font-medium">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {results.map(res => (
                <tr key={res.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-800">{res.students?.full_name}</td>
                  <td className="p-4 text-gray-600">{res.students?.roll_number}</td>
                  <td className="p-4 font-semibold text-edu-blue">{res.total_marks_obtained} / {res.total_marks}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(res.submitted_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12 pt-28">

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exams Overview</h1>
          <p className="text-gray-600 mt-2">Manage exams and monitor student performance</p>
        </div>

        {view === 'list' && renderExamList()}
        {view === 'create' && renderCreateExam()}
        {view === 'questions' && renderQuestions()}
        {view === 'results' && renderResults()}
      </div>
    </div>
  );
};

export default TeacherDashboard;
