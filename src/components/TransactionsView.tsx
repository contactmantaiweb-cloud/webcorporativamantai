import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  X,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { Transaction, Member, UserRole } from '../types';
import { useConfirm } from './ConfirmProvider';
import { formatDateLocal, parseLocalDate } from '../utils/dateUtils';

interface TransactionsViewProps {
  transactions: Transaction[];
  currentMember: Member;
  members?: Member[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (id: string, updated: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Ventas de Proyectos',
  'Suscripción servicio pagina web',
  'Suscripcion Bot',
  'Suscripcion videos cortos',
  'Suscripcion servicios de Marketing digital',
  'Sueldos y Honorarios',
  'Infraestructura Cloud',
  'Marketing Digital',
  'Soporte y Licencias',
  'Servicios de Oficina',
  'Impuestos y Tasas',
  'Consultorías',
  'Otros Gastos',
];

export default function TransactionsView({
  transactions,
  currentMember,
  members = [],
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}: TransactionsViewProps) {
  const confirmDialog = useConfirm();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(formatDateLocal());
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formCategory, setFormCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formStatus, setFormStatus] = useState<'completed' | 'pending'>('completed');
  const [formTargetMemberId, setFormTargetMemberId] = useState<string>('');

  // Extract unique categories from all current transactions
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => cats.add(t.category));
    return Array.from(cats);
  }, [transactions]);

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const isPayment = t.category === 'Pago a Equipo' || !!t.targetMemberId;
      const hasAccess = currentMember.role === 'admin' || t.targetMemberId === currentMember.id || t.targetMemberId === 'ALL' || !t.targetMemberId;
      const displayDesc = isPayment && !hasAccess ? 'Pago realizado a un contribuyente' : t.description;

      const matchesSearch =
        displayDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.loggedBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' ? true : t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter;

      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter, statusFilter, currentMember.id, currentMember.role]);

  // Handle save transaction (Add or Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formDescription.trim()) {
      alert('Por favor ingrese una descripción.');
      return;
    }
    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor ingrese un monto válido mayor a cero.');
      return;
    }

    const finalCategory = formCategory === 'OTRA' ? (customCategory.trim() || 'Otros') : formCategory;

    // Preserve original description if user is editing a payment they don't have access to
    const existingTx = editingId ? transactions.find((t) => t.id === editingId) : null;
    const isPayment = existingTx && (existingTx.category === 'Pago a Equipo' || !!existingTx.targetMemberId);
    const hasAccess = existingTx && (currentMember.role === 'admin' || existingTx.targetMemberId === currentMember.id || existingTx.targetMemberId === 'ALL');
    const finalDescription = (isPayment && !hasAccess) ? (existingTx?.description || formDescription) : formDescription;

    const dataPayload = {
      date: formDate,
      type: formType,
      category: finalCategory,
      description: finalDescription,
      amount: numAmount,
      status: formStatus,
      targetMemberId: formTargetMemberId || undefined,
      loggedBy: editingId
        ? transactions.find((t) => t.id === editingId)?.loggedBy || currentMember.name
        : currentMember.name,
    };

    if (editingId) {
      onUpdateTransaction(editingId, dataPayload);
    } else {
      onAddTransaction(dataPayload);
    }

    closeFormModal();
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormDate(formatDateLocal());
    setFormType('expense');
    setFormCategory(DEFAULT_CATEGORIES[0]);
    setCustomCategory('');
    setFormDescription('');
    setFormAmount('');
    setFormStatus('completed');
    setFormTargetMemberId('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transaction) => {
    setEditingId(t.id);
    setFormDate(t.date);
    setFormType(t.type);
    
    if (DEFAULT_CATEGORIES.includes(t.category)) {
      setFormCategory(t.category);
      setCustomCategory('');
    } else {
      setFormCategory('OTRA');
      setCustomCategory(t.category);
    }

    const isPayment = t.category === 'Pago a Equipo' || !!t.targetMemberId;
    const hasAccess = currentMember.role === 'admin' || t.targetMemberId === currentMember.id || t.targetMemberId === 'ALL';
    setFormDescription(isPayment && !hasAccess ? 'Pago realizado a un contribuyente' : t.description);
    setFormAmount(t.amount.toString());
    setFormStatus(t.status);
    setFormTargetMemberId(t.targetMemberId || '');
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  // Format money helper
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Cash Flow Chart calculations
  const chartData = useMemo(() => {
    const weeks = [
      { name: 'Semana 1', income: 0, expense: 0 },
      { name: 'Semana 2', income: 0, expense: 0 },
      { name: 'Semana 3', income: 0, expense: 0 },
      { name: 'Semana 4', income: 0, expense: 0 },
    ];

    transactions.forEach((t) => {
      if (t.status !== 'completed') return;
      const tDate = parseLocalDate(t.date);
      const day = tDate.getDate();

      let weekIdx = 3;
      if (day <= 7) weekIdx = 0;
      else if (day <= 14) weekIdx = 1;
      else if (day <= 21) weekIdx = 2;

      if (t.type === 'income') {
        weeks[weekIdx].income += t.amount;
      } else {
        weeks[weekIdx].expense += t.amount;
      }
    });

    return weeks;
  }, [transactions]);

  const maxChartVal = useMemo(() => {
    const vals = chartData.flatMap((d) => [d.income, d.expense]);
    const max = Math.max(...vals, 1000);
    return Math.ceil(max / 1000) * 1000;
  }, [chartData]);

  const points = useMemo(() => {
    const paddingLeft = 60;
    const chartWidth = 500;
    const Y_bottom = 170;
    const chartHeight = 150;

    const incomePoints = chartData.map((d, i) => {
      const x = paddingLeft + (i * (chartWidth / 3));
      const y = Y_bottom - (maxChartVal > 0 ? (d.income / maxChartVal) * chartHeight : 0);
      return { x, y, value: d.income };
    });

    const expensePoints = chartData.map((d, i) => {
      const x = paddingLeft + (i * (chartWidth / 3));
      const y = Y_bottom - (maxChartVal > 0 ? (d.expense / maxChartVal) * chartHeight : 0);
      return { x, y, value: d.expense };
    });

    const incomeLinePath = `M ${incomePoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    const incomeAreaPath = `M ${incomePoints[0].x} ${Y_bottom} L ${incomePoints.map(p => `${p.x} ${p.y}`).join(' L ')} L ${incomePoints[3].x} ${Y_bottom} Z`;

    const expenseLinePath = `M ${expensePoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;
    const expenseAreaPath = `M ${expensePoints[0].x} ${Y_bottom} L ${expensePoints.map(p => `${p.x} ${p.y}`).join(' L ')} L ${expensePoints[3].x} ${Y_bottom} Z`;

    return {
      incomePoints,
      expensePoints,
      incomeLinePath,
      incomeAreaPath,
      expenseLinePath,
      expenseAreaPath,
    };
  }, [chartData, maxChartVal]);

  // Helper colors
  const getTypeBadgeStyles = (type: 'income' | 'expense') => {
    return type === 'income'
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      : 'bg-rose-50 text-rose-700 border border-rose-200';
  };

  return (
    <div className="space-y-6" id="transactions-view-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="ledger-header">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Registro de Operaciones (Finanzas)</h2>
          <p className="text-sm text-gray-500">Administra todas las transacciones de ingresos y egresos de la compañía.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition duration-150 shrink-0 self-start sm:self-auto cursor-pointer"
          id="add-transaction-btn-header"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Movimiento</span>
        </button>
      </div>

      {/* Module Purpose Info Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold block mb-0.5">¿Para qué sirve este módulo?</strong>
          <p className="text-blue-800/80 leading-relaxed">
            El <strong>Registro de Operaciones (Finanzas)</strong> funciona como el libro diario contable de la empresa. Aquí se registran todos los ingresos (ej. cobros de proyectos, ventas, servicios) y egresos (gastos, pago a equipo, compras de insumos). Además de filtrar, buscar y exportar datos, este módulo procesa la información para proyectar el gráfico de <strong>Flujo de Caja Mensual</strong> en colones costarricenses (₡), dándote claridad sobre la rentabilidad real de las operaciones.
          </p>
        </div>
      </div>

      {/* Monthly Cash Flow Card (Line Chart) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" id="cashflow-line-chart-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-base text-gray-800 tracking-tight">Flujo de Caja Mensual</h3>
            <p className="text-xs text-gray-400">Comparativa de ingresos vs gastos acumulados por semana de este mes (Diagrama Lineal)</p>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 block" />
              <span className="text-gray-500">Ingresos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 block" />
              <span className="text-gray-500">Gastos</span>
            </div>
          </div>
        </div>

        {/* Custom SVG Line Chart */}
        <div className="w-full relative pt-2 pb-2" id="svg-line-chart-container">
          <svg className="w-full h-auto" viewBox="0 0 600 210" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="income-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="expense-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <g stroke="#f3f4f6" strokeWidth="1">
              {/* Y Axis Grid Lines */}
              <line x1="60" y1="20" x2="560" y2="20" strokeDasharray="3 3" />
              <line x1="60" y1="70" x2="560" y2="70" strokeDasharray="3 3" />
              <line x1="60" y1="120" x2="560" y2="120" strokeDasharray="3 3" />
              <line x1="60" y1="170" x2="560" y2="170" />
            </g>

            {/* Axis Y Labels */}
            <g fill="#9ca3af" fontSize="10" fontWeight="600" textAnchor="end">
              <text x="50" y="23">{formatMoney(maxChartVal)}</text>
              <text x="50" y="73">{formatMoney(maxChartVal * 0.66)}</text>
              <text x="50" y="123">{formatMoney(maxChartVal * 0.33)}</text>
              <text x="50" y="173">$0</text>
            </g>

            {/* Area under Income Line */}
            <path d={points.incomeAreaPath} fill="url(#income-grad)" />

            {/* Area under Expense Line */}
            <path d={points.expenseAreaPath} fill="url(#expense-grad)" />

            {/* Income Line */}
            <path d={points.incomeLinePath} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Expense Line */}
            <path d={points.expenseLinePath} fill="none" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Interactive Nodes & Tooltips */}
            {points.incomePoints.map((p, i) => (
              <g key={`inc-node-${i}`} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" className="transition-all duration-200 hover:r-7" />
                <title>{`Ingresos ${chartData[i].name}: ${formatMoney(p.value)}`}</title>
              </g>
            ))}

            {points.expensePoints.map((p, i) => (
              <g key={`exp-node-${i}`} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.5" className="transition-all duration-200 hover:r-7" />
                <title>{`Gastos ${chartData[i].name}: ${formatMoney(p.value)}`}</title>
              </g>
            ))}

            {/* X Axis Labels */}
            <g fill="#6b7280" fontSize="10" fontWeight="700" textAnchor="middle">
              {chartData.map((d, i) => (
                <text key={`x-lbl-${i}`} x={60 + (i * (500 / 3))} y="195">{d.name}</text>
              ))}
            </g>
          </svg>
        </div>
      </div>

      {/* Control Panel: Filters, search and statistics */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4" id="ledger-filters-panel">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por concepto o autor..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white transition"
              id="search-ledger-input"
            />
          </div>

          {/* Type Selector Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 shrink-0">Tipo:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              id="filter-type-select"
            >
              <option value="all">Todos los flujos</option>
              <option value="income">Solo Ingresos (+)</option>
              <option value="expense">Solo Egresos (-)</option>
            </select>
          </div>

          {/* Category Selector Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 shrink-0">Categoría:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              id="filter-category-select"
            >
              <option value="all">Todas las categorías</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Selector Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 shrink-0">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              id="filter-status-select"
            >
              <option value="all">Todos los estados</option>
              <option value="completed">Completados</option>
              <option value="pending">Pendientes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" id="ledger-table-panel">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between" id="ledger-table-header">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Mostrando {filteredTransactions.length} de {transactions.length} transacciones
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center" id="empty-ledger-alert">
            <span className="text-gray-300 block mb-3 font-semibold text-lg">No se encontraron movimientos</span>
            <p className="text-gray-400 text-xs max-w-sm mx-auto mb-4">
              Ajusta los filtros o busca otra palabra clave para localizar registros en el historial.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setCategoryFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="ledger-table">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/30">
                  <th className="py-3 px-5">Fecha</th>
                  <th className="py-3 px-5">Flujo</th>
                  <th className="py-3 px-5">Categoría</th>
                  <th className="py-3 px-5">Descripción / Concepto</th>
                  <th className="py-3 px-5">Registrado Por</th>
                  <th className="py-3 px-5">Estado</th>
                  <th className="py-3 px-5 text-right">Monto</th>
                  <th className="py-3 px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredTransactions.map((t) => {
                  const isPayment = t.category === 'Pago a Equipo' || !!t.targetMemberId;
                  const hasAccess = currentMember.role === 'admin' || t.targetMemberId === currentMember.id;
                  const displayDesc = isPayment && !hasAccess ? 'Pago realizado a un contribuyente' : t.description;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/40 transition">
                      <td className="py-3.5 px-5 text-gray-500 font-mono whitespace-nowrap">
                        {t.date}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getTypeBadgeStyles(t.type)}`}>
                          {t.type === 'income' ? (
                            <>
                              <TrendingUp className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>Entrada</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                              <span>Salida</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-gray-800 max-w-xs truncate" title={displayDesc}>
                        {displayDesc}
                      </td>
                      <td className="py-3.5 px-5 text-gray-500">
                        {t.loggedBy}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          t.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                            : 'bg-amber-50 text-amber-700 border border-amber-150'
                        }`}>
                          {t.status === 'completed' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Completado</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Pendiente</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className={`py-3.5 px-5 text-right font-black text-sm whitespace-nowrap ${
                        t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                      </td>
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        {currentMember.role === 'admin' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(t)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => confirmDialog('¿Estás seguro de que quieres hacer esto?', () => onDeleteTransaction(t.id))}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-medium italic select-none">
                            Administrado por MantaiWeb
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adding/Editing Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="transaction-form-modal">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">
                  {editingId ? 'Editar Movimiento' : 'Registrar Nuevo Movimiento'}
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">Completa los campos para actualizar la contabilidad.</p>
              </div>
              <button
                onClick={closeFormModal}
                className="p-1.5 hover:bg-blue-700 text-blue-100 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type Switcher (Income / Expense) */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setFormType('expense');
                    setFormCategory(DEFAULT_CATEGORIES[0]);
                  }}
                  className={`py-2 text-center text-xs font-bold rounded-lg transition ${
                    formType === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 inline mr-1.5" />
                  Gasto / Egreso (-)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormType('income');
                    setFormCategory(DEFAULT_CATEGORIES[0]);
                  }}
                  className={`py-2 text-center text-xs font-bold rounded-lg transition ${
                    formType === 'income'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
                  Ingreso (+)
                </button>
              </div>

              {/* Amount field */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Monto de la Transacción (CRC)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-bold text-sm">
                    ₡
                  </span>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full pl-7 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Category Field */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Categoría
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {/* Select based on Type to suggest better options */}
                  {formType === 'income' ? (
                    <>
                      <option value="Ventas de Proyectos">Ventas de Proyectos</option>
                      <option value="Suscripciones Recurrentes">Suscripciones Recurrentes</option>
                      <option value="Consultorías">Consultorías</option>
                    </>
                  ) : (
                    <>
                      <option value="Sueldos y Honorarios">Sueldos y Honorarios</option>
                      <option value="Infraestructura Cloud">Infraestructura Cloud</option>
                      <option value="Marketing Digital">Marketing Digital</option>
                      <option value="Soporte y Licencias">Soporte y Licencias</option>
                      <option value="Servicios de Oficina">Servicios de Oficina</option>
                      <option value="Impuestos y Tasas">Impuestos y Tasas</option>
                    </>
                  )}
                  <option value="OTRA">Otra categoría (Escribir personalizada)...</option>
                </select>
              </div>

              {/* Custom Category Input if "OTRA" selected */}
              {formCategory === 'OTRA' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Nombre de Categoría Personalizada
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Escribir nombre de categoría..."
                    required
                    className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              )}

              {/* Concept/Description */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Concepto / Descripción detallada
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="ej. Cobro hito inicial plataforma..."
                  required
                  className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Grid Date & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Fecha de Operación
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Estado Actual
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="completed">Completado</option>
                    <option value="pending">Pendiente</option>
                  </select>
                </div>
              </div>

              {/* Member Assignment */}
              {members.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Asignar Responsable / Destinatario del Equipo
                  </label>
                  <select
                    value={formTargetMemberId}
                    onChange={(e) => setFormTargetMemberId(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-bold text-gray-700"
                  >
                    <option value="">Gasto / Ingreso General (Sin Asignar)</option>
                    <option value="ALL">🌐 TODOS (Todo el equipo)</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
