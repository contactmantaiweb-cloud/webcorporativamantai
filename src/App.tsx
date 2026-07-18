import React, { useState, useEffect } from 'react';
import { Member, Transaction, CategoryBudget, Invoice, CalendarJob, AdminNote } from './types';
import {
  INITIAL_MEMBERS,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_INVOICES,
} from './initialData';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

// Component Imports
import Login from './components/Login';
import Sidebar, { ActiveTab } from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import CalendarView from './components/CalendarView';
import TransactionsView from './components/TransactionsView';
import BudgetsView from './components/BudgetsView';
import InvoicesView from './components/InvoicesView';
import TeamView from './components/TeamView';
import MemberPaymentsView from './components/MemberPaymentsView';
import ExportImportView from './components/ExportImportView';
import AIAssistantView from './components/AIAssistantView';

import { ConfirmProvider } from './components/ConfirmProvider';

export default function App() {
  // --- Session State from LocalStorage ---
  const [currentMember, setCurrentMember] = useState<Member | null>(() => {
    const saved = localStorage.getItem('mantai_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // --- Real-time Synchronized Database States ---
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>(INITIAL_BUDGETS);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [calendarJobs, setCalendarJobs] = useState<CalendarJob[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedPaymentMemberId, setSelectedPaymentMemberId] = useState<string | null>(null);

  // --- Firebase Synchronization Effects ---
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'members'), (snapshot) => {
      const list: Member[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Member);
      });
      if (list.length === 0) {
        // Seed INITIAL_MEMBERS to Firestore
        INITIAL_MEMBERS.forEach(async (m) => {
          await setDoc(doc(db, 'members', m.id), m);
        });
        setMembers(INITIAL_MEMBERS);
      } else {
        setMembers(list);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'budgets'), (snapshot) => {
      const list: CategoryBudget[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as CategoryBudget);
      });
      if (list.length === 0) {
        // Seed INITIAL_BUDGETS to Firestore
        INITIAL_BUDGETS.forEach(async (b) => {
          await setDoc(doc(db, 'budgets', b.category), b);
        });
        setBudgets(INITIAL_BUDGETS);
      } else {
        setBudgets(list);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const list: Transaction[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Invoice);
      });
      list.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
      setInvoices(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'calendar_jobs'), (snapshot) => {
      const list: CalendarJob[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CalendarJob);
      });
      setCalendarJobs(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'admin_notes'), (snapshot) => {
      const list: AdminNote[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AdminNote);
      });
      setAdminNotes(list);
    });
    return () => unsubscribe();
  }, []);

  // Update currentMember session if database updates roles or active state
  useEffect(() => {
    if (currentMember) {
      const found = members.find((m) => m.email === currentMember.email);
      if (found) {
        if (!found.active) {
          setCurrentMember(null);
        } else if (
          found.role !== currentMember.role ||
          found.name !== currentMember.name
        ) {
          setCurrentMember(found);
        }
      }
    }
  }, [members, currentMember]);

  useEffect(() => {
    if (currentMember) {
      localStorage.setItem('mantai_current_user', JSON.stringify(currentMember));
    } else {
      localStorage.removeItem('mantai_current_user');
    }
  }, [currentMember]);

  // --- Callback Handlers (Integrated with Firestore) ---

  const handleLoginSuccess = (member: Member) => {
    setCurrentMember(member);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentMember(null);
  };

  // 1. Transactions Actions
  const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
    const newId = `t-${Date.now()}`;
    const newTx: Transaction = {
      id: newId,
      ...t,
    };
    await setDoc(doc(db, 'transactions', newId), newTx);
  };

  const handleUpdateTransaction = async (id: string, updated: Partial<Transaction>) => {
    await setDoc(doc(db, 'transactions', id), updated, { merge: true });
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  };

  // 2. Budget Actions
  const handleAddBudget = async (b: CategoryBudget) => {
    await setDoc(doc(db, 'budgets', b.category), b);
  };

  const handleUpdateBudget = async (category: string, newLimit: number) => {
    await setDoc(doc(db, 'budgets', category), { category, limit: newLimit });
  };

  const handleDeleteBudget = async (category: string) => {
    await deleteDoc(doc(db, 'budgets', category));
  };

  // 3. Invoice Actions
  const handleAddInvoice = async (inv: Invoice) => {
    await setDoc(doc(db, 'invoices', inv.id), inv);
  };

  const handleUpdateInvoiceStatus = async (
    id: string,
    status: 'paid' | 'pending' | 'overdue',
    logToLedger?: boolean
  ) => {
    await setDoc(doc(db, 'invoices', id), { status }, { merge: true });

    // If marked as paid, and user wanted to ledgerize, record income
    if (status === 'paid' && logToLedger) {
      const invoice = invoices.find((inv) => inv.id === id);
      if (invoice) {
        await handleAddTransaction({
          date: new Date().toISOString().substring(0, 10),
          category: 'Ventas de Proyectos',
          description: `Cobro Factura ${invoice.id} - Cliente: ${invoice.client}`,
          amount: invoice.amount,
          type: 'income',
          status: 'completed',
          loggedBy: currentMember?.name || 'Sistema Automatizado',
        });
      }
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    await deleteDoc(doc(db, 'invoices', id));
  };

  // 4. Team Actions
  const handleAddMember = async (newM: Omit<Member, 'id'>) => {
    const nextId = `m-${Date.now()}`;
    const member: Member = {
      id: nextId,
      ...newM,
    };
    await setDoc(doc(db, 'members', nextId), member);
  };

  const handleToggleMemberActive = async (id: string) => {
    const m = members.find((x) => x.id === id);
    if (m) {
      await setDoc(doc(db, 'members', id), { active: !m.active }, { merge: true });
    }
  };

  const handleDeleteMember = async (id: string) => {
    await deleteDoc(doc(db, 'members', id));
  };

  // 6. Calendar Job Actions
  const handleAddJob = async (job: Omit<CalendarJob, 'id'>) => {
    const newId = `job-${Date.now()}`;
    const newJob: CalendarJob = {
      id: newId,
      ...job,
    };
    await setDoc(doc(db, 'calendar_jobs', newId), newJob);
  };

  const handleUpdateJob = async (id: string, updated: Partial<CalendarJob>) => {
    await setDoc(doc(db, 'calendar_jobs', id), updated, { merge: true });
  };

  const handleDeleteJob = async (id: string) => {
    await deleteDoc(doc(db, 'calendar_jobs', id));
  };

  // 7. Admin Notes Actions
  const handleAddAdminNote = async (note: Omit<AdminNote, 'id'>) => {
    const newId = `note-${Date.now()}`;
    const newNote: AdminNote = {
      id: newId,
      ...note,
    };
    await setDoc(doc(db, 'admin_notes', newId), newNote);
  };

  const handleUpdateAdminNote = async (id: string, updated: Partial<AdminNote>) => {
    await setDoc(doc(db, 'admin_notes', id), updated, { merge: true });
  };

  const handleDeleteAdminNote = async (id: string) => {
    await deleteDoc(doc(db, 'admin_notes', id));
  };

  // 5. Database Actions
  const handleImportData = async (importedState: {
    transactions: any[];
    budgets: any[];
    invoices: any[];
    members: any[];
  }) => {
    for (const t of importedState.transactions) {
      await setDoc(doc(db, 'transactions', t.id), t);
    }
    for (const b of importedState.budgets) {
      await setDoc(doc(db, 'budgets', b.category), b);
    }
    for (const inv of importedState.invoices) {
      await setDoc(doc(db, 'invoices', inv.id), inv);
    }
    for (const m of importedState.members) {
      await setDoc(doc(db, 'members', m.id), m);
    }

    // Check if current user is still valid in the imported set
    if (currentMember) {
      const exists = importedState.members.find((m) => m.email === currentMember.email && m.active);
      if (!exists) {
        setCurrentMember(null);
      }
    }
  };

  const handleResetToDefaults = async () => {
    // Delete all current transactions
    for (const t of transactions) {
      await deleteDoc(doc(db, 'transactions', t.id));
    }
    // Delete all current invoices
    for (const inv of invoices) {
      await deleteDoc(doc(db, 'invoices', inv.id));
    }
    // Restore budgets to default
    for (const b of budgets) {
      await deleteDoc(doc(db, 'budgets', b.category));
    }
    INITIAL_BUDGETS.forEach(async (b) => {
      await setDoc(doc(db, 'budgets', b.category), b);
    });
    // Restore members to default
    for (const m of members) {
      if (m.id !== currentMember?.id) {
        await deleteDoc(doc(db, 'members', m.id));
      }
    }
    INITIAL_MEMBERS.forEach(async (m) => {
      await setDoc(doc(db, 'members', m.id), m);
    });

    setActiveTab('dashboard');
  };

  // --- Render Sub-tab views ---
  const renderContentView = () => {
    if (!currentMember) return null;

    const isAdmin = currentMember.role === 'admin';

    // All members can see all transactions
    const filteredTxs = transactions;

    const filteredInvoices = isAdmin
      ? invoices
      : invoices.filter((inv) => inv.loggedBy === currentMember.name);

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            transactions={filteredTxs}
            allTransactions={transactions}
            budgets={budgets}
            invoices={filteredInvoices}
            onNavigateToTab={setActiveTab}
            onQuickAddTransaction={() => setActiveTab('transactions')}
            currentMember={currentMember}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            currentMember={currentMember}
            members={members}
            jobs={calendarJobs}
            adminNotes={adminNotes}
            onAddJob={handleAddJob}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
            onAddAdminNote={handleAddAdminNote}
            onUpdateAdminNote={handleUpdateAdminNote}
            onDeleteAdminNote={handleDeleteAdminNote}
          />
        );
      case 'transactions':
        return (
          <TransactionsView
            transactions={filteredTxs}
            currentMember={currentMember}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'budgets':
        return (
          <BudgetsView
            budgets={budgets}
            transactions={filteredTxs}
            currentMember={currentMember}
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        );
      case 'invoices':
        return (
          <InvoicesView
            invoices={filteredInvoices}
            currentMember={currentMember}
            onAddInvoice={handleAddInvoice}
            onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
            onDeleteInvoice={handleDeleteInvoice}
          />
        );
      case 'members':
        return (
          <TeamView
            members={members}
            currentMember={currentMember}
            transactions={transactions}
            onAddMember={handleAddMember}
            onToggleActive={handleToggleMemberActive}
            onDeleteMember={handleDeleteMember}
            onManagePayments={(id) => {
              setSelectedPaymentMemberId(id);
              setActiveTab('member-payments');
            }}
          />
        );
      case 'member-payments':
        const targetMember = members.find(m => m.id === selectedPaymentMemberId);
        if (!targetMember) {
          return <div className="p-8 text-center text-gray-500">Miembro no encontrado.</div>;
        }
        return (
          <MemberPaymentsView
            member={targetMember}
            transactions={transactions}
            currentMember={currentMember}
            onBack={() => {
              setActiveTab('members');
              setSelectedPaymentMemberId(null);
            }}
            onAddPayment={async (amount, description) => {
              await handleAddTransaction({
                date: new Date().toISOString().substring(0, 10),
                category: 'Pago a Equipo',
                description,
                amount,
                type: 'expense',
                status: 'completed',
                loggedBy: currentMember.name,
                targetMemberId: targetMember.id
              });
            }}
            onDeletePayment={handleDeleteTransaction}
          />
        );
      case 'data':
        return (
          <ExportImportView
            currentData={{ transactions, budgets, invoices, members }}
            onImportData={handleImportData}
            onResetToDefaults={handleResetToDefaults}
          />
        );
      case 'ai-assistant':
        return (
          <AIAssistantView
            currentMember={currentMember}
            transactions={transactions}
            budgets={budgets}
            invoices={invoices}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-gray-500 font-semibold text-sm">
            Módulo en desarrollo o no disponible.
          </div>
        );
    }
  };

  // Render layout inside ConfirmProvider with AnimatePresence transitions
  return (
    <ConfirmProvider>
      <AnimatePresence mode="wait">
        {!currentMember ? (
          <motion.div
            key="login-view"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <Login
              members={members}
              onLoginSuccess={handleLoginSuccess}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-app-layout"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }}
            className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-800 w-full"
            id="app-root-layout"
          >
            {/* Sidebar navigation */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              companyName="Mantai"
              subTitle="Gestión Financiera"
              currentMember={currentMember}
            />

            {/* Main page panel */}
            <div className="flex-1 flex flex-col overflow-hidden" id="app-main-panel">
              {/* Navigation / Header */}
              <Navbar
                currentMember={currentMember}
                onLogout={handleLogout}
              />

              {/* Dynamic page content */}
              <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50/50" id="app-main-content">
                {renderContentView()}
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmProvider>
  );
}
