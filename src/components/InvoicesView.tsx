import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  PlusCircle,
  Trash2,
  Printer,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';
import { Invoice, Member } from '../types';
import { useConfirm } from './ConfirmProvider';

interface InvoicesViewProps {
  invoices: Invoice[];
  currentMember: Member;
  onAddInvoice: (inv: Invoice) => void;
  onUpdateInvoiceStatus: (id: string, status: 'paid' | 'pending' | 'overdue', logToLedger?: boolean) => void;
  onDeleteInvoice: (id: string) => void;
}

export default function InvoicesView({
  invoices,
  currentMember,
  onAddInvoice,
  onUpdateInvoiceStatus,
  onDeleteInvoice,
}: InvoicesViewProps) {
  const confirmDialog = useConfirm();
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Invoice Form State
  const [clientName, setClientName] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().substring(0, 10);
  });
  const [items, setItems] = useState<Array<{ description: string; quantity: number; price: number }>>([
    { description: '', quantity: 1, price: 0 },
  ]);

  // Calculations for list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch = inv.client.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' ? true : inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  // Form handlers
  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  const calculateFormTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      alert('Por favor ingrese el nombre del cliente.');
      return;
    }

    const invalidItem = items.some((item) => !item.description.trim() || item.price <= 0 || item.quantity <= 0);
    if (invalidItem) {
      alert('Por favor complete todos los detalles de los ítems con valores válidos.');
      return;
    }

    // Generate consecutive ID
    const nextNum = invoices.length + 1;
    const invoiceId = `FAC-${nextNum.toString().padStart(3, '0')}`;

    const newInvoice: Invoice = {
      id: invoiceId,
      client: clientName.trim(),
      issueDate,
      dueDate,
      amount: calculateFormTotal(),
      status: 'pending',
      items,
      loggedBy: currentMember.name,
    };

    onAddInvoice(newInvoice);
    setIsCreateOpen(false);

    // Reset Form
    setClientName('');
    setItems([{ description: '', quantity: 1, price: 0 }]);
  };

  // Status Change trigger
  const handleMarkAsPaid = (inv: Invoice) => {
    confirmDialog(
      `¿Deseas marcar la factura ${inv.id} como PAGADA? Al hacerlo, se registrará un ingreso automático en tu registro de finanzas por un monto de ${formatMoney(inv.amount)}.`,
      () => {
        onUpdateInvoiceStatus(inv.id, 'paid', true);
        // If we are viewing it in details, update view
        if (viewingInvoice?.id === inv.id) {
          setViewingInvoice({ ...viewingInvoice, status: 'paid' });
        }
      }
    );
  };

  const handleMarkAsOverdue = (inv: Invoice) => {
    onUpdateInvoiceStatus(inv.id, 'overdue', false);
    if (viewingInvoice?.id === inv.id) {
      setViewingInvoice({ ...viewingInvoice, status: 'overdue' });
    }
  };

  // Formatter
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6" id="invoices-view-container">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="billing-header">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Facturación a Clientes</h2>
          <p className="text-sm text-gray-500">Emite recibos de cobro, gestiona plazos y monitorea flujos por liquidar.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition duration-150 shrink-0 self-start sm:self-auto cursor-pointer"
          id="issue-invoice-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Factura</span>
        </button>
      </div>

      {/* Module Purpose Info Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold block mb-0.5">¿Para qué sirve este módulo?</strong>
          <p className="text-blue-800/80 leading-relaxed">
            El módulo de <strong>Facturación a Clientes</strong> te ayuda a generar y administrar recibos o cobros formales emitidos a los clientes en colones costarricenses (₡). Puedes desglosar los conceptos cobrados, imprimir la factura corporativa formal directamente (con formato listo para imprimir), marcar la factura como pagada (lo cual registra de manera automática el ingreso correspondiente en el libro diario de finanzas) y realizar un seguimiento ágil de las cuentas por cobrar pendientes o vencidas.
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 justify-between" id="billing-filters">
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente o folio..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Filtrar Estado:</span>
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
            {(['all', 'paid', 'pending', 'overdue'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition cursor-pointer ${
                  statusFilter === status
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {status === 'all'
                  ? 'Todas'
                  : status === 'paid'
                  ? 'Pagadas'
                  : status === 'pending'
                  ? 'Pendientes'
                  : 'Vencidas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice List Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" id="billing-table-panel">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
              <th className="py-3 px-5">Folio / ID</th>
              <th className="py-3 px-5">Cliente</th>
              <th className="py-3 px-5">Fecha Emisión</th>
              <th className="py-3 px-5">Vencimiento</th>
              <th className="py-3 px-5">Estado</th>
              <th className="py-3 px-5 text-right">Monto Total</th>
              <th className="py-3 px-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs">
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50/30 transition">
                <td className="py-3.5 px-5 font-mono font-bold text-gray-900">
                  {inv.id}
                </td>
                <td className="py-3.5 px-5 font-semibold text-gray-800">
                  {inv.client}
                </td>
                <td className="py-3.5 px-5 text-gray-500 font-mono">
                  {inv.issueDate}
                </td>
                <td className="py-3.5 px-5 text-gray-500 font-mono">
                  {inv.dueDate}
                </td>
                <td className="py-3.5 px-5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    inv.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                      : inv.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border border-amber-150'
                      : 'bg-rose-50 text-rose-700 border border-rose-150'
                  }`}>
                    {inv.status === 'paid' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Liquidada</span>
                      </>
                    ) : inv.status === 'pending' ? (
                      <>
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Pendiente</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Vencida</span>
                      </>
                    )}
                  </span>
                </td>
                <td className="py-3.5 px-5 text-right font-black text-gray-900 text-sm">
                  {formatMoney(inv.amount)}
                </td>
                <td className="py-3.5 px-5 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => setViewingInvoice(inv)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-0.5"
                      title="Ver Detalles"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-[10px] hidden sm:inline">Ver PDF</span>
                    </button>
                    {(currentMember.role === 'admin' || inv.loggedBy === currentMember.name) ? (
                      <>
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(inv)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            title="Marcar como cobrada"
                          >
                            Cobrar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            confirmDialog('¿Estás seguro de que quieres hacer esto?', () => {
                              onDeleteInvoice(inv.id);
                            });
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium italic select-none ml-2">
                        Administrado por MantaiWeb
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                  No se encontraron facturas bajo estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ISSUE INVOICE MODAL FORM */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="issue-invoice-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-blue-600 text-white p-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-lg">Nueva Factura de Cliente</h3>
                <p className="text-xs text-blue-100 mt-0.5">Completa el folio de servicios prestados para cobro.</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-blue-100 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Client Info */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Nombre del Cliente / Empresa
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="ej. Delta Corporation Inc."
                  required
                  className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Fecha Emisión
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                    className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Plazo Vencimiento
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full py-2 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Conceptos / Detalle</span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> Agregar Ítem
                  </button>
                </div>

                {/* Explicit column labels */}
                <div className="flex gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2">
                  <div className="flex-1">Descripción del Concepto / Servicio</div>
                  <div className="w-14 text-center">Cant.</div>
                  <div className="w-24">Precio Unit. (₡)</div>
                  {items.length > 1 && <div className="w-6"></div>}
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-150">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Ej. Diseño web, consultoría, etc."
                          required
                          className="w-full py-1.5 px-2.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                        />
                      </div>
                      <div className="w-14">
                        <input
                          type="number"
                          value={item.quantity || ''}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="1"
                          min={1}
                          required
                          className="w-full py-1.5 px-1.5 text-xs bg-white border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                        />
                      </div>
                      <div className="w-24 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">₡</span>
                        <input
                          type="number"
                          value={item.price || ''}
                          onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="Monto"
                          min={0}
                          required
                          className="w-full py-1.5 pl-6 pr-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/30 font-semibold"
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-gray-400 hover:text-red-500 p-1 shrink-0 w-6 flex justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary and actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">Total a Facturar</span>
                  <span className="text-xl font-black text-gray-900">{formatMoney(calculateFormTotal())}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 border border-gray-200 bg-white rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                  >
                    Guardar y Emitir
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW VISUAL INVOICE / PDF DETAIL MODAL */}
      {viewingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="view-invoice-pdf-modal">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header / Controls */}
            <div className="bg-gray-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm">Vista Corporativa de Factura - {viewingInvoice.id}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
                <button onClick={() => setViewingInvoice(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Area / Invoice Sheet */}
            <div className="p-8 overflow-y-auto flex-1 bg-gray-50/20" id="printable-invoice-sheet">
              <div className="bg-white p-8 border border-gray-200 rounded-2xl shadow-xs max-w-xl mx-auto space-y-8 font-sans text-gray-800">
                {/* Header Letterhead */}
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-black text-blue-600 tracking-tight leading-none">Mantai</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Agencia Digital & Desarrollo S.A.</p>
                    <p className="text-xs text-gray-500 mt-2">
                      RUT: 76.543.210-K<br />
                      Avenida Apoquindo 4500, Of. 901<br />
                      Las Condes, Santiago, Chile
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-extrabold text-gray-900">FACTURA</h2>
                    <span className="text-sm font-mono font-bold text-blue-600">{viewingInvoice.id}</span>
                    <p className="text-xs text-gray-500 mt-2">
                      <strong>Fecha:</strong> {viewingInvoice.issueDate}<br />
                      <strong>Vence:</strong> {viewingInvoice.dueDate}
                    </p>
                  </div>
                </div>

                {/* Bill To Info */}
                <div className="border-t border-b border-gray-100 py-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Facturado a</span>
                    <strong className="text-sm text-gray-900 block mt-1">{viewingInvoice.client}</strong>
                    <span className="text-xs text-gray-500">Cliente Corporativo Activo</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Estado de Pago</span>
                    <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full uppercase ${
                      viewingInvoice.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : viewingInvoice.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {viewingInvoice.status === 'paid' ? 'Pagada / Conciliada' : viewingInvoice.status === 'pending' ? 'Pendiente' : 'Vencida / Reclamada'}
                    </span>
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div className="space-y-3">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                        <th className="py-2">Descripción del concepto</th>
                        <th className="py-2 text-center w-16">Cant</th>
                        <th className="py-2 text-right w-24">Precio Unit</th>
                        <th className="py-2 text-right w-28">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewingInvoice.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-3 font-semibold text-gray-800">{item.description}</td>
                          <td className="py-3 text-center text-gray-500 font-mono">{item.quantity}</td>
                          <td className="py-3 text-right text-gray-500 font-mono">{formatMoney(item.price)}</td>
                          <td className="py-3 text-right font-bold text-gray-900 font-mono">
                            {formatMoney(item.quantity * item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total and Bank payment instructions */}
                <div className="border-t border-gray-100 pt-5 flex justify-between items-start">
                  <div className="max-w-[50%]">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Instrucciones de Transferencia</p>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                      Banco BICE - Cuenta Corriente<br />
                      N° Cuenta: 12-34567-8<br />
                      Destinatario: Mantai S.A.<br />
                      Correo: cobranza@mantai.com
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex justify-end gap-6 text-xs font-semibold text-gray-500">
                      <span>Subtotal Neto:</span>
                      <span className="font-mono">{formatMoney(viewingInvoice.amount)}</span>
                    </div>
                    <div className="flex justify-end gap-6 text-xs font-semibold text-gray-500">
                      <span>Impuestos (0% Exento):</span>
                      <span className="font-mono">₡0</span>
                    </div>
                    <div className="flex justify-end gap-6 text-lg font-black text-gray-900 pt-1">
                      <span>Total General:</span>
                      <span className="text-blue-600 font-mono">{formatMoney(viewingInvoice.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer inside modal */}
            {viewingInvoice.status !== 'paid' && (
              <div className="bg-gray-100 p-4 border-t border-gray-200 flex items-center justify-between shrink-0">
                <p className="text-xs text-gray-500 font-medium">Esta factura está por cobrar.</p>
                <button
                  onClick={() => handleMarkAsPaid(viewingInvoice)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Registrar Cobro Realizado
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
