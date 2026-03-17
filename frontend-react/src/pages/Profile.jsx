import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Key, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axiosConfig';

const Profile = () => {
    const [user, setUser] = useState({ name: "", email: "" });
    const [isLoading, setIsLoading] = useState(true);
    
    // Password Change States
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
    const [pwStatus, setPwStatus] = useState({ type: "", message: "", loading: false });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await api.get('/auth/me'); // Assuming you have an /auth/me route
                if (res.data.success) {
                    setUser({ name: res.data.user.name, email: res.data.user.email });
                }
            } catch (err) {
                console.error("Failed to fetch user data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPwStatus({ type: "", message: "", loading: false });

        if (passwords.new !== passwords.confirm) {
            setPwStatus({ type: "error", message: "New passwords do not match." });
            return;
        }

        if (passwords.new.length < 6) {
            setPwStatus({ type: "error", message: "New password must be at least 6 characters." });
            return;
        }

        setPwStatus({ type: "", message: "", loading: true });

        try {
            const res = await api.post('/change-password', {
                old_password: passwords.old,
                new_password: passwords.new
            });
            
            if (res.data.success) {
                setPwStatus({ type: "success", message: res.data.message });
                setPasswords({ old: "", new: "", confirm: "" }); // Clear form
                setTimeout(() => setIsChangingPassword(false), 2000); // Auto close after success
            }
        } catch (err) {
            setPwStatus({ type: "error", message: err.response?.data?.message || "Failed to update password." });
        } finally {
            setPwStatus(prev => ({ ...prev, loading: false }));
        }
    };

    if (isLoading) {
        return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-violet-500" size={40} /></div>;
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-3xl mx-auto space-y-8">
            <header>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                    <User className="text-violet-500" size={32}/> Profile Settings
                </h2>
                <p className="text-gray-500 mt-1">Manage your account details and security preferences.</p>
            </header>

            {/* USER DETAILS CARD */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                    <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center text-2xl font-black uppercase">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-2xl font-extrabold text-gray-900">{user.name}</h3>
                        <p className="text-gray-500 flex items-center gap-1.5 mt-1">
                            <Mail size={16} className="text-gray-400" /> {user.email}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                        <div className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-bold">
                            {user.name}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Email Address</label>
                        <div className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-bold">
                            {user.email}
                        </div>
                    </div>
                </div>
            </div>

            {/* CHANGE PASSWORD TAB */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                <button 
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="w-full p-6 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors outline-none"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><Lock size={20}/></div>
                        <div className="text-left">
                            <h4 className="text-lg font-bold text-gray-900">Change Password</h4>
                            <p className="text-sm text-gray-500">Update your security credentials</p>
                        </div>
                    </div>
                    {isChangingPassword ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
                </button>

                {isChangingPassword && (
                    <div className="p-6 pt-0 border-t border-gray-50 animate-in slide-in-from-top-2 duration-300">
                        <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-6">
                            
                            {pwStatus.message && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${pwStatus.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                    {pwStatus.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle size={18}/>}
                                    {pwStatus.message}
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Current Password</label>
                                <div className="relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                    <input 
                                        type="password" 
                                        required
                                        value={passwords.old}
                                        onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
                                        placeholder="Enter your old password"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">New Password</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                        className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
                                        placeholder="New password"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Confirm New</label>
                                    <input 
                                        type="password" 
                                        required
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                        className="w-full px-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-medium"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button 
                                    type="submit" 
                                    disabled={pwStatus.loading}
                                    className="px-8 py-3.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {pwStatus.loading ? <Loader2 size={18} className="animate-spin" /> : "Update Securely"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Profile;