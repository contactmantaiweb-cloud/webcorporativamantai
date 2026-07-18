import React from 'react';
import { LogOut, User, Calendar, ShieldCheck } from 'lucide-react';
import { Member } from '../types';

interface NavbarProps {
  currentMember: Member;
  onLogout: () => void;
}

export default function Navbar({ currentMember, onLogout }: NavbarProps) {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrador (MantaiWeb)', bg: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'CEO':
        return { label: 'CEO (Director Ejecutivo)', bg: 'bg-rose-100 text-rose-700 border-rose-200' };
      case 'CFO/CPO':
        return { label: 'CFO/CPO (Director Financiero)', bg: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'CPO/CFO':
        return { label: 'CPO/CFO (Director de Producto)', bg: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'CMO':
        return { label: 'CMO (Director de Marketing)', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'CIO':
        return { label: 'CIO (Director de Tecnologías)', bg: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'PRODUCTION TEAM':
        return { label: 'PRODUCTION TEAM (Producción)', bg: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
      case 'accountant':
        return { label: 'Colaborador / Socio', bg: 'bg-teal-100 text-teal-700 border-teal-200' };
      default:
        return { label: 'Miembro', bg: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const roleMeta = getRoleLabel(currentMember.role);

  // Format today's date in Spanish nicely
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date().toLocaleDateString('es-ES', options);
  };

  return (
    <header className="bg-white border-b border-gray-100 py-4 px-6 flex items-center justify-between" id="app-navbar">
      {/* Date status */}
      <div className="flex items-center gap-2.5 text-gray-500 text-sm" id="navbar-date">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="capitalize font-medium">{getFormattedDate()}</span>
      </div>

      {/* User profile & controls */}
      <div className="flex items-center gap-4" id="navbar-user-area">
        {/* Role Badge */}
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${roleMeta.bg}`} id="navbar-user-role">
          {roleMeta.label}
        </span>

        {/* Member profile name */}
        <div className="flex items-center gap-2.5" id="navbar-profile-summary">
          <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${currentMember.avatarColor || 'bg-blue-600'}`} id="navbar-avatar">
            {currentMember.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-gray-800" id="navbar-username">{currentMember.name}</div>
            <div className="text-[10px] text-gray-400 font-medium" id="navbar-useremail">{currentMember.email}</div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-100 hidden sm:block" />

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-150"
          id="navbar-logout-btn"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}
