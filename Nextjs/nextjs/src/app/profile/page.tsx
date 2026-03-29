'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { 
  User, Star, Clock, ChevronRight, Lock, 
  ShieldCheck, Moon, Globe, HelpCircle, 
  FileText, LogOut 
} from 'lucide-react';

export default function ProfilePage() {
  // Mock state for the Dark Mode toggle
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      {/* PROFESSIONAL HEADER GRADIENT (Matches CeylonHS Branding) */}
      <div className="h-32 w-full absolute top-0 z-0" style={{ background: 'linear-gradient(135deg,#133665,#3A9EEA)' }} />

      <div className="max-w-2xl mx-auto px-4 pt-12 relative z-10 space-y-6">
        
        {/* =========================================
            HEADER ZONE: IDENTITY
        ========================================= */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-4 relative">
            <User className="w-10 h-10 text-[#0B3EA8]" />
            {/* SaaS Badge Indicator */}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Muditha</h1>
          <p className="text-slate-500 text-sm mb-4">muditha@ceylonhs.com</p>
          <button className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-full transition-colors">
            Edit Profile
          </button>
        </div>

        {/* =========================================
            ZONE 1: QUICK ACCESS ACTION CARDS
        ========================================= */}
        <div 
          className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500" 
          style={{ animationFillMode: 'backwards', animationDelay: '100ms' }}
        >
          {/* Favorites Card */}
          <Link 
            href="/favorites" 
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-3 group relative"
          >
            <div className="p-3 bg-blue-50 rounded-full group-hover:bg-white transition-colors">
              <Star className="w-7 h-7 text-[#3A9EEA]" />
            </div>
            <span className="font-bold text-slate-800">Favorites</span>
          </Link>

          {/* History Card */}
          <Link 
            href="/history" 
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-3 group relative"
          >
            {/* The Empty State / Notification Badge */}
            <div className="absolute top-3 right-3 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full border border-slate-200">
              Recent
            </div>
            <div className="p-3 bg-blue-50 rounded-full group-hover:bg-white transition-colors">
              <Clock className="w-7 h-7 text-[#3A9EEA]" />
            </div>
            <span className="font-bold text-slate-800">History</span>
          </Link>
        </div>

        {/* =========================================
            ZONE 2: ACCOUNT & SECURITY
        ========================================= */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationFillMode: 'backwards', animationDelay: '200ms' }}>
          <SettingsGroup title="Account & Security">
            {/* Notice how the size classes are passed directly into the icons now! */}
            <SettingsRow icon={<Lock className="w-5 h-5" />} title="Change Password" />
            <SettingsRow icon={<ShieldCheck className="w-5 h-5" />} title="Two-Factor Authentication" badge="Recommended" />
          </SettingsGroup>
        </div>

        {/* =========================================
            ZONE 3: APP SETTINGS
        ========================================= */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationFillMode: 'backwards', animationDelay: '300ms' }}>
          <SettingsGroup title="App Preferences">
            <SettingsRow 
              icon={<Moon className="w-5 h-5" />} 
              title="Dark Mode" 
              isToggle={true} 
              toggleState={isDarkMode} 
              onToggle={() => setIsDarkMode(!isDarkMode)} 
            />
            <SettingsRow icon={<Globe className="w-5 h-5" />} title="Region & Currency" value="LKR" />
          </SettingsGroup>
        </div>

        {/* =========================================
            ZONE 4: SUPPORT & EXIT
        ========================================= */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationFillMode: 'backwards', animationDelay: '400ms' }}>
          <SettingsGroup title="Support">
            <SettingsRow icon={<HelpCircle className="w-5 h-5" />} title="Help Center & FAQ" />
            <SettingsRow icon={<FileText className="w-5 h-5" />} title="Terms & Privacy Policy" />
          </SettingsGroup>

          <button className="w-full mt-6 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-colors flex items-center justify-center gap-2 text-red-500 font-bold group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// REUSABLE UI COMPONENTS (The DRY Principle)
// ==========================================

function SettingsGroup({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider ml-2">{title}</h3>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ 
  icon, title, value, badge, isToggle, toggleState, onToggle 
}: { 
  icon: ReactNode, title: string, value?: string, badge?: string, isToggle?: boolean, toggleState?: boolean, onToggle?: () => void 
}) {
  return (
    <button 
      onClick={isToggle ? onToggle : undefined}
      className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className="text-slate-400 flex items-center justify-center">
          {icon}
        </div>
        <span className="font-semibold text-slate-700">{title}</span>
        {badge && (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">
            {badge}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-slate-400">
        {value && <span className="text-sm font-semibold text-slate-500">{value}</span>}
        
        {isToggle ? (
          <div className={`w-11 h-6 rounded-full p-1 transition-colors ${toggleState ? 'bg-blue-500' : 'bg-slate-200'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${toggleState ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </div>
    </button>
  );
}