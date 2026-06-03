import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';
import Admission from './pages/Admission';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function ConditionalFooter() {
  const location = useLocation();
  if (location.pathname === '/teacher-dashboard') {
    return null;
  }
  return <Footer />;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-white font-sans selection:bg-edu-blue selection:text-white flex flex-col">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/admission" element={<Admission />} />
            <Route path="/login" element={<Login />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
        <ConditionalFooter />
      </div>
    </Router>
  );
}

export default App;
