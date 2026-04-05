export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  type: TransactionType;
  description: string;
}

export type UserRole = 'admin' | 'viewer';

export interface DashboardStats {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface TrendDataPoint {
  date: string;
  balance: number;
  income: number;
  expense: number;
}
