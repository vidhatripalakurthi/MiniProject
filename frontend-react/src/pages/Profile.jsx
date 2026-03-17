import React, { useState, useEffect } from 'react';
import { Briefcase, Mail, Key, ShieldCheck, History, User, Lock, ArrowRight } from 'lucide-react';
import api from '../api/axiosConfig';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('security'); // 'security' or 'activity'

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.success) {
                    setUserData(res.data.user);
                }
            } catch (err) {
                console.error("Failed to fetch user profile", err);
            }
        };
        fetchUserData();
    }, []);

    if (!userData) return <div className="p-10 text-gray-500 font-medium">Loading profile data...</div>;

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-10">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Account Settings</h2>
                <p className="text-gray-500">Manage your profile information and security preferences.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
                        <div className="px-6 pb-8">
                            <div className="relative -mt-12 mb-4 flex justify-center">
                                <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-md">
                                    <div className="w-full h-full bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-4xl font-bold">
                                        {userData.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">{userData.name}</h3>
                                <p className="text-sm text-gray-500 font-medium">TrendCast Intelligence User</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <Mail size={16} className="text-violet-500" />
                                    <span className="text-xs font-semibold text-gray-700 truncate">{userData.email}</span>
                                </div>
                                <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <Briefcase size={16} className="text-violet-500" />
                                    <span className="text-xs font-semibold text-gray-700">{userData.business_type || "Retailer"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Block */}
                    <div className="bg-violet-600 rounded-3xl p-6 text-white shadow-lg shadow-violet-200">
                        <div className="flex items-center justify-between mb-4">
                            <ShieldCheck size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Account Status</span>
                        </div>
                        <p className="text-sm font-medium opacity-90">Your account is</p>
                        <p className="text-2xl font-bold">Fully Verified</p>
                        <div className="mt-4 h-1.5 w-full bg-violet-400/30 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-full rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Tabs & Content */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Tab Navigation */}
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-2xl w-fit">
                        <button 
                            onClick={() => setActiveTab('security')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="flex items-center gap-2"><Lock size={16}/> Security</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('activity')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'activity' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="flex items-center gap-2"><History size={16}/> Recent Activity</span>
                        </button>
                    </div>

                    {/* SECURITY TAB: Change Password */}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-gray-900">Change Password</h4>
                                <p className="text-sm text-gray-500 mt-1">Ensure your account is using a long, random password to stay secure.</p>
                            </div>

                            <form className="space-y-4 max-w-md">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Current Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">New Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Confirm New Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all" />
                                </div>
                                <button type="button" className="mt-2 px-8 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 shadow-md transition-all">
                                    Update Password
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ACTIVITY TAB: Dummy History */}
                    {activeTab === 'activity' && (
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h4 className="text-xl font-bold text-gray-900 mb-6">Project History</h4>
                            <div className="space-y-4">
                                {[
                                    { action: "Forecast Generated", target: "Electronic_Sales_Q1.csv", time: "2 hours ago", color: "text-green-500" },
                                    { action: "Dataset Cleaned", target: "Retail_Inventory_Final.xlsx", time: "Yesterday", color: "text-blue-500" },
                                    { action: "Login Detected", target: "Chrome on Windows", time: "March 16, 2026", color: "text-violet-500" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-violet-200 transition-all cursor-default">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-2 h-2 rounded-full ${item.color.replace('text', 'bg')}`}></div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{item.action}</p>
                                                <p className="text-xs text-gray-500">{item.target}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{item.time}</span>
                                            <ArrowRight size={14} className="text-gray-300 group-hover:text-violet-400 transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;