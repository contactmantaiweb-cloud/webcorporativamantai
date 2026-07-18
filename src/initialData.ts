import { Member, Transaction, CategoryBudget, Invoice } from './types';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'MANTAIWEB',
    email: 'contactmantaiweb@gmail.com',
    role: 'admin',
    active: true,
    avatarColor: 'bg-blue-600',
    password: 'mayonesa8790'
  },
  {
    id: 'm2',
    name: 'SANTIAGO GAZEL',
    email: 'sgoglezz@gmail.com',
    role: 'CIO',
    active: true,
    avatarColor: 'bg-emerald-600',
    password: 'santiagogazel777'
  },
  {
    id: 'm3',
    name: 'SANTIAGO GUADAMUZ',
    email: 'santiagoguadamuz66@gmail.com',
    role: 'PRODUCTION TEAM',
    active: true,
    avatarColor: 'bg-purple-600',
    password: 'guadamuzlover123'
  },
  {
    id: 'm4',
    name: 'SEBASTIAN LOPEZ CANNESA',
    email: 'sebitas5245@gmail.com',
    role: 'CFO/CPO',
    active: true,
    avatarColor: 'bg-amber-600',
    password: 'elfondodebikini123'
  },
  {
    id: 'm5',
    name: 'GABRIEL GUADAMUZ',
    email: 'gabrielguadamuzriver@gmail.com',
    role: 'CEO',
    active: true,
    avatarColor: 'bg-pink-600',
    password: 'Guadamuz2931'
  },
  {
    id: 'm6',
    name: 'ALFREDO ACUÑA',
    email: 'alfredoacunaaguilar021@gmail.com',
    role: 'CMO',
    active: true,
    avatarColor: 'bg-teal-600',
    password: 'Alfredoaguilar123'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGETS: CategoryBudget[] = [
  { category: 'Sueldos y Honorarios', limit: 12000 },
  { category: 'Infraestructura Cloud', limit: 1500 },
  { category: 'Marketing Digital', limit: 3000 },
  { category: 'Soporte y Licencias', limit: 800 },
  { category: 'Servicios de Oficina', limit: 2000 },
  { category: 'Impuestos y Tasas', limit: 2500 }
];

export const INITIAL_INVOICES: Invoice[] = [];
