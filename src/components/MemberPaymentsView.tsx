import React, { useState } from 'react';
import { ArrowLeft, Plus, Wallet, History, Send, Trash2, Info } from 'lucide-react';
import { Member, Transaction } from '../types';
import { useConfirm } from './ConfirmProvider';

interface MemberPaymentsViewProps {
  member: Member;
  transactions: Transaction[];
  currentMember: Member;
  onBack: () => void;
  onAddPayment: (amount: number, description: string) => void;
  onDeletePayment: (id: string) => void;
}

export default function MemberPaymentsView({
  member,
  transactions,
  currentMember,
  onBack,
  onAddPayment,
  onDeletePayment,
}: MemberPaymentsViewProps) {
  const confirmDialog = useConfirm();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState(`Pago a ${member.name}`);

  // Calculate totals
  const generatedIncome = transactions
    .filter((t) => t.loggedBy === member.name && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const paymentsReceived = transactions
    .filter((t) => t.targetMemberId === member.id && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingBalance = paymentsReceived;
  // Payments History (only expenses targeted to this member)
  const paymentHistory = transactions
    .filter((t) => t.targetMemberId === member.id && t.type === 'expense')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor ingrese un monto válido.');
      return;
    }
    onAddPayment(parsedAmount, description.trim() || `Pago a ${member.name}`);
    setAmount('');
    setDescription(`Pago a ${member.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          title="Volver a Equipo"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Transacciones y Pagos: {member.name}
          </h2>
          <p className="text-sm text-gray-500 font-medium">Gestiona el balance y los pagos de este colaborador.</p>
        </div>
      </div>

      {/* Module Purpose Info Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold block mb-0.5">¿Para qué sirve este módulo?</strong>
          <p className="text-blue-800/80 leading-relaxed">
            La sección de <strong>Transacciones y Pagos Individuales</strong> se usa para llevar la conciliación financiera de cada colaborador. Muestra de forma automática la cantidad de <strong>Plata Generada</strong> en colones costarricenses (₡) por este miembro (calculada sumando las ventas o cobros a clientes registrados por él), los <strong>Pagos Recibidos</strong> registrados a su nombre, y el balance remanente o <strong>Balance Pendiente</strong> de pago. Esto permite a los administradores efectuar transferencias de liquidación con registros detallados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & New Payment Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance Widget */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              Resumen Financiero
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="text-sm text-gray-500 font-medium">Plata Generada</span>
                <span className="text-sm font-bold text-emerald-600">₡{generatedIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                <span className="text-sm text-gray-500 font-medium">Pagos Recibidos</span>
                <span className="text-sm font-bold text-gray-900">₡{paymentsReceived.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-base text-gray-900 font-extrabold">Balance Pendiente</span>
                <span className={`text-base font-black ${pendingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ₡{pendingBalance.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* New Payment Form */}
          {currentMember.role === 'admin' && (
            <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Send className="w-24 h-24" />
              </div>
              
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
                <Plus className="w-4 h-4 text-blue-600" />
                Registrar Nuevo Pago
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Monto a Pagar (₡)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Concepto / Descripción</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                    placeholder="Ej. Pago quincenal"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Por políticas de privacidad, solo el destinatario de este pago podrá ver la descripción exacta. Para otros usuarios aparecerá como "Pago realizado a un contribuyente".</p>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Transferir Fondos
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs h-full">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-gray-400" />
                Historial de Pagos
              </h3>
            </div>
            
            <div className="p-0">
              {paymentHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No se han registrado pagos aún.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {paymentHistory.map((tx) => (
                    <div key={tx.id} className="p-4 sm:px-6 hover:bg-gray-50 transition flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {(tx.category === 'Pago a Equipo' || !!tx.targetMemberId) && currentMember.role !== 'admin' && tx.targetMemberId !== currentMember.id ? 'Pago realizado a un contribuyente' : tx.description}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">{tx.date}</p>
                      </div>
                      <div className="text-right flex items-center gap-4 justify-end">
                        <div>
                          <span className="text-base font-extrabold text-gray-900">
                            ₡{tx.amount.toLocaleString()}
                          </span>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                            Completado
                          </p>
                        </div>
                        {currentMember.role === 'admin' && (
                          <button
                            onClick={() => {
                              confirmDialog('¿Estás seguro de que quieres hacer esto?', () => {
                                onDeletePayment(tx.id);
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Eliminar Pago"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
