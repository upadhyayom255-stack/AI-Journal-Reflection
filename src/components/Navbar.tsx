import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  History, 
  Target, 
  BarChart3, 
  Settings, 
  Plus, 
  LogOut, 
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { ViewMode } from '../types';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onNewJournal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onNewJournal,
}) => {
  const { user, userProfile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems: { view: ViewMode; label: string; icon: React.ReactNode }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <BookOpen className="w-4 h-4" /> },
    { view: 'history', label: 'Journals', icon: <History className="w-4 h-4" /> },
    { view: 'goals', label: 'Goals', icon: <Target className="w-4 h-4" /> },
    { view: 'insights', label: 'Insights', icon: <BarChart3 className="w-4 h-4" /> },
    { view: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-stone-950 transition-all duration-200">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif text-lg font-semibold tracking-tight text-stone-100 block leading-tight">
                  AI Journal
                </span>
                <span className="text-[10px] tracking-widest uppercase text-stone-400 font-medium">
                  & Reflection
                </span>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentView === item.view || (item.view === 'history' && currentView === 'journal-chat');
                return (
                  <button
                    key={item.view}
                    id={`nav-${item.view}`}
                    onClick={() => {
                      onNavigate(item.view);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-stone-800 text-amber-400 shadow-inner'
                        : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-3">
            <button
              id="new-journal-btn"
              onClick={onNewJournal}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl text-xs font-bold tracking-wide uppercase shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Journal</span>
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                id="user-menu-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-stone-800/60 border border-stone-700/60 hover:border-stone-600 transition"
              >
                <div className="text-right hidden xl:block">
                  <p className="text-xs font-semibold text-stone-200 leading-tight">
                    {userProfile?.displayName || user?.displayName || 'User'}
                  </p>
                  <p className="text-[10px] text-stone-400 truncate max-w-[120px]">
                    {userProfile?.email || user?.email || ''}
                  </p>
                </div>
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-amber-400/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-stone-700 flex items-center justify-center text-stone-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl py-2 z-50 text-stone-200 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-stone-800">
                    <p className="text-xs font-semibold text-stone-100 truncate">
                      {userProfile?.displayName || user?.displayName || 'Signed In'}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate">
                      {userProfile?.email || user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-stone-800 text-stone-300 hover:text-stone-100 transition"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Account &amp; Privacy</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium hover:bg-red-950/40 text-red-400 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onNewJournal}
              className="p-2 bg-amber-400 text-stone-950 rounded-xl"
              aria-label="New Journal"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-stone-300 hover:text-stone-100 bg-stone-800 rounded-xl"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-stone-800 bg-stone-900 px-4 pt-2 pb-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                onNavigate(item.view);
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                currentView === item.view ? 'bg-stone-800 text-amber-400' : 'text-stone-300'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-7 h-7 rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <span className="text-xs text-stone-300 font-medium">
                {user?.displayName || 'User'}
              </span>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-xs text-red-400 px-3 py-1.5 bg-red-950/40 rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
