import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ArrowRight, 
  AlertCircle,
  TrendingUp,
  Scale,
  Receipt
} from 'lucide-react';
import { Member, Transaction, CategoryBudget, Invoice } from '../types';

interface AIAssistantViewProps {
  currentMember: Member;
  transactions: Transaction[];
  budgets: CategoryBudget[];
  invoices: Invoice[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIAssistantView({
  currentMember,
  transactions,
  budgets,
  invoices
}: AIAssistantViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `¡Hola, **${currentMember.name}**! Soy tu Asistente de Inteligencia Financiera para **Mantai Agencia Digital**. 

Puedo ayudarte a analizar las finanzas de la agencia, proponer optimizaciones de presupuesto, calcular ingresos estimados según facturas, y responder cualquier duda que tengas sobre los registros actuales.

¿En qué puedo asistirte hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to compile current financial metrics as context for Gemini
  const getFinancialContext = () => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const budgetStatus = budgets.map(b => {
      const spent = transactions
        .filter(t => t.category === b.category && t.type === 'expense' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        categoria: b.category,
        limite: b.limit,
        gastado: spent,
        disponible: b.limit - spent
      };
    });

    const pendingInvoicesTotal = invoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const paidInvoicesTotal = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Provide simplified high-level records (limit length to prevent context explosion)
    const recentTxSummary = transactions.slice(0, 10).map(t => ({
      fecha: t.date,
      tipo: t.type === 'income' ? 'Ingreso' : 'Egreso',
      categoria: t.category,
      monto: t.amount,
      descripcion: t.description,
      estado: t.status === 'completed' ? 'Completado' : 'Pendiente'
    }));

    return {
      usuario: {
        nombre: currentMember.name,
        rol: currentMember.role
      },
      resumen_general: {
        total_ingresos: totalIncome,
        total_egresos: totalExpense,
        saldo_actual: balance,
        facturas_pendientes_monto: pendingInvoicesTotal,
        facturas_cobradas_monto: paidInvoicesTotal
      },
      presupuestos: budgetStatus,
      ultimas_transacciones: recentTxSummary
    };
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    setInput('');
    setIsLoading(true);

    const userMsg: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: textToSend,
          context: getFinancialContext()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al comunicarse con el servidor de IA.');
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'No se pudo obtener una respuesta de la Inteligencia Artificial.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    {
      title: 'Diagnóstico Financiero',
      prompt: 'Haz un diagnóstico rápido de las finanzas de la agencia basándote en los ingresos completados, egresos y el saldo actual.',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100/50'
    },
    {
      title: 'Análisis de Presupuestos',
      prompt: 'Revisa los presupuestos configurados y dime cuáles categorías están cerca del límite de gasto o necesitan atención.',
      icon: Scale,
      color: 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100/50'
    },
    {
      title: 'Proyección de Facturación',
      prompt: 'Analiza el estado de las facturas de clientes. ¿Cuánto dinero tenemos pendiente por cobrar y cuál es la proyección?',
      icon: Receipt,
      color: 'text-purple-600 bg-purple-50 border-purple-100 hover:bg-purple-100/50'
    }
  ];

  // Manual simple markdown renderer for bold text, bullet points and linebreaks to keep it safe and dependency-free
  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, idx) => {
      // Bold rendering **text**
      let renderedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-gray-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const displayContent = parts.length > 0 ? parts : renderedLine;

      // Handle bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc my-1 text-gray-700">
            {line.trim().substring(2)}
          </li>
        );
      }

      return (
        <p key={idx} className="my-1.5 text-gray-700 leading-relaxed">
          {displayContent}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col" id="ai-assistant-container">
      {/* Top Header Card */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 sm:p-6 shadow-sm mb-4 flex items-center justify-between" id="ai-assistant-header">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-black text-lg text-gray-900 leading-none">Consultor Financiero IA</h2>
            <span className="text-xs text-gray-400 font-medium mt-1 block">Impulsado por Gemini 3.5 Flash en tiempo real</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100 text-xs font-bold">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Sincronizado con tus datos</span>
        </div>
      </div>

      {/* Messages Scroll Panel */}
      <div className="flex-1 bg-white border border-gray-150 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-inner mb-4 min-h-[200px]" id="ai-messages-panel">
        {messages.map((msg, idx) => {
          const isAI = msg.role === 'assistant';
          return (
            <div 
              key={idx} 
              className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar Icon */}
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white ${
                isAI ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Balloon box */}
              <div className={`p-4 rounded-2xl border text-sm ${
                isAI 
                  ? 'bg-gray-50/50 border-gray-100 rounded-tl-none text-gray-800' 
                  : 'bg-blue-600 border-blue-600 text-white rounded-tr-none'
              }`}>
                {isAI ? (
                  <div className="space-y-1">{renderMessageContent(msg.content)}</div>
                ) : (
                  <p className="leading-relaxed font-semibold">{msg.content}</p>
                )}
                <span className={`text-[9px] mt-1.5 block text-right ${isAI ? 'text-gray-400' : 'text-blue-200'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%] mr-auto">
            <div className="w-8 h-8 rounded-lg shrink-0 bg-blue-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 rounded-tl-none flex items-center gap-2 text-xs font-semibold text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Pensando y analizando datos...</span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-150 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="font-bold">Error de consulta</p>
              <p className="text-red-600/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length === 1 && !isLoading && (
        <div className="mb-4" id="ai-quick-prompts-container">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
            Análisis Recomendados
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickPrompts.map((qp, idx) => {
              const Icon = qp.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(qp.prompt)}
                  className={`p-3.5 rounded-xl border text-left transition text-xs flex flex-col gap-2 group cursor-pointer ${qp.color}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className="w-4.5 h-4.5" />
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition translate-x-[-4px] group-hover:translate-x-0" />
                  </div>
                  <div>
                    <span className="font-extrabold block text-gray-900 mb-0.5">{qp.title}</span>
                    <span className="text-gray-500 font-medium leading-relaxed block line-clamp-2">
                      {qp.prompt}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Form Bar */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2.5 items-center bg-white border border-gray-150 p-2.5 rounded-2xl shadow-sm"
        id="ai-input-form"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregúntame algo sobre las finanzas de la agencia..."
          disabled={isLoading}
          className="flex-1 py-2 px-3 text-sm bg-gray-50 border border-gray-150 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:bg-white disabled:opacity-50 text-gray-800"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition shrink-0 disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-sm shadow-blue-500/20"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>
    </div>
  );
}
