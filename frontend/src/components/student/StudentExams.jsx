import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const StudentExams = ({ 
  profile, 
  availableExams, 
  pastResults, 
  fetchExamsData, 
  activeTab, 
  setActiveTab 
}) => {
  // Exam Taking State
  const [currentExam, setCurrentExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const answersRef = useRef({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timeLeftRef = useRef(0);
  const timerRef = useRef(null);

  const startExam = async (exam) => {
    // Fetch questions for this exam
    const { data: qData, error } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', exam.id);

    if (error || !qData || qData.length === 0) {
      alert("No questions found for this exam.");
      return;
    }

    setQuestions(qData);
    setCurrentExam(exam);
    setAnswers({});
    answersRef.current = {};
    setIsSubmitting(false);
    setCurrentQuestionIndex(0);
    
    const initialTime = exam.time_limit_minutes * 60;
    setTimeLeft(initialTime);
    timeLeftRef.current = initialTime;
    setActiveTab('take_exam');

    // Start Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        submitExam(qData, answersRef.current, exam); // Auto submit with latest answers
      }
    }, 1000);
  };

  const submitExam = async (currentQuestions = questions, currentAnswers = answers, exam = currentExam) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    let score = 0;
    let total = 0;

    currentQuestions.forEach(q => {
      total += q.marks;
      
      const studentAnswerArray = currentAnswers[q.id] || [];
      const studentAnswerString = Array.isArray(studentAnswerArray) ? studentAnswerArray.sort().join(',') : studentAnswerArray;

      if (studentAnswerString === q.correct_option) {
        score += q.marks;
      }
    });

    const studentId = profile.id;

    const { error } = await supabase
      .from('student_exam_results')
      .insert([{
        exam_id: exam.id,
        student_id: studentId,
        total_marks_obtained: score,
        total_marks: total
      }]);

    if (error) {
      if (error.code === '23505') {
         alert("Exam already submitted!");
         setActiveTab('exams');
         fetchExamsData(profile.class, profile.id);
      } else {
         alert("Error submitting exam: " + error.message);
      }
    } else {
      alert(`Exam Submitted! You scored ${score} out of ${total}`);
      setActiveTab('exams');
      fetchExamsData(profile.class, profile.id); // Refresh data
    }
    setIsSubmitting(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (activeTab === 'take_exam' && currentExam && questions.length > 0) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Exam Header & Timer */}
        <div className="bg-white rounded-2xl p-4 shadow-md mb-6 flex justify-between items-center sticky top-20 z-40 border border-blue-100">
          <div>
            <h2 className="font-bold text-edu-navy text-lg sm:text-xl line-clamp-1">{currentExam.title}</h2>
            <p className="text-xs sm:text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-lg sm:text-xl ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-edu-blue'}`}>
            <Timer size={20} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Card */}
        <motion.div 
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 mb-6"
        >
          <h3 className="text-lg sm:text-xl font-medium text-gray-800 mb-6 leading-relaxed">
            <span className="font-bold text-edu-blue mr-2">Q{currentQuestionIndex + 1}.</span> 
            {questions[currentQuestionIndex].question_text}
          </h3>

          <div className="space-y-3 sm:space-y-4">
            {['A', 'B', 'C', 'D'].map((opt) => {
              const currentQuestion = questions[currentQuestionIndex];
              const optionText = currentQuestion[`option_${opt.toLowerCase()}`];
              const currentSelections = answers[currentQuestion.id] || [];
              const isSelected = currentSelections.includes(opt);
              
              const isMultipleChoice = currentQuestion.correct_option.split(',').length > 1;
              
              return (
                <button
                  key={opt}
                  onClick={() => {
                    let newSelections;
                    if (!isMultipleChoice) {
                      newSelections = isSelected ? [] : [opt];
                    } else {
                      if (isSelected) {
                        newSelections = currentSelections.filter(o => o !== opt);
                      } else {
                        newSelections = [...currentSelections, opt];
                      }
                    }
                    const newAnswers = {...answers, [currentQuestion.id]: newSelections};
                    setAnswers(newAnswers);
                    answersRef.current = newAnswers;
                  }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                    isSelected 
                      ? 'border-edu-blue bg-blue-50 shadow-md transform scale-[1.01]' 
                      : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`shrink-0 w-6 h-6 ${isMultipleChoice ? 'rounded-md' : 'rounded-full'} border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${
                    isSelected ? 'border-edu-blue bg-edu-blue text-white' : 'border-gray-300 text-gray-500'
                  }`}>
                    {isSelected && (
                       isMultipleChoice 
                         ? <CheckCircle size={14} className="text-white" />
                         : <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className={`text-sm sm:text-base ${isSelected ? 'font-medium text-edu-navy' : 'text-gray-700'}`}>
                    <span className="font-bold text-gray-400 mr-2">{opt}.</span> {optionText}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ChevronLeft size={20} /> <span className="hidden sm:inline">Previous</span>
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to submit your exam? You cannot change your answers after this.")) {
                  submitExam();
                }
              }}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-md disabled:opacity-50"
            >
              <CheckCircle size={20} /> {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              className="flex items-center gap-2 px-6 py-3 bg-edu-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              <span className="hidden sm:inline">Next Question</span> <ChevronRight size={20} />
            </button>
          )}
        </div>
        
        {/* Progress Dots */}
        <div className="mt-8 flex justify-center gap-2 flex-wrap px-4">
          {questions.map((q, idx) => (
            <div 
              key={q.id} 
              className={`w-3 h-3 rounded-full ${
                idx === currentQuestionIndex ? 'bg-edu-blue ring-4 ring-blue-100' :
                answers[q.id] ? 'bg-green-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

      </div>
    );
  }

  // activeTab === 'exams'
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 font-outfit">Exams Center</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Exams */}
        <div className="glass-card rounded-[2rem] p-8 shadow-apple">
          <h3 className="text-xl font-bold text-gray-900 font-outfit mb-6 flex items-center gap-2">
            <FileText className="text-edu-blue" size={24} /> Pending Exams
          </h3>
          <div className="space-y-4">
            {availableExams.length === 0 ? (
              <p className="text-gray-500 font-medium">No pending exams at the moment. Great job!</p>
            ) : (
              availableExams.map(exam => (
                <div key={exam.id} className="p-5 border border-blue-100 bg-blue-50/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{exam.title}</h4>
                    <p className="text-sm font-semibold text-edu-blue">{exam.subject} • {exam.time_limit_minutes} mins</p>
                  </div>
                  <button 
                    onClick={() => startExam(exam)}
                    className="w-full sm:w-auto bg-gradient-to-r from-edu-navy to-blue-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    Start Exam
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Past Results */}
        <div className="glass-card rounded-[2rem] p-8 shadow-apple">
          <h3 className="text-xl font-bold text-gray-900 font-outfit mb-6 flex items-center gap-2">
            <CheckCircle className="text-green-500" size={24} /> Past Results
          </h3>
          <div className="space-y-4">
            {pastResults.length === 0 ? (
              <p className="text-gray-500 font-medium">You haven't completed any exams yet.</p>
            ) : (
              pastResults.map(res => (
                <div key={res.id} className="p-5 border border-gray-100 bg-white/50 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{res.exams?.title || 'Exam'}</h4>
                    <p className="text-xs font-semibold text-gray-500">{new Date(res.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-outfit font-bold text-edu-blue">{res.total_marks_obtained} <span className="text-sm text-gray-400">/ {res.total_marks}</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentExams;
