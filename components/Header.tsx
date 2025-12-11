
import React, { useState, useEffect, useRef } from 'react';
import { Menu, Sun, Moon, Bell, Briefcase, GraduationCap, LogOut, Settings as SettingsIcon, Check, X } from 'lucide-react';
import { UserPersona, UserProfile, Notification } from '../types';

interface HeaderProps {
  toggleSidebar: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  persona: UserPersona;
  setPersona: (p: UserPersona) => void;
  activeTitle: string;
  user: UserProfile;
  onLogout: () => void;
  onOpenSettings: () => void;
  notifications: Notification[];
  onClearNotifications: () => void;
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ 
    toggleSidebar, darkMode, setDarkMode, persona, setPersona, activeTitle, 
    user, onLogout, onOpenSettings, notifications, onClearNotifications, onSearch 
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 px-4 md:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white hidden md:block">
          {activeTitle}
        </h1>
      </div>

      {/* Middle: Persona Switcher (Pill Style) */}
      <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setPersona('student')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-200 ${persona === 'student' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <GraduationCap className="w-4 h-4" /> Learner
        </button>
        <button 
          onClick={() => setPersona('business')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-200 ${persona === 'business' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <Briefcase className="w-4 h-4" /> Business
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* Settings Button (Replaced Search) */}
        <button 
            onClick={onOpenSettings}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition hidden md:block"
            title="Settings"
        >
            <SettingsIcon className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 relative rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900 animate-pulse"></span>
                )}
            </button>
            
            {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">Notifications</h4>
                        <button onClick={onClearNotifications} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Clear all</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-sm">No new notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 cursor-pointer transition-colors">
                                    <div className="flex gap-3">
                                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${n.type === 'success' ? 'bg-green-500' : n.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Theme Toggle */}
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
            <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow-md hover:shadow-lg transition ring-2 ring-transparent hover:ring-primary-200 dark:hover:ring-primary-900"
            >
                {user.avatarInitials}
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-200 p-2">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        {user.isPremium && <span className="inline-block mt-1 text-[10px] font-bold bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 px-2 py-0.5 rounded-full">PREMIUM</span>}
                    </div>
                    <button onClick={() => { onOpenSettings(); setShowProfileMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 transition">
                        <SettingsIcon className="w-4 h-4"/> Settings
                    </button>
                    <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition">
                        <LogOut className="w-4 h-4"/> Sign Out
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
