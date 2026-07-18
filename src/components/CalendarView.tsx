import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Calendar as CalendarIcon, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BookOpen,
  X,
  Info
} from 'lucide-react';
import { Member, CalendarJob, AdminNote } from '../types';
import { useConfirm } from './ConfirmProvider';

interface CalendarViewProps {
  currentMember: Member;
  members: Member[];
  jobs: CalendarJob[];
  adminNotes: AdminNote[];
  onAddJob: (job: Omit<CalendarJob, 'id'>) => Promise<void>;
  onUpdateJob: (id: string, job: Partial<CalendarJob>) => Promise<void>;
  onDeleteJob: (id: string) => Promise<void>;
  onAddAdminNote: (note: Omit<AdminNote, 'id'>) => Promise<void>;
  onUpdateAdminNote: (id: string, note: Partial<AdminNote>) => Promise<void>;
  onDeleteAdminNote: (id: string) => Promise<void>;
}

export default function CalendarView({
  currentMember,
  members,
  jobs,
  adminNotes,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  onAddAdminNote,
  onUpdateAdminNote,
  onDeleteAdminNote,
}: CalendarViewProps) {
  const isAdmin = currentMember.role === 'admin';
  const confirmDialog = useConfirm();

  // Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>('month');

  // Modals state
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CalendarJob | null>(null);
  const [editingNote, setEditingNote] = useState<AdminNote | null>(null);
  
  // Selected day for quick job creation
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');

  // Form states - Job
  const [jobTitle, setJobTitle] = useState('');
  const [jobDate, setJobDate] = useState('');
  const [jobMemberId, setJobMemberId] = useState('');
  const [jobStatus, setJobStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [jobNotes, setJobNotes] = useState('');

  // Form states - Note (Admin only)
  const [noteContent, setNoteContent] = useState('');
  const [noteDate, setNoteDate] = useState('');
  const [noteTargetMemberId, setNoteTargetMemberId] = useState(members[0]?.id || '');

  // Helper date parsing
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month names
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // 1. Month View Calendar Helpers
  const monthGridDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const totalGridCells = 42; // 6 rows * 7 days
    const grid = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      grid.push({
        date: prevDate,
        isCurrentMonth: false,
        dateStr: formatDateLocal(prevDate),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const currDate = new Date(year, month, i);
      grid.push({
        date: currDate,
        isCurrentMonth: true,
        dateStr: formatDateLocal(currDate),
      });
    }

    // Next month padding
    const remainingCells = totalGridCells - grid.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextDate = new Date(year, month + 1, i);
      grid.push({
        date: nextDate,
        isCurrentMonth: false,
        dateStr: formatDateLocal(nextDate),
      });
    }

    return grid;
  }, [year, month]);

  // 2. Week View Helpers
  const weekDays = useMemo(() => {
    // Get starting day of current date's week (Sunday)
    const dayOfWeek = currentDate.getDay();
    const sunday = new Date(currentDate);
    sunday.setDate(currentDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push({
        date: day,
        dateStr: formatDateLocal(day),
      });
    }
    return days;
  }, [currentDate]);

  function formatDateLocal(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const handlePrev = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    }
  };

  const handleNext = () => {
    if (viewType === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Job form trigger
  const openNewJobModal = (dateStr?: string) => {
    setEditingJob(null);
    const initialDate = dateStr || formatDateLocal(new Date());
    setJobTitle('');
    setJobDate(initialDate);
    setJobMemberId(members[0]?.id || '');
    setJobStatus('pending');
    setJobNotes('');
    setIsJobModalOpen(true);
  };

  const openEditJobModal = (job: CalendarJob, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingJob(job);
    setJobTitle(job.title);
    setJobDate(job.date);
    setJobMemberId(job.memberId);
    setJobStatus(job.status || 'pending');
    setJobNotes(job.notes || '');
    setIsJobModalOpen(true);
  };

  // Admin note form trigger (only accessible by Admin)
  const openNewNoteModal = (dateStr?: string) => {
    if (!isAdmin) return;
    setEditingNote(null);
    const initialDate = dateStr || formatDateLocal(new Date());
    setNoteContent('');
    setNoteDate(initialDate);
    setNoteTargetMemberId(members[0]?.id || '');
    setIsNoteModalOpen(true);
  };

  const openEditNoteModal = (note: AdminNote, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingNote(note);
    setNoteContent(note.content);
    setNoteDate(note.date);
    setNoteTargetMemberId(note.targetMemberId || '');
    setIsNoteModalOpen(true);
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDate || !jobMemberId) return;

    const assignedMember = members.find(m => m.id === jobMemberId);
    const memberName = assignedMember ? assignedMember.name : 'Sin asignar';

    const jobData = {
      title: jobTitle,
      date: jobDate,
      memberId: jobMemberId,
      memberName: memberName,
      status: jobStatus,
      notes: jobNotes
    };

    if (editingJob) {
      await onUpdateJob(editingJob.id, jobData);
    } else {
      await onAddJob(jobData);
    }

    setIsJobModalOpen(false);
  };

  const handleJobDelete = async () => {
    if (!isAdmin) {
      alert('Solo los administradores pueden eliminar asignaciones de trabajo.');
      return;
    }
    if (!editingJob) return;
    confirmDialog('¿Estás seguro de que deseas eliminar este trabajo del calendario?', async () => {
      await onDeleteJob(editingJob.id);
      setIsJobModalOpen(false);
    });
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTargetMemberId = noteTargetMemberId || members[0]?.id;
    if (!isAdmin || !noteContent.trim() || !noteDate || !finalTargetMemberId) return;

    const assignedMember = members.find(m => m.id === finalTargetMemberId);
    const targetMemberName = assignedMember ? assignedMember.name : 'Sin asignar';

    const noteData = {
      content: noteContent,
      date: noteDate,
      targetMemberId: finalTargetMemberId,
      targetMemberName: targetMemberName,
      createdAt: editingNote ? editingNote.createdAt : Date.now()
    };

    if (editingNote) {
      await onUpdateAdminNote(editingNote.id, noteData);
    } else {
      await onAddAdminNote(noteData);
    }

    setIsNoteModalOpen(false);
    if (!editingNote) {
      setNoteContent('');
    }
  };

  const handleNoteDelete = async () => {
    if (!editingNote || !isAdmin) return;
    confirmDialog('¿Estás seguro de que deseas eliminar esta nota personal?', async () => {
      await onDeleteAdminNote(editingNote.id);
      setIsNoteModalOpen(false);
    });
  };

  // Group data by date for quick calendar render lookup
  const jobsByDate = useMemo(() => {
    const map: Record<string, CalendarJob[]> = {};
    jobs.forEach(j => {
      if (!map[j.date]) {
        map[j.date] = [];
      }
      map[j.date].push(j);
    });
    return map;
  }, [jobs]);

  const notesByDate = useMemo(() => {
    const map: Record<string, AdminNote[]> = {};
    adminNotes.forEach(n => {
      // Admins see all notes. Other members only see notes dedicated specifically to them.
      const canSee = isAdmin || n.targetMemberId === currentMember.id;
      if (!canSee) return;

      if (!map[n.date]) {
        map[n.date] = [];
      }
      map[n.date].push(n);
    });
    return map;
  }, [adminNotes, isAdmin, currentMember.id]);

  // Status visual configurations
  const statusStyles = {
    pending: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
      dot: 'bg-amber-500',
      label: 'Pendiente'
    },
    in_progress: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
      dot: 'bg-blue-500',
      label: 'En Proceso'
    },
    completed: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
      dot: 'bg-emerald-500',
      label: 'Completado'
    }
  };

  return (
    <div className="space-y-6" id="calendar-module-root">
      {/* Module Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Calendario de Operaciones
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Visualiza, asigna y modifica trabajos del equipo. {isAdmin && "Como administrador, puedes gestionar tus notas personales confidenciales."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-gray-50 p-1 rounded-xl border border-gray-150 flex" id="calendar-view-toggle">
            <button
              onClick={() => setViewType('month')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewType === 'month' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewType === 'week' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Semanal
            </button>
          </div>

          <button
            onClick={() => openNewJobModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md hover:shadow-lg cursor-pointer"
            id="add-calendar-job-btn"
          >
            <Plus className="w-4 h-4" />
            Asignar Trabajo
          </button>
        </div>
      </div>

      {/* Module Purpose Info Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-extrabold block mb-0.5">¿Para qué sirve este módulo?</strong>
          <p className="text-blue-800/80 leading-relaxed">
            El <strong>Calendario de Operaciones</strong> centraliza la asignación de labores de la empresa. Permite planificar el trabajo mensual o semanal, ver qué colaborador está asignado a cada tarea, y llevar un control visual e interactivo del estado de los proyectos. {isAdmin ? 'Como administrador, puedes redactar y enviar indicaciones específicas o comentarios directamente a la libreta personal de notas de cada miembro del equipo.' : 'Aquí también puedes revisar los mensajes y notas de directrices que la administración te ha dejado directamente en tu libreta de tareas.'}
          </p>
        </div>
      </div>

      {/* Main Calendar Body */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          {/* Month/Week Navigation Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200 transition text-gray-600"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3.5 py-1.5 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition text-gray-700"
              >
                Hoy
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-50 rounded-lg border border-gray-200 transition text-gray-600"
                title="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-black text-gray-800 tracking-tight capitalize">
              {viewType === 'month' 
                ? `${monthNames[month]} ${year}` 
                : `Semana del ${weekDays[0].date.getDate()} de ${monthNames[weekDays[0].date.getMonth()]}`}
            </h3>

            <div className="text-[10px] text-gray-400 font-extrabold tracking-wider uppercase">
              {viewType === 'month' ? 'Vista de Rejilla Completa' : 'Vista Semanal Detallada'}
            </div>
          </div>

          {/* Render Calendar (Month View) */}
          {viewType === 'month' && (
            <div className="flex flex-col" id="calendar-month-grid">
              {/* Day header names */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {dayNames.map((d, i) => (
                  <div key={i} className="text-[11px] font-black text-gray-400 uppercase tracking-widest py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 gap-2 min-h-[480px]">
                {monthGridDays.map((cell, index) => {
                  const dayJobs = jobsByDate[cell.dateStr] || [];
                  const dayNotes = notesByDate[cell.dateStr] || [];
                  const isToday = cell.dateStr === formatDateLocal(new Date());

                  return (
                    <div
                      key={index}
                      onClick={() => openNewJobModal(cell.dateStr)}
                      className={`min-h-[90px] border rounded-2xl p-2 flex flex-col justify-between transition-all group relative cursor-pointer ${
                        cell.isCurrentMonth 
                          ? 'bg-white border-gray-150 hover:border-blue-300 hover:shadow-sm' 
                          : 'bg-gray-50/50 border-gray-100 text-gray-300'
                      } ${isToday ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`text-xs font-bold ${
                          isToday 
                            ? 'bg-blue-600 text-white w-5.5 h-5.5 rounded-full flex items-center justify-center' 
                            : cell.isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                        }`}>
                          {cell.date.getDate()}
                        </span>

                        {/* Add indicator controls on hover */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                          <div className="p-1 hover:bg-gray-150 rounded-md text-blue-600 transition">
                            <Plus className="w-3 h-3" />
                          </div>
                        </div>
                      </div>

                      {/* Display Items List */}
                      <div className="flex-1 space-y-1 overflow-y-auto max-h-[70px] scrollbar-thin">
                        {/* Show Public Jobs */}
                        {dayJobs.map(job => {
                          const style = statusStyles[job.status || 'pending'];
                          return (
                            <div
                              key={job.id}
                              onClick={(e) => openEditJobModal(job, e)}
                              className={`border text-[10px] font-medium py-0.5 px-1.5 rounded-md flex items-center justify-between gap-1 transition truncate ${style.bg}`}
                              title={`${job.title} | Asignado a: ${job.memberName || 'Sin asignar'}`}
                            >
                              <span className="truncate block font-bold">{job.title}</span>
                              <span className="text-[9px] opacity-70 truncate font-semibold shrink-0">({(job.memberName || 'Sin asignar').split(' ')[0]})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Render Calendar (Week View) */}
          {viewType === 'week' && (
            <div className="grid grid-cols-7 gap-3 min-h-[440px]" id="calendar-week-grid">
              {weekDays.map((day, idx) => {
                const dayJobs = jobsByDate[day.dateStr] || [];
                const dayNotes = notesByDate[day.dateStr] || [];
                const isToday = day.dateStr === formatDateLocal(new Date());

                return (
                  <div
                    key={idx}
                    onClick={() => openNewJobModal(day.dateStr)}
                    className={`border rounded-2xl p-3 flex flex-col min-h-[380px] transition cursor-pointer ${
                      isToday 
                        ? 'bg-blue-50/20 border-blue-300 ring-1 ring-blue-400/20' 
                        : 'bg-white border-gray-150 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Header Day */}
                    <div className="text-center pb-2.5 border-b border-gray-100 mb-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase block tracking-widest mb-1">
                        {dayNames[day.date.getDay()]}
                      </span>
                      <span className={`text-lg font-black inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-900'
                      }`}>
                        {day.date.getDate()}
                      </span>
                    </div>

                    {/* Content Section (Jobs & Notes) */}
                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[320px] scrollbar-thin">
                      {/* Interactive Trigger block on top */}
                      <div className="text-center py-1 opacity-0 hover:opacity-100 transition-opacity bg-gray-50 border border-dashed border-gray-200 rounded-lg text-[9px] text-gray-500 font-bold mb-1">
                        + Asignar
                      </div>

                      {/* Jobs */}
                      {dayJobs.length === 0 ? (
                        <div className="py-8 text-center text-gray-300 text-[10px] font-bold">
                          Sin actividades
                        </div>
                      ) : (
                        dayJobs.map(job => {
                          const style = statusStyles[job.status || 'pending'];
                          return (
                            <div
                              key={job.id}
                              onClick={(e) => openEditJobModal(job, e)}
                              className={`p-2.5 rounded-xl border hover:shadow-sm transition text-xs space-y-1.5 ${style.bg}`}
                            >
                              <h4 className="font-extrabold leading-tight">{job.title}</h4>
                              
                              <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                                <User className="w-3 h-3 shrink-0" />
                                <span className="font-semibold truncate">{job.memberName}</span>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-black/5">
                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                  {style.label}
                                </span>
                                <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* MINI NOTEBOOK SECTION - BELOW CALENDAR */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden" id="mini-notebook-container">
        {/* Spiral Notebook Ring Accents at the top */}
        <div className="absolute top-0 inset-x-0 h-4 flex justify-around px-8 pointer-events-none select-none">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="w-3 h-6 bg-gradient-to-b from-gray-400 to-gray-300 rounded-full border border-gray-400 shadow-xs -translate-y-2 z-10" />
          ))}
        </div>

        <div className="pt-4 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-amber-200/60">
            <div>
              <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest block mb-1">
                {isAdmin ? 'Módulo de Notas del Administrador' : 'Tus Mensajes de la Administración'}
              </span>
              <h3 className="text-xl font-black text-amber-950 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                Libreta de Mensajes y Notas para el Equipo
              </h3>
              <p className="text-xs text-amber-800/70 mt-1 leading-relaxed">
                {isAdmin 
                  ? 'Redacta y envía indicaciones, mensajes semanales o tareas específicas directamente a la libreta personal de cada miembro.' 
                  : 'Aquí encontrarás indicaciones, comentarios o mensajes semanales que el administrador ha dejado específicamente para ti.'}
              </p>
            </div>
          </div>

          {/* Grid Layout inside the Notebook */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {isAdmin ? (
              <>
                {/* Form to create/edit note */}
                <div className="lg:col-span-4 bg-white/70 backdrop-blur-xs p-5 rounded-2xl border border-amber-200/50 space-y-4">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-700" />
                    {editingNote ? 'Editar Nota Seleccionada' : 'Crear Nota / Mensaje'}
                  </h4>
                  
                  <form onSubmit={handleNoteSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1.5">
                        Contenido del Mensaje
                      </label>
                      <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Escribe las indicaciones o mensaje importante para esta semana..."
                        className="w-full text-xs p-3 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-950 placeholder-amber-700/50"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1.5">
                          Para Quién
                        </label>
                        <select
                          required
                          value={noteTargetMemberId}
                          onChange={(e) => setNoteTargetMemberId(e.target.value)}
                          className="w-full text-[11px] p-2 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-950"
                        >
                          <option value="">Seleccionar...</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1.5">
                          Fecha
                        </label>
                        <input
                          type="date"
                          required
                          value={noteDate || formatDateLocal(new Date())}
                          onChange={(e) => setNoteDate(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-amber-950"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {editingNote && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNote(null);
                            setNoteContent('');
                            setNoteDate(formatDateLocal(new Date()));
                            setNoteTargetMemberId(members[0]?.id || '');
                          }}
                          className="w-1/3 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        className={`py-2.5 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm ${
                          editingNote ? 'w-2/3 bg-amber-700 hover:bg-amber-800' : 'w-full bg-amber-700 hover:bg-amber-800'
                        }`}
                      >
                        {editingNote ? 'Guardar Cambios' : 'Enviar Nota / Mensaje'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of sent notes */}
                <div className="lg:col-span-8 space-y-3">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    Historial de Notas de la Semana ({adminNotes.length})
                  </h4>

                  {adminNotes.length === 0 ? (
                    <div className="text-center py-12 bg-white/30 border border-dashed border-amber-200 rounded-2xl text-amber-800/60 text-xs italic">
                      No has enviado notas todavía. Usa el formulario de la izquierda para redactar tu primera indicación.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                      {[...adminNotes]
                        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
                        .map(note => (
                          <div
                            key={note.id}
                            className="p-4 bg-white hover:bg-amber-50/40 border border-amber-100 rounded-2xl shadow-xs transition duration-200 relative group flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[9px] font-black text-amber-800 uppercase border-b border-amber-100/50 pb-1.5">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3 text-amber-600" />
                                  <span>{note.date}</span>
                                </span>
                                <span className="bg-amber-100 px-2.5 py-0.5 rounded-full text-[8px] text-amber-900 font-extrabold">
                                  Para: {note.targetMemberName}
                                </span>
                              </div>
                              <p className="text-xs text-amber-950 leading-relaxed font-bold break-words whitespace-pre-wrap">{note.content}</p>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-amber-50">
                              <button
                                type="button"
                                onClick={(e) => openEditNoteModal(note, e)}
                                className="p-1 hover:bg-amber-100/60 rounded text-amber-700 transition"
                                title="Editar Nota"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDialog('¿Eliminar esta nota de la libreta?', async () => {
                                    await onDeleteAdminNote(note.id);
                                  });
                                }}
                                className="p-1 hover:bg-red-50 rounded text-red-600 transition"
                                title="Eliminar Nota"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Team Member View: filter by targetMemberId */
              <div className="lg:col-span-12 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    Tus Notas de la Administración ({adminNotes.filter(n => n.targetMemberId === currentMember.id).length})
                  </h4>
                </div>

                {adminNotes.filter(n => n.targetMemberId === currentMember.id).length === 0 ? (
                  <div className="text-center py-16 bg-white/40 border border-dashed border-amber-200 rounded-2xl text-amber-800/60 text-xs font-bold">
                    No tienes indicaciones o notas directas de la administración en este momento. ¡Sigue con el excelente trabajo!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...adminNotes]
                      .filter(n => n.targetMemberId === currentMember.id)
                      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
                      .map(note => (
                        <div
                          key={note.id}
                          className="p-5 bg-white border border-amber-200/80 rounded-2xl shadow-xs transition duration-200 relative flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-[9px] font-bold text-amber-800 uppercase border-b border-amber-100 pb-1.5">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3 text-amber-600" />
                                <span>{note.date}</span>
                              </span>
                              <span className="bg-amber-100 px-2 py-0.5 rounded text-[8px] text-amber-900 font-extrabold">
                                Indicación Personal
                              </span>
                            </div>
                            <p className="text-xs text-amber-950 leading-relaxed font-bold break-words whitespace-pre-wrap">{note.content}</p>
                          </div>
                          <div className="text-[9px] text-amber-700 font-extrabold text-right mt-4 italic">
                            De: Administración
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: CREATE / EDIT PUBLIC JOB */}
      {isJobModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="job-modal-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-scale-up" id="job-modal-content">
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {editingJob ? 'Editar Asignación de Trabajo' : 'Asignar Nuevo Trabajo'}
              </h3>
              <button 
                onClick={() => setIsJobModalOpen(false)}
                className="p-1 hover:bg-white/15 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJobSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Descripción del Trabajo o Proyecto
                </label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ej. Rediseño de marca o Cierre fiscal"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Fecha de Ejecución
                  </label>
                  <input
                    type="date"
                    required
                    value={jobDate}
                    onChange={(e) => setJobDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Estado de Avance
                  </label>
                  <select
                    value={jobStatus}
                    onChange={(e) => setJobStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Proceso</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Responsable Asignado del Equipo
                </label>
                <select
                  required
                  value={jobMemberId}
                  onChange={(e) => setJobMemberId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un miembro...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Notas de Trabajo / Instrucciones (Públicas)
                </label>
                <textarea
                  value={jobNotes}
                  onChange={(e) => setJobNotes(e.target.value)}
                  placeholder="Detalles sobre entregables, contraseñas, alcances o prioridades..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                {editingJob && isAdmin ? (
                  <button
                    type="button"
                    onClick={handleJobDelete}
                    className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsJobModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
                  >
                    {editingJob ? 'Guardar Cambios' : 'Asignar Trabajo'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT ADMIN CONFIDENTIAL NOTE */}
      {isNoteModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="note-modal-backdrop">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-scale-up" id="note-modal-content">
            <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-300" />
                {editingNote ? 'Editar Nota Confidencial' : 'Nueva Nota Confidencial'}
              </h3>
              <button 
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 hover:bg-white/15 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNoteSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Fecha del Registro
                  </label>
                  <input
                    type="date"
                    required
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Destinatario del Equipo
                  </label>
                  <select
                    required
                    value={noteTargetMemberId}
                    onChange={(e) => setNoteTargetMemberId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-700"
                  >
                    <option value="">Selecciona destinatario...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Contenido de la Nota Confidencial
                </label>
                <textarea
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Recordatorios privados, anotaciones de desempeño de personal, contraseñas o finanzas sensibles..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  rows={4}
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                {editingNote ? (
                  <button
                    type="button"
                    onClick={handleNoteDelete}
                    className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNoteModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
                  >
                    {editingNote ? 'Guardar Cambios' : 'Guardar Nota Confidencial'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
