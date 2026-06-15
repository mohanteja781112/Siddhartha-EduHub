import React from 'react';
import { CreditCard } from 'lucide-react';

const StudentFees = ({ profile, feePayments }) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 font-outfit">Fees & Payments</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-apple">
          <p className="text-sm font-bold text-gray-500 mb-2">Total Fees</p>
          <h3 className="text-4xl font-bold text-gray-900 font-outfit">₹{(profile?.total_fees || 0).toLocaleString()}</h3>
        </div>
        <div className="glass-card rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-apple border-green-200">
          <p className="text-sm font-bold text-gray-500 mb-2">Paid Amount</p>
          <h3 className="text-4xl font-bold text-green-600 font-outfit">₹{((profile?.total_fees || 0) - (profile?.pending_fees || 0)).toLocaleString()}</h3>
        </div>
        <div className="glass-card rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-apple border-red-200">
          <p className="text-sm font-bold text-gray-500 mb-2">Pending Dues</p>
          <h3 className="text-4xl font-bold text-red-500 font-outfit">₹{(profile?.pending_fees || 0).toLocaleString()}</h3>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] p-8 shadow-apple">
        <h3 className="text-xl font-bold text-gray-900 font-outfit mb-6 flex items-center gap-2">
          <CreditCard className="text-edu-gold" size={24} /> Payment History
        </h3>
        
        {feePayments.length === 0 ? (
          <p className="text-gray-500 font-medium text-center py-8">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100/50 bg-white/50 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-5 font-bold border-b border-gray-100">Transaction ID</th>
                  <th className="p-5 font-bold border-b border-gray-100">Date & Time</th>
                  <th className="p-5 font-bold border-b border-gray-100 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {feePayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-white transition-colors">
                    <td className="p-5 font-mono text-xs font-semibold text-gray-600">
                      {payment.id.split('-')[0].toUpperCase()}
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${payment.payment_type === 'Concession' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {payment.payment_type || 'Standard'}
                      </span>
                    </td>
                    <td className="p-5 text-sm font-medium text-gray-700">{new Date(payment.payment_date).toLocaleString()}</td>
                    <td className="p-5 text-right font-bold text-green-600 text-lg">₹{payment.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFees;
