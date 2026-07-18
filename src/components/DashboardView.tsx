import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  AlertTriangle,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Info,
  Sparkles
} from 'lucide-react';
import { Transaction, CategoryBudget, Invoice, Member } from '../types';

interface DashboardViewProps {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  budgets: CategoryBudget[];
  invoices: Invoice[];
  onNavigateToTab: (tab: any) => void;
  onQuickAddTransaction: () => void;
  currentMember: Member;
}

export default function DashboardView({
  transactions,
  allTransactions,
  budgets,
  invoices,
  onNavigateToTab,
  onQuickAddTransaction,
  currentMember,
}: DashboardViewProps) {
  // Use the unfiltered list for global/company metrics if provided
  const companyTxs = allTransactions || transactions;

  // 1. Calculations
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    companyTxs.forEach((t) => {
      if (t.status === 'completed') {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else {
          totalExpense += t.amount;
        }

        // Monthly check
        const tDate = new Date(t.date);
        if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
          if (t.type === 'income') {
            monthlyIncome += t.amount;
          } else {
            monthlyExpense += t.amount;
          }
        }
      }
    });

    const pendingInvoicesAmount = invoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return {
      totalBalance: totalIncome - totalExpense,
      monthlyIncome,
      monthlyExpense,
      pendingInvoicesAmount,
    };
  }, [companyTxs, invoices]);

  // 2. Budget limits checking
  const budgetAlerts = useMemo(() => {
    const alerts: Array<{ category: string; spent: number; limit: number; pct: number }> = [];

    budgets.forEach((b) => {
      // calculate spent on this category
      const spent = companyTxs
        .filter((t) => t.type === 'expense' && t.category === b.category && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      if (pct >= 80) {
        alerts.push({
          category: b.category,
          spent,
          limit: b.limit,
          pct: Math.min(pct, 100),
        });
      }
    });

    return alerts.sort((a, b) => b.pct - a.pct);
  }, [companyTxs, budgets]);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentMonthName = monthNames[new Date().getMonth()];

  const pendingAmount = useMemo(() => {
    const paymentsReceived = companyTxs
      .filter((t) => t.targetMemberId === currentMember.id && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return paymentsReceived;
  }, [companyTxs, currentMember]);

  // 4. Format money helper
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6" id="dashboard-view">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-lg border border-blue-900/10 space-y-4" id="dashboard-welcome-banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200 bg-blue-950/40 px-3 py-1 rounded-full border border-blue-100/10 inline-block mb-1">
              {currentMember.role === 'admin' ? 'Cuenta Principal / Financiador' : 'Colaborador / Empleado de la Empresa'}
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight" id="dashboard-welcome-heading">
              BIENVENIDO, {currentMember.name.toUpperCase()}
            </h1>
            <p className="text-xs md:text-sm text-blue-100/90 max-w-2xl font-medium">
              {currentMember.role === 'admin'
                ? 'Administración completa de flujos, clientes, ventas, egresos y control presupuestario de la empresa.'
                : 'Ingresa tus clientes, ventas, gastos y revisa la plata ganada registrada en tus operaciones.'}
            </p>
          </div>
          <button
            onClick={onQuickAddTransaction}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-blue-50 text-blue-800 text-xs font-extrabold rounded-2xl shadow-md transition duration-150 shrink-0 self-start md:self-auto cursor-pointer"
            id="quick-add-transaction-btn"
          >
            <Plus className="w-4 h-4 text-blue-700" />
            <span>Registrar Transacción</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2" id="dashboard-header">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Panel General</h2>
          <p className="text-xs text-gray-400">Resumen y estado de las finanzas corporativas en tiempo real.</p>
        </div>
      </div>

      {/* Module Purpose Info Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold block mb-0.5">¿Para qué sirve este módulo?</strong>
          <p className="text-blue-800/80 leading-relaxed">
            {currentMember.role === 'admin'
              ? 'El Panel General te da un resumen ejecutivo de la salud financiera de tu empresa en colones costarricenses (₡). Te permite visualizar el flujo de caja global, las transacciones recientes, la distribución de gastos y el estado de los presupuestos y facturas por cobrar.'
              : 'El Panel General te muestra un resumen de tu actividad financiera personal y el estado de tus transacciones registradas, facilitando el control de tus ingresos generados de manera visual y en colones costarricenses (₡).'}
          </p>
        </div>
      </div>

      {/* AI Assistant Promo Banner */}
      <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200/60 rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs" id="dashboard-ai-promo">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/15">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-gray-950 flex items-center gap-1.5 leading-none">
              <span>Asistente Financiero con Inteligencia Artificial</span>
              <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Nuevo</span>
            </h4>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Obtén diagnósticos instantáneos de presupuestos, proyecciones de facturación y consejos financieros automáticos basados en tus datos reales.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab('ai-assistant')}
          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-200/50 px-3.5 py-2 rounded-xl shadow-xs transition duration-150 cursor-pointer shrink-0"
        >
          <span>Consultar IA</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Pending Balance Banner */}
      {currentMember.role !== 'admin' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between shadow-sm mb-4">
          <div className="space-y-1 text-center w-full">
            <span className="text-sm font-bold text-amber-800 uppercase tracking-wider block">
              Este mes has ganado {formatMoney(pendingAmount)}
            </span>
          </div>
        </div>
      )}

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-grid">
        {/* Balance Total */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Balance de Empresa Total</span>
            <span className={`text-2xl font-black block tracking-tight ${metrics.totalBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {formatMoney(metrics.totalBalance)}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
              Suma de ingresos y egresos vigentes
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl" id="metric-balance-icon">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Ingresos del Mes */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Ingresos de {currentMonthName} de empresa</span>
            <span className="text-2xl font-black text-emerald-600 block tracking-tight">
              {formatMoney(metrics.monthlyIncome)}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Cobrados este mes
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl" id="metric-income-icon">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Egresos del Mes */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Gastos de {currentMonthName} de empresa</span>
            <span className="text-2xl font-black text-rose-600 block tracking-tight">
              {formatMoney(metrics.monthlyExpense)}
            </span>
            <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Pagados este mes
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl" id="metric-expense-icon">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Por Cobrar (Facturas)</span>
            <span className="text-2xl font-black text-amber-600 block tracking-tight">
              {formatMoney(metrics.pendingInvoicesAmount)}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
              Facturas pendientes/vencidas
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl" id="metric-invoices-icon">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts & Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-section">
        {/* Budget Limit Progress / Alerts column */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between lg:col-span-3" id="budgets-warning-card">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-base text-gray-800 tracking-tight">Estado de Presupuestos</h3>
              <p className="text-xs text-gray-400">Control de gastos por categorías críticas.</p>
            </div>

            {budgetAlerts.length === 0 ? (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                  ¡Excelente! Todos los gastos operativos se encuentran holgadamente dentro del presupuesto establecido para este mes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="budget-progress-list">
                {budgetAlerts.slice(0, 4).map((alert, i) => (
                  <div key={i} className="space-y-1.5 p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-700 block truncate max-w-[150px]">{alert.category}</span>
                      <span className={`font-mono font-bold ${alert.pct >= 100 ? 'text-red-600' : 'text-amber-600'}`}>
                        {alert.pct.toFixed(0)}%
                      </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          alert.pct >= 100 ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${alert.pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                      <span>Gastado: {formatMoney(alert.spent)}</span>
                      <span>Límite: {formatMoney(alert.limit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-50 mt-4">
            <button
              onClick={() => onNavigateToTab('budgets')}
              className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200/60 text-gray-700 text-xs font-bold rounded-xl transition duration-150 text-center flex items-center justify-center gap-1"
              id="goto-budgets-btn"
            >
              Gestionar Límites Presupuestarios
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Ledger Transactions Table Widget */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm" id="recent-transactions-widget">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-base text-gray-800 tracking-tight">Actividad Financiera Reciente</h3>
            <p className="text-xs text-gray-400">Últimos movimientos bancarios y facturación registrados en el sistema.</p>
          </div>
          <button
            onClick={() => onNavigateToTab('transactions')}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            id="view-all-transactions-btn"
          >
            Ver Historial Completo <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto" id="recent-transactions-table-wrapper">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Descripción / Concepto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Registrado Por</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {recentTransactions.map((t) => {
                const isPayment = t.category === 'Pago a Equipo' || !!t.targetMemberId;
                const hasAccess = currentMember.role === 'admin' || t.targetMemberId === currentMember.id;
                const displayDesc = isPayment && !hasAccess ? 'Pago realizado a un contribuyente' : t.description;
                return (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 text-gray-500 font-mono whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800 max-w-xs truncate" title={displayDesc}>
                      {displayDesc}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {t.loggedBy}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                          : 'bg-amber-50 text-amber-700 border border-amber-150'
                      }`}>
                        {t.status === 'completed' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Cobrado/Pagado</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Pendiente</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right font-bold text-sm whitespace-nowrap ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
