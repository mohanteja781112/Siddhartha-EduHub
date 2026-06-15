import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  User, Calendar, MapPin, Phone, Mail, 
  GraduationCap, BookOpen, Send, CheckCircle, 
  ChevronDown, AlertCircle 
} from 'lucide-react';

const InputField = ({ label, name, type = "text", value, onChange, error, required, icon: Icon, placeholder }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-sm font-semibold text-edu-navy flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white/50 border ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-edu-gold focus:ring-edu-gold/20'} rounded-xl px-4 py-3 ${Icon ? 'pl-11' : ''} text-edu-navy placeholder:text-gray-400 focus:outline-none focus:ring-4 transition-all duration-300`}
      />
    </div>
    {error && (
      <span className="text-xs text-red-500 flex items-center gap-1 mt-1">
        <AlertCircle size={12} /> {error}
      </span>
    )}
  </div>
);

const SelectField = ({ label, name, value, onChange, error, required, options, icon: Icon }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-sm font-semibold text-edu-navy flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
          <Icon size={18} />
        </div>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full bg-white/50 border ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-edu-gold focus:ring-edu-gold/20'} rounded-xl px-4 py-3 ${Icon ? 'pl-11' : ''} appearance-none text-edu-navy focus:outline-none focus:ring-4 transition-all duration-300`}
      >
        <option value="" disabled>Select an option</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
        <ChevronDown size={18} />
      </div>
    </div>
    {error && (
      <span className="text-xs text-red-500 flex items-center gap-1 mt-1">
        <AlertCircle size={12} /> {error}
      </span>
    )}
  </div>
);

const Admission = () => {
  const [formData, setFormData] = useState({
    // Student Info
    studentName: '',
    dob: '',
    gender: '',
    currentClass: '',
    applyingFor: '',
    currentSchool: '',
    
    // Parent Info
    parentName: '',
    relation: '',
    phone: '',
    altPhone: '',
    
    // Address Info
    address1: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const requiredFields = [
    'studentName', 'dob', 'gender', 'currentClass', 'applyingFor',
    'parentName', 'relation', 'phone',
    'address1', 'city', 'state', 'pincode'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to top to see errors
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("https://formsubmit.co/ajax/siddharthaenglishmedium2005@gmail.com", {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `New Admission Enquiry: ${formData.studentName}`,
          _template: "table",
          "Student Name": formData.studentName,
          "Date of Birth": formData.dob,
          "Gender": formData.gender,
          "Current Class": formData.currentClass,
          "Applying For": formData.applyingFor,
          "Current School": formData.currentSchool || "N/A",
          "Parent Name": formData.parentName,
          "Relation": formData.relation,
          "Phone Number": formData.phone,
          "Alternate Phone": formData.altPhone || "N/A",
          "Address Line 1": formData.address1,
          "City": formData.city,
          "State": formData.state,
          "Pincode": formData.pincode
        })
      });

      const data = await response.json();
      
      if (data.success === "true" || data.success === true) {
        setIsSuccess(true);
      } else {
        alert(`Failed to submit form: ${data.message || 'Please try again.'}`);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("An error occurred while sending the email. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF8] pt-[72px] font-sans pb-20">
      
      {/* Hero Banner Section */}
      <section className="relative bg-gradient-to-br from-edu-navy to-[#0a3d5e] py-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 text-white/5 rotate-12">
            <GraduationCap size={120} />
          </div>
          <div className="absolute bottom-10 right-20 text-white/5 -rotate-12">
            <BookOpen size={100} />
          </div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-edu-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-poppins font-bold text-white mb-6"
          >
            Admission <span className="text-transparent bg-clip-text bg-gradient-to-r from-edu-gold to-yellow-500">Enquiry Form</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto"
          >
            Take the first step towards a brighter future. Submit your details and our admissions team will contact you shortly.
          </motion.p>
        </div>
      </section>

      {/* Form Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 shadow-xl border border-white/50"
        >
          <form onSubmit={handleSubmit} className="space-y-12">
            
            <div className="text-right text-sm text-gray-500 font-medium">
              Fields marked with <span className="text-red-500">*</span> are required
            </div>

            {/* Student Information */}
            <div>
              <h3 className="text-xl font-poppins font-bold text-edu-navy border-b-2 border-edu-gold/30 pb-3 mb-6 flex items-center gap-2">
                <User className="text-edu-gold" size={24} /> Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Full Name" name="studentName" value={formData.studentName} 
                  onChange={handleChange} error={errors.studentName} required
                  placeholder="Enter student's full name"
                />
                <InputField 
                  label="Date of Birth" name="dob" type="date" value={formData.dob} 
                  onChange={handleChange} error={errors.dob} required
                  icon={Calendar}
                />
                <SelectField 
                  label="Gender" name="gender" value={formData.gender} 
                  onChange={handleChange} error={errors.gender} required
                  options={['Male', 'Female', 'Other']}
                />
                <InputField 
                  label="Current Class" name="currentClass" value={formData.currentClass} 
                  onChange={handleChange} error={errors.currentClass} required
                  placeholder="e.g. Grade 5"
                />
                <SelectField 
                  label="Class Applying For" name="applyingFor" value={formData.applyingFor} 
                  onChange={handleChange} error={errors.applyingFor} required
                  options={['Pre-Primary', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']}
                />
                <InputField 
                  label="Current School Name" name="currentSchool" value={formData.currentSchool} 
                  onChange={handleChange}
                  placeholder="Name of previous/current school"
                />
              </div>
            </div>

            {/* Parent Information */}
            <div>
              <h3 className="text-xl font-poppins font-bold text-edu-navy border-b-2 border-edu-gold/30 pb-3 mb-6 flex items-center gap-2">
                <User className="text-edu-gold" size={24} /> Parent / Guardian Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Parent/Guardian Name" name="parentName" value={formData.parentName} 
                  onChange={handleChange} error={errors.parentName} required
                  placeholder="Enter full name"
                />
                <SelectField 
                  label="Relation" name="relation" value={formData.relation} 
                  onChange={handleChange} error={errors.relation} required
                  options={['Father', 'Mother', 'Guardian', 'Other']}
                />
                <InputField 
                  label="Phone Number" name="phone" type="tel" value={formData.phone} 
                  onChange={handleChange} error={errors.phone} required icon={Phone}
                  placeholder="+91"
                />
                <InputField 
                  label="Alternate Phone Number" name="altPhone" type="tel" value={formData.altPhone} 
                  onChange={handleChange} icon={Phone}
                  placeholder="+91"
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-xl font-poppins font-bold text-edu-navy border-b-2 border-edu-gold/30 pb-3 mb-6 flex items-center gap-2">
                <MapPin className="text-edu-gold" size={24} /> Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputField 
                    label="Address Line 1" name="address1" value={formData.address1} 
                    onChange={handleChange} error={errors.address1} required
                    placeholder="House/Flat No., Building Name, Street"
                  />
                </div>
                <InputField 
                  label="City" name="city" value={formData.city} 
                  onChange={handleChange} error={errors.city} required
                  placeholder="e.g. Anakapalle"
                />
                <InputField 
                  label="State" name="state" value={formData.state} 
                  onChange={handleChange} error={errors.state} required
                  placeholder="e.g. Andhra Pradesh"
                />
                <InputField 
                  label="Pincode" name="pincode" type="number" value={formData.pincode} 
                  onChange={handleChange} error={errors.pincode} required
                  placeholder="e.g. 531001"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-edu-navy to-blue-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting Application...
                  </>
                ) : (
                  <>
                    Submit Application <Send size={20} />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </section>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-edu-navy/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 md:p-12 max-w-lg w-full text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-500 w-12 h-12" />
              </div>
              <h2 className="text-3xl font-poppins font-bold text-edu-navy mb-4">Application Submitted Successfully!</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Thank you for your interest in Siddhartha EduHub. Our admissions team will review your enquiry and contact you shortly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <button className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-edu-navy font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Return Home
                  </button>
                </Link>
                <Link to="/contact">
                  <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-edu-gold to-yellow-500 text-white font-bold rounded-xl shadow-lg shadow-edu-gold/30 hover:shadow-edu-gold/50 transition-all">
                    Contact Admissions
                  </button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Admission;
