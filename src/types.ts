export type UserRole = 'admin' | 'CEO' | 'CFO/CPO' | 'CPO/CFO' | 'CMO' | 'CIO' | 'PRODUCTION TEAM' | 'accountant';

export interface Member {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatarColor: string;
  password?: string; // stored securely in local state for simulation
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'completed' | 'pending';
  loggedBy: string; // Member name or ID
  targetMemberId?: string; // Optional: ID of the member this transaction is targeted to (e.g. for payments)
}

export interface CategoryBudget {
  category: string;
  limit: number;
}

export interface Invoice {
  id: string;
  client: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  loggedBy?: string; // Member name who issued the invoice
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  pendingInvoicesAmount: number;
}

export interface CalendarJob {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  memberId: string;
  memberName: string;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface AdminNote {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  targetMemberId: string; // The team member ID this note is dedicated to
  targetMemberName: string; // The team member name
  createdAt: number;
  completed?: boolean;
  completedAt?: number;
  completedBy?: string;
}

