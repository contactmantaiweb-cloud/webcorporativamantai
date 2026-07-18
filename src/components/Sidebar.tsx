import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Coins,
  Scale,
  Receipt,
  Users,
  Database,
  Building2,
  Sparkles,
  type LucideIcon
} from 'lucide-react';
import { Member } from '../types';

export type ActiveTab = 'dashboard' | 'calendar' | 'transactions' | 'budgets' | 'invoices' | 'members' | 'data' | 'member-payments' | 'ai-assistant';


interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  companyName?: string;
  subTitle?: string;
  currentMember: Member;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  companyName = 'Mantai',
  subTitle = 'Agencia digital',
  currentMember
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as ActiveTab, label: 'Panel General', icon: LayoutDashboard },
    { id: 'calendar' as ActiveTab, label: 'Calendario y Trabajos', icon: Calendar },
    { id: 'transactions' as ActiveTab, label: 'Finanzas', icon: Coins },
    { id: 'budgets' as ActiveTab, label: 'Presupuestos', icon: Scale },
    { id: 'invoices' as ActiveTab, label: 'Facturas de Clientes', icon: Receipt },
    { id: 'members' as ActiveTab, label: 'Equipo y Accesos', icon: Users },
    { id: 'ai-assistant' as ActiveTab, label: 'Asistente de IA', icon: Sparkles },
    ...(currentMember.role === 'admin'
      ? [{ id: 'data' as ActiveTab, label: 'Exportar / Importar', icon: Database }]
      : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen" id="app-sidebar">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-gray-50 flex items-center gap-3" id="sidebar-logo-header">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
          <Building2 className="w-5.5 h-5.5" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-gray-900 leading-none tracking-tight">{companyName}</h1>
          <span className="text-xs text-gray-400 font-medium mt-1 block">{subTitle}</span>
        </div>
      </div>

      {/* Main Navigation Menu Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto" id="sidebar-nav">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block px-3 mb-3">
          Módulos Principales
        </span>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition duration-150 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-50/50'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
              id={`sidebar-link-${item.id}`}
            >
              <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-auto" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Branding Area */}
      <div className="p-4 border-t border-gray-50 bg-gray-50/50" id="sidebar-footer">
        <div className="bg-white border border-gray-100 p-3 rounded-xl flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-xs">
            <span className="font-semibold text-gray-700 block leading-none">Canal de Datos</span>
            <span className="text-[10px] text-gray-400 font-medium">Conexión Segura SSL</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
