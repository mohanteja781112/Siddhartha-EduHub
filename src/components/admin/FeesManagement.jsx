import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Search, Loader2, FileText, Plus, XCircle } from 'lucide-react';
import { getAdminFeesData, recordFeePayment, getStudentPayments } from '../../lib/supabase';

const FeesManagement = () => {
  const [feesData, setFeesData] = useState([]);
  const [isFetchingFees, setIsFetchingFees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Standard');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState(null);
  const [studentPaymentHistory, setStudentPaymentHistory] = useState([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  useEffect(() => {
    fetchFeesData();
  }, []);

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
      await recordFeePayment(selectedStudentForPayment.id, amount, selectedStudentForPayment.pending_fees, paymentType);
      alert('Payment recorded successfully!');
      setSelectedStudentForPayment(null);
      setPaymentAmount('');
      setPaymentType('Standard');
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

  return (
    <>
      <motion.div 
        key="fees-tab"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
        className="glass-card rounded-[2rem] flex flex-col min-h-[600px] overflow-hidden shadow-apple"
      >
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-edu-navy text-lg">Student Fees Dashboard <span className="text-sm font-normal text-green-700 ml-2 bg-green-200/50 px-2 py-0.5 rounded-full">{filteredFeesData.length}</span></h3>
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
                    <td className="p-4 text-gray-600 text-sm">{student.class}{student.section ? ` - ${student.section}` : ''}</td>
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
                          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-edu-navy to-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-apple transition-all shadow-premium"
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
                  
                  <div className="mt-4">
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Payment Type</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-edu-blue focus:border-edu-blue outline-none text-lg font-bold text-edu-navy"
                    >
                      <option value="Standard">Standard Payment (Cash/Online)</option>
                      <option value="Concession">Fee Concession / Discount</option>
                    </select>
                  </div>
                  
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
                    <p className="text-sm text-gray-500">Roll No: {selectedStudentForHistory.roll_number} | Class {selectedStudentForHistory.class}{selectedStudentForHistory.section ? ` - ${selectedStudentForHistory.section}` : ''}</p>
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
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${payment.payment_type === 'Concession' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                              {payment.payment_type || 'Standard'}
                            </span>
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
    </>
  );
};

export default FeesManagement;
