import React, { useState } from 'react';
import { Database, Download, Upload, CheckCircle2, ShieldAlert, Copy, RefreshCw, Info } from 'lucide-react';
import { useConfirm } from './ConfirmProvider';

interface ExportImportViewProps {
  currentData: {
    transactions: any[];
    budgets: any[];
    invoices: any[];
    members: any[];
  };
  onImportData: (importedState: {
    transactions: any[];
    budgets: any[];
    invoices: any[];
    members: any[];
  }) => void;
  onResetToDefaults: () => void;
}

export default function ExportImportView({
  currentData,
  onImportData,
  onResetToDefaults,
}: ExportImportViewProps) {
  const confirmDialog = useConfirm();
  const [importJson, setImportJson] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getExportDataString = () => {
    return JSON.stringify(currentData, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getExportDataString());
    setSuccessMsg('¡Datos de respaldo copiados al portapapeles con éxito!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(getExportDataString());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "respaldo_finanzas_mantai.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessMsg('Archivo JSON de respaldo descargado con éxito.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!importJson.trim()) {
        setErrorMsg('Por favor pegue una cadena de texto JSON válida.');
        return;
      }

      const parsed = JSON.parse(importJson.trim());

      // Validate basic shape
      if (
        !parsed.transactions ||
        !parsed.budgets ||
        !parsed.invoices ||
        !parsed.members ||
        !Array.isArray(parsed.transactions) ||
        !Array.isArray(parsed.budgets) ||
        !Array.isArray(parsed.invoices) ||
        !Array.isArray(parsed.members)
      ) {
        setErrorMsg('El formato JSON ingresado no es válido. Debe contener arrays de transacciones, presupuestos, facturas y miembros.');
        return;
      }

      onImportData(parsed);
      setSuccessMsg('¡Se han restaurado e importado todos los datos financieros de la empresa!');
      setImportJson('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg('Error de sintaxis JSON. Verifique que la cadena pegada sea un JSON correcto.');
    }
  };

  return (
    <div className="space-y-6" id="export-import-view-container">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Canal de Datos y Respaldos</h2>
        <p className="text-sm text-gray-500">
          Realiza copias de seguridad de toda tu contabilidad en segundos o restaura archivos de auditorías previas.
        </p>
      </div>

      {/* Module Purpose Info Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold block mb-0.5">¿Para qué sirve este módulo?</strong>
          <p className="text-blue-800/80 leading-relaxed">
            El <strong>Canal de Datos y Respaldos</strong> es la salvaguarda de tu información contable. Sirve para exportar de manera inmediata un archivo de respaldo en formato estructurado (JSON) que contiene toda la base de datos local (incluyendo transacciones, presupuestos de gastos, facturas emitidas y registro de miembros del equipo). Del mismo modo, te permite pegar un respaldo guardado previamente para restaurar el estado exacto de tu negocio, o resetear la aplicación a los valores predeterminados de fábrica.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded flex items-start gap-2.5" id="backup-success-alert">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span className="text-xs text-emerald-800 font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded flex items-start gap-2.5" id="backup-error-alert">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <span className="text-xs text-rose-800 font-semibold">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="backup-grid">
        {/* Export Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between" id="backup-export-card">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
              <Download className="w-4.5 h-4.5 text-blue-600" />
              Respaldar Contabilidad (Exportar)
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Exporta de forma segura todos tus libros contables (Finanzas, presupuestos de categoría, estados de facturación a clientes y listado de accesos corporativos) en formato universal JSON.
            </p>
            <div className="bg-gray-50 border border-gray-150 p-3.5 rounded-xl text-center space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Registros Actuales Encontrados</span>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="font-extrabold text-gray-700 block">{currentData.transactions.length}</span>
                  <span className="text-[9px] text-gray-400">Finanzas</span>
                </div>
                <div>
                  <span className="font-extrabold text-gray-700 block">{currentData.invoices.length}</span>
                  <span className="text-[9px] text-gray-400">Facturas</span>
                </div>
                <div>
                  <span className="font-extrabold text-gray-700 block">{currentData.budgets.length}</span>
                  <span className="text-[9px] text-gray-400">Límites</span>
                </div>
                <div>
                  <span className="font-extrabold text-gray-700 block">{currentData.members.length}</span>
                  <span className="text-[9px] text-gray-400">Miembros</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50/60 mt-6 flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition"
            >
              <Copy className="w-4 h-4 text-gray-500" /> Copiar Código JSON
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow"
            >
              <Download className="w-4 h-4 text-blue-100" /> Descargar Archivo .json
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between" id="backup-import-card">
          <form onSubmit={handleImportSubmit} className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                <Upload className="w-4.5 h-4.5 text-blue-600" />
                Restaurar Libros (Importar)
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pega la cadena de texto de un respaldo previamente exportado para sobrescribir los estados de este terminal. ¡Cuidado! Esta acción reemplazará todos los datos en pantalla por el respaldo.
              </p>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='Pegue el código JSON aquí... ej: { "transactions": [], "budgets": [] ... }'
                className="w-full h-28 p-3 text-[10px] font-mono bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="pt-6 border-t border-gray-50/60 mt-6 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Upload className="w-4 h-4" /> Importar y Reemplazar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 mt-6" id="backup-danger-zone">
        <div className="space-y-0.5">
          <h4 className="font-bold text-sm text-rose-800 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> ¿Quieres restablecer toda la información?
          </h4>
          <p className="text-xs text-rose-700 leading-relaxed">
            Se eliminará todo el dinero y todas las transacciones de todos.
          </p>
        </div>
        <button
          onClick={() => {
            confirmDialog('¿Estás seguro de que quieres hacer esto? Todas las transacciones serán eliminadas', () => {
              onResetToDefaults();
              setSuccessMsg('Se ha restablecido la aplicación de manera segura a sus valores originales.');
              setTimeout(() => setSuccessMsg(''), 4000);
            });
          }}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition shrink-0"
        >
          Restablecer a valores iniciales
        </button>
      </div>
    </div>
  );
}
