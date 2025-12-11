
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Bell, Shield, CreditCard, Users, Database, Moon, Globe, LogOut, Check } from 'lucide-react';

interface SettingsPageProps {
    user: UserProfile;
    onUpdateUser: (updated: Partial<UserProfile>) => void;
    onLogout: () => void;
    onOpenPricing: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser, onLogout, onOpenPricing }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'account' | 'billing' | 'team'>('general');

    const tabs = [
        { id: 'general', label: 'General', icon: Globe },
        { id: 'account', label: 'Account', icon: User },
        { id: 'billing', label: 'Billing & Plans', icon: CreditCard, show: user.role === 'business' },
        { id: 'team', label: 'Team Members', icon: Users, show: user.role === 'business' },
    ].filter(t => t.show !== false);

    return (
        <div className="max-w-5xl mx-auto animate-fade-in p-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h2>
            
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Nav */}
                <div className="w-full md:w-64 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab.id 
                                    ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <LogOut className="w-4 h-4" /> Reset / Logout
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm min-h-[500px]">
                    
                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Appearance</h3>
                                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                            <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-white">Theme Preference</div>
                                            <div className="text-sm text-slate-500">Toggle between light and dark mode in the top bar.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Notifications</h3>
                                <div className="space-y-3">
                                    {['Email updates on new features', 'Solution calculation completion alerts', 'Weekly optimization summary'].map((label, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACCOUNT TAB */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                                    {user.avatarInitials}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
                                    <p className="text-slate-500">{user.email}</p>
                                    <span className="inline-block mt-2 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                        {user.role} Account
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Display Name</label>
                                    <input type="text" defaultValue={user.name} className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                    <input type="email" defaultValue={user.email} disabled className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-500 cursor-not-allowed" />
                                </div>
                                {user.role === 'business' && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Company Name</label>
                                        <input type="text" defaultValue={user.companyName} className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent" />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-primary-700 transition">Save Changes</button>
                            </div>
                        </div>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <div className="space-y-8">
                            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-slate-500 font-bold uppercase mb-1">Current Plan</div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {user.isPremium ? 'Business Premium' : 'Free Business Trial'}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {user.isPremium ? 'Renews on Dec 31, 2024' : 'Limited features. Upgrade to unlock full power.'}
                                    </p>
                                </div>
                                {!user.isPremium && (
                                    <button onClick={onOpenPricing} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-blue-600/20 transition">
                                        Upgrade Plan
                                    </button>
                                )}
                            </div>

                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-4">Payment Methods</h4>
                                <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded">
                                        <CreditCard className="w-6 h-6 text-slate-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-mono font-bold text-slate-900 dark:text-white">•••• •••• •••• 4242</div>
                                        <div className="text-xs text-slate-500">Expires 12/25</div>
                                    </div>
                                    <button className="text-sm text-blue-600 hover:underline font-medium">Edit</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TEAM TAB */}
                    {activeTab === 'team' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team Management</h3>
                                <button className="text-sm bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg font-bold hover:bg-primary-100 transition">
                                    + Add Member
                                </button>
                            </div>
                            
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">Member</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        <tr className="bg-white dark:bg-slate-800">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">{user.avatarInitials}</div>
                                                {user.name} <span className="text-slate-400 font-normal">(You)</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">Owner</td>
                                            <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-bold"><Check className="w-3 h-3"/> Active</span></td>
                                            <td className="px-4 py-3 text-right"></td>
                                        </tr>
                                        <tr className="bg-white dark:bg-slate-800">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">JD</div>
                                                Jane Doe
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">Analyst</td>
                                            <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-bold"><Check className="w-3 h-3"/> Active</span></td>
                                            <td className="px-4 py-3 text-right"><button className="text-slate-400 hover:text-red-500">Remove</button></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
