import React, { useState, useMemo } from 'react';
import { Users, Plus, ShieldCheck, Key, ShieldAlert, UserPlus, ToggleLeft, ToggleRight, Trash2, Wallet, Info, Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Member, UserRole, Transaction } from '../types';
import { useConfirm } from './ConfirmProvider';

interface TeamViewProps {
  members: Member[];
  currentMember: Member;
  transactions?: Transaction[];
  onAddMember: (newMember: Omit<Member, 'id'>) => void;
  onToggleActive: (id: string) => void;
  onDeleteMember: (id: string) => void;
  onManagePayments?: (memberId: string) => void;
}

export default function TeamView({
  members,
  currentMember,
  transactions = [],
  onAddMember,
  onToggleActive,
  onDeleteMember,
  onManagePayments
}: TeamViewProps) {
  const confirmDialog = useConfirm();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('PRODUCTION TEAM');
  const [password, setPassword] = useState('');

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Hierarchy map for roles to make organizational sorting intuitive
  const ROLE_HIERARCHY: Record<UserRole, number> = {
    admin: 1,
    CEO: 2,
    'CFO/CPO': 3,
    'CPO/CFO': 4,
    CIO: 5,
    CMO: 6,
    'PRODUCTION TEAM': 7,
    accountant: 8,
  };

  // Detailed role descriptions for clear organizational mapping
  const ROLE_INFO: Record<UserRole, { title: string; desc: string }> = {
    admin: {
      title: 'Administrador (MantaiWeb)',
      desc: 'Control integral de la plataforma, accesos, presupuestos y balance global.',
    },
    CEO: {
      title: 'CEO - Director Ejecutivo',
      desc: 'Dirección estratégica general y máxima supervisión del negocio.',
    },
    'CFO/CPO': {
      title: 'CFO/CPO - Dir. Financiero & Técnico',
      desc: 'Gestión de flujos de efectivo, proyecciones y arquitectura técnica.',
    },
    'CPO/CFO': {
      title: 'CPO/CFO - Dir. de Producto & Financiero',
      desc: 'Dirección de producto y co-administración de presupuestos y finanzas.',
    },
    CMO: {
      title: 'CMO - Director de Marketing',
      desc: 'Dirección de campañas de marketing, pauta y adquisición de clientes.',
    },
    CIO: {
      title: 'CIO - Director de Tecnologías',
      desc: 'Administración de servidores, herramientas de TI e infraestructura digital.',
    },
    'PRODUCTION TEAM': {
      title: 'Equipo de Producción',
      desc: 'Desarrollo de proyectos, diseño y producción operativa general.',
    },
    accountant: {
      title: 'Colaborador / Socio',
      desc: 'Socio de negocio con permisos de visibilidad contable.',
    }
  };

  const processedMembers = useMemo(() => {
    // 1. Filter by search term
    let result = [...members];
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (m) => m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)
      );
    }

    // 2. Sort ONLY by Role Hierarchy
    result.sort((a, b) => {
      const scoreA = ROLE_HIERARCHY[a.role] || 99;
      const scoreB = ROLE_HIERARCHY[b.role] || 99;
      return scoreA - scoreB;
    });

    return result;
  }, [members, searchTerm]);

  // Role security check: Only 'admin' can add/delete/disable members
  const isAdmin = currentMember.role === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      alert('Error de Seguridad: Solo los Administradores de la empresa pueden dar de alta a nuevos miembros.');
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      alert('Por favor complete todos los datos del nuevo miembro.');
      return;
    }

    if (members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) {
      alert('Ya existe una cuenta corporativa registrada con este correo electrónico.');
      return;
    }

    // Assign randomized bg color for avatars
    const colors = ['bg-blue-600', 'bg-purple-600', 'bg-indigo-600', 'bg-rose-600', 'bg-amber-600', 'bg-emerald-600'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    onAddMember({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      active: true,
      avatarColor,
      password: password.trim(),
    });

    setName('');
    setEmail('');
    setRole('PRODUCTION TEAM');
    setPassword('');
    setIsAdding(false);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
      case 'CEO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CPO/CFO':
      case 'CFO/CPO':
      case 'CMO':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CIO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PRODUCTION TEAM':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6" id="team-view-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="team-header">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Equipo y Control de Accesos</h2>
          <p className="text-sm text-gray-500">
            Administra los roles, credenciales y estados de actividad de las cuentas corporativas autorizadas.
          </p>
        </div>
        {isAdmin && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition shrink-0 self-start sm:self-auto cursor-pointer"
            id="invite-member-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Acceso Corporativo</span>
          </button>
        )}
      </div>

      {/* Module Purpose Info Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold block mb-0.5">¿Para qué sirve este módulo?</strong>
          <p className="text-blue-800/80 leading-relaxed">
            El módulo de <strong>Equipo y Control de Accesos</strong> centraliza la gestión de los colaboradores del proyecto. Permite a los administradores crear cuentas de acceso exclusivas con usuario y contraseña, activar o desactivar credenciales de forma inmediata para revocar permisos, y asignar roles específicos (Admin, CEO, CFO, CIO, Equipo de Producción). También enlaza de forma directa con la pasarela de pagos individuales de cada miembro del equipo.
          </p>
        </div>
      </div>

      {/* Adding Member Form (Only Admins) */}
      {isAdmin && isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-md max-w-lg animate-fade-in" id="add-member-form">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
              <UserPlus className="w-4.5 h-4.5 text-blue-600" />
              Alta de Nuevo Miembro Corporativo
            </h3>
            <button
              onClick={() => setIsAdding(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Juan Pérez"
                  required
                  className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Correo Corporativo (Login)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@mantai.com"
                  required
                  className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Rol del Miembro
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="CEO">CEO (Director Ejecutivo)</option>
                  <option value="CFO/CPO">CFO/CPO (Director Financiero y Técnico)</option>
                  <option value="CPO/CFO">CPO/CFO (Director de Producto y Financiero)</option>
                  <option value="CMO">CMO (Director de Marketing)</option>
                  <option value="CIO">CIO (Director de Tecnologías)</option>
                  <option value="PRODUCTION TEAM">PRODUCTION TEAM (Equipo de Producción Audiovisual)</option>
                  <option value="accountant">Colaborador / Socio</option>
                  <option value="admin">Administrador (MantaiWeb)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Contraseña de Ingreso
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Escribe una contraseña segura..."
                  required
                  className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
              >
                Habilitar Acceso
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between" id="team-controls-bar">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Buscar colaborador por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
          />
        </div>
      </div>

      {/* Members Grid list */}
      {processedMembers.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center shadow-xs">
          <p className="text-sm text-gray-500 font-medium">No se encontraron colaboradores que coincidan con los filtros de búsqueda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="members-grid-layout">
          {processedMembers.map((m) => {
            const isCurrentUser = m.id === currentMember.id;
          
          // Calculate Member Financials
          const generatedIncome = transactions
            .filter((t) => t.loggedBy === m.name && t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
          const paymentsReceived = transactions
            .filter((t) => t.targetMemberId === m.id && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          const pendingBalance = paymentsReceived;
          

          return (
            <div
              key={m.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition ${
                isCurrentUser ? 'border-blue-200 ring-2 ring-blue-50/50' : 'border-gray-100'
              }`}
              id={`member-card-${m.id}`}
            >
              <div>
                {/* Header Card (Avatar & status indicator) */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-sm shadow-sm ${m.avatarColor || 'bg-blue-600'}`}>
                      {m.name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 leading-snug">
                        {m.name}
                        {isCurrentUser && (
                          <span className="ml-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full uppercase">
                            Tú
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-gray-400 font-medium">{m.email}</span>
                    </div>
                  </div>
                </div>

                {/* Role details */}
                <div className="space-y-2.5 pb-4 border-b border-gray-50">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider">Rol Corporativo</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(m.role)}`}>
                        {ROLE_INFO[m.role]?.title || m.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-normal bg-gray-50 p-2.5 rounded-xl border border-gray-150">
                      {ROLE_INFO[m.role]?.desc}
                    </p>
                  </div>
                </div>
                
                {/* Balance & Payments (Visible to admin, or the user themselves) */}
                {(isAdmin || isCurrentUser) && (
                  <div className="py-3 space-y-1.5 border-b border-gray-50">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Plata Generada:</span>
                      <span className="font-bold text-emerald-600">₡{generatedIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Pagos Recibidos:</span>
                      <span className="font-bold text-gray-900">₡{paymentsReceived.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-50 mt-1">
                      <span className="text-gray-500 font-bold">Balance Pendiente:</span>
                      <span className={`font-extrabold ${pendingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ₡{pendingBalance.toLocaleString()}
                      </span>
                    </div>
                    
                    {isAdmin && onManagePayments && (
                      <button
                        onClick={() => onManagePayments(m.id)}
                        className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-bold cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        Gestionar Pagos
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer actions */}
              <div className="pt-3.5 flex items-center justify-between" id={`member-card-footer-${m.id}`}>
                {/* Active status toggle */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acceso:</span>
                  <button
                    disabled={!isAdmin || isCurrentUser}
                    onClick={() => onToggleActive(m.id)}
                    className={`flex items-center transition ${
                      !isAdmin || isCurrentUser ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    title={
                      !isAdmin
                        ? 'Requiere permisos de Administrador'
                        : isCurrentUser
                        ? 'No puedes desactivar tu propia cuenta activa'
                        : 'Alternar estado'
                    }
                  >
                    {m.active ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <ToggleRight className="w-6 h-6 text-emerald-600 shrink-0" />
                        <span>Activo</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-gray-400">
                        <ToggleLeft className="w-6 h-6 text-gray-400 shrink-0" />
                        <span>Inactivo</span>
                      </span>
                    )}
                  </button>
                </div>

                {/* Delete Account */}
                {isAdmin && !isCurrentUser && (
                  <button
                    onClick={() => {
                      confirmDialog('¿Estás seguro de que quieres hacer esto?', () => {
                        onDeleteMember(m.id);
                      });
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Suprimir acceso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
