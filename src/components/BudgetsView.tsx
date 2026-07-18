import React, { useState, useMemo } from 'react';
import { Scale, Edit, Plus, Trash2, ShieldAlert, CheckCircle2, Info } from 'lucide-react';
import { CategoryBudget, Transaction, Member } from '../types';
import { useConfirm } from './ConfirmProvider';

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  transactions: Transaction[];
  currentMember: Member;
  onAddBudget: (b: CategoryBudget) => void;
  onUpdateBudget: (category: string, newLimit: number) => void;
  onDeleteBudget: (category: string) => void;
}

export default function BudgetsView({
  budgets,
  transactions,
  currentMember,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
}: BudgetsViewProps) {
  const confirmDialog = useConfirm();
  const [isAddMode, setIsAddMode] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editLimitVal, setEditLimitVal] = useState('');

  // Pre-calculated stats for budgets
  const calculatedBudgets = useMemo(() => {
    return budgets.map((b) => {
      // Find spent amount in completed transactions of type expense
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.category === b.category && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;

      return {
        ...b,
        spent,
        pct,
        remaining: b.limit - spent,
      };
    });
  }, [budgets, transactions]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategory.trim()) {
      alert('Escriba un nombre de categoría válido.');
      return;
    }
    const limitNum = parseFloat(newLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      alert('Ingrese un límite numérico válido mayor a cero.');
      return;
    }

    if (budgets.some((b) => b.category.toLowerCase() === newCategory.trim().toLowerCase())) {
      alert('Ya existe un presupuesto asignado para esta categoría.');
      return;
    }

    onAddBudget({
      category: newCategory.trim(),
      limit: limitNum,
    });

    setNewCategory('');
    setNewLimit('');
    setIsAddMode(false);
  };

  const startEditing = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setEditLimitVal(currentLimit.toString());
  };

  const handleUpdate = (category: string) => {
    const limitNum = parseFloat(editLimitVal);
    if (isNaN(limitNum) || limitNum <= 0) {
      alert('Ingrese un límite válido mayor a cero.');
      return;
    }

    onUpdateBudget(category, limitNum);
    setEditingCategory(null);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-rose-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const getCardBg = (pct: number) => {
    if (pct >= 100) return 'border-rose-100 bg-rose-50/20';
    if (pct >= 80) return 'border-amber-100 bg-amber-50/10';
    return 'border-gray-100 bg-white';
  };

  return (
    <div className="space-y-6" id="budgets-view-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="budgets-header">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Presupuestos de Egresos</h2>
          <p className="text-sm text-gray-500">Establece techos de gasto mensuales y audita desviaciones de capital.</p>
        </div>
        {!isAddMode && (
          <button
            onClick={() => setIsAddMode(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition duration-150 shrink-0 self-start sm:self-auto cursor-pointer"
            id="add-budget-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Asignar Límite</span>
          </button>
        )}
      </div>

      {/* Module Purpose Info Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold block mb-0.5">¿Para qué sirve este módulo?</strong>
          <p className="text-blue-800/80 leading-relaxed">
            El módulo de <strong>Presupuestos de Egresos</strong> te permite fijar un límite máximo de gasto mensual en colones costarricenses (₡) para categorías específicas de la empresa (como publicidad, hosting, viáticos, etc.). El sistema calcula de forma dinámica cuánto se ha gastado de ese límite a partir del historial de transacciones, emitiendo alertas visuales preventivas en amarillo o rojo para evitar que se incurra en sobrecostos indeseados.
          </p>
        </div>
      </div>

      {/* Add Budget Form Card */}
      {isAddMode && (
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-md animate-fade-in" id="add-budget-form-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-800">Definir Nuevo Límite Presupuestario</h3>
            <button
              onClick={() => setIsAddMode(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
            >
              Cancelar
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre de Categoría</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="ej. Marketing Digital, Eventos, Licencias"
                required
                className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Límite Mensual Máximo (CRC)</label>
              <input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="ej. 3000"
                required
                className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition"
              >
                Crear Presupuesto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budgets Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="budgets-grid">
        {calculatedBudgets.map((b) => {
          const isOverLimit = b.pct >= 100;
          const isAtRisk = b.pct >= 80 && b.pct < 100;
          const isEditing = editingCategory === b.category;

          return (
            <div
              key={b.category}
              className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition duration-200 ${getCardBg(
                b.pct
              )}`}
              id={`budget-card-${b.category.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between mb-3.5">
                  <div className="max-w-[70%]">
                    <h3 className="font-bold text-gray-900 text-sm tracking-tight truncate" title={b.category}>
                      {b.category}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Mensual</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isOverLimit && (
                      <span className="p-1 bg-rose-100 text-rose-600 rounded-lg" title="Excedido">
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                    )}
                    {isAtRisk && (
                      <span className="p-1 bg-amber-100 text-amber-600 rounded-lg" title="Cerca del límite">
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                    )}
                    {!isOverLimit && !isAtRisk && (
                      <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg" title="Correcto">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Numbers and edits */}
                {isEditing ? (
                  <div className="mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-150 space-y-2">
                    <label className="block text-[9px] font-bold text-gray-500 uppercase">Ajustar Límite (CRC)</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={editLimitVal}
                        onChange={(e) => setEditLimitVal(e.target.value)}
                        className="w-full p-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdate(b.category)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 block uppercase">Consumido</span>
                      <span className="text-base font-extrabold text-gray-800">{formatMoney(b.spent)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-gray-400 block uppercase">Límite</span>
                      <span className="text-base font-extrabold text-gray-800">{formatMoney(b.limit)}</span>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(b.pct)}`}
                      style={{ width: `${Math.min(b.pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-gray-400">Progreso de Gasto</span>
                    <span className="font-mono font-bold text-gray-600">{b.pct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Status footer / Card Actions */}
              <div className="pt-4 border-t border-gray-50/50 mt-4 flex items-center justify-between text-[11px]">
                <span className={`font-semibold ${b.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {b.remaining >= 0
                    ? `Disp: +${formatMoney(b.remaining)}`
                    : `Exceso: -${formatMoney(Math.abs(b.remaining))}`}
                </span>

                {currentMember.role === 'admin' && (
                  <div className="flex items-center gap-1 shrink-0">
                    {!isEditing && (
                      <button
                        onClick={() => startEditing(b.category, b.limit)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Editar límite"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        confirmDialog('¿Estás seguro de que quieres hacer esto?', () => {
                          onDeleteBudget(b.category);
                        });
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Eliminar límite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {calculatedBudgets.length === 0 && (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-gray-300 block mb-2 font-bold text-lg">No hay techos de gasto establecidos</span>
            <p className="text-gray-400 text-xs max-w-sm mx-auto mb-4">
              Definir presupuestos te permite controlar el consumo de capital de manera proactiva por áreas de operación.
            </p>
            <button
              onClick={() => setIsAddMode(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow"
            >
              Establecer Primer Presupuesto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
