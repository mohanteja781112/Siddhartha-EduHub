import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Loader2, Trash2 } from 'lucide-react';
import { getAllProfiles, updateProfileRole, toggleProfileStatus, deleteProfile } from '../../lib/supabase';

const RoleManagement = () => {
  const [profiles, setProfiles] = useState([]);
  const [isFetchingProfiles, setIsFetchingProfiles] = useState(false);
  const [updatingRoleFor, setUpdatingRoleFor] = useState(null);
  const [rolesSearchQuery, setRolesSearchQuery] = useState('');

  useEffect(() => {
    fetchProfilesData();
  }, []);

  const fetchProfilesData = async () => {
    setIsFetchingProfiles(true);
    try {
      const data = await getAllProfiles();
      setProfiles(data);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    } finally {
      setIsFetchingProfiles(false);
    }
  };

  const handleRoleChange = async (profileId, newRole) => {
    setUpdatingRoleFor(profileId);
    try {
      await updateProfileRole(profileId, newRole);
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
    } catch (err) {
      alert("Error updating role: " + err.message);
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  const handleStatusChange = async (profileId, isActive) => {
    setUpdatingRoleFor(profileId);
    try {
      await toggleProfileStatus(profileId, isActive);
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_active: isActive } : p));
    } catch (err) {
      alert("Error updating status: " + err.message);
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm("Are you sure you want to permanently delete this profile and their entire account?")) return;
    setUpdatingRoleFor(profileId);
    try {
      await deleteProfile(profileId);
      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (err) {
      alert("Error deleting profile: " + err.message);
    } finally {
      setUpdatingRoleFor(null);
    }
  };

  return (
    <motion.div 
      key="roles-tab"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="glass-card rounded-[2rem] flex flex-col min-h-[600px] overflow-hidden shadow-apple"
    >
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="font-bold text-edu-navy text-lg">Staff Role Management <span className="text-sm font-normal text-purple-700 ml-2 bg-purple-200/50 px-2 py-0.5 rounded-full">{profiles.filter(p => (p.email || '').toLowerCase().includes(rolesSearchQuery.toLowerCase())).length}</span></h3>
            <p className="text-xs text-gray-500">Manage access levels for your staff</p>
          </div>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by email..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-edu-blue/50 text-sm"
            value={rolesSearchQuery}
            onChange={(e) => setRolesSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-0">
        {isFetchingProfiles ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-edu-blue" size={32} />
          </div>
        ) : (
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-white sticky top-0 shadow-sm z-10">
              <tr className="text-gray-400 text-xs uppercase tracking-wider bg-gray-50">
                <th className="p-4 font-semibold border-b">Account Email</th>
                <th className="p-4 font-semibold border-b">Current Role</th>
                <th className="p-4 font-semibold border-b">Login Status</th>
                <th className="p-4 font-semibold border-b">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {profiles
                .filter(profile => 
                  (profile.email || '').toLowerCase().includes(rolesSearchQuery.toLowerCase())
                )
                .map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-edu-navy">{profile.email || <span className="text-gray-400 italic">No email linked</span>}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      profile.role === 'admin' ? 'bg-red-100 text-red-700' : 
                      profile.role === 'teacher' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {profile.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleStatusChange(profile.id, profile.is_active === false ? true : false)}
                      disabled={updatingRoleFor === profile.id || profile.email === 'admin@siddhartha.edu'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${profile.is_active !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.is_active !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`ml-3 text-xs font-bold ${profile.is_active !== false ? 'text-green-600' : 'text-gray-500'}`}>
                      {profile.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <select 
                        className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-edu-blue focus:border-edu-blue block p-2"
                        value={profile.role}
                        disabled={updatingRoleFor === profile.id || profile.email === 'admin@siddhartha.edu'}
                        onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                      
                      {profile.email !== 'admin@siddhartha.edu' && (
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          disabled={updatingRoleFor === profile.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete Account Permanently"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}

                      {updatingRoleFor === profile.id && <Loader2 className="animate-spin text-edu-blue" size={16} />}
                      {profile.email === 'admin@siddhartha.edu' && <span className="text-xs text-gray-400 italic">Super Admin</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {profiles.filter(profile => (profile.email || '').toLowerCase().includes(rolesSearchQuery.toLowerCase())).length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No profiles found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};

export default RoleManagement;
