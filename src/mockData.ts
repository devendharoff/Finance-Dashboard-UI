import { Transaction } from "./types";

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2024-03-01', amount: 5000, category: 'Salary', type: 'income', description: 'Monthly Salary' },
  { id: '2', date: '2024-03-02', amount: 1200, category: 'Rent', type: 'expense', description: 'Apartment Rent' },
  { id: '3', date: '2024-03-05', amount: 150, category: 'Groceries', type: 'expense', description: 'Weekly Groceries' },
  { id: '4', date: '2024-03-07', amount: 80, category: 'Transport', type: 'expense', description: 'Gas refill' },
  { id: '5', date: '2024-03-10', amount: 200, category: 'Entertainment', type: 'expense', description: 'Movie night & Dinner' },
  { id: '6', date: '2024-03-12', amount: 300, category: 'Freelance', type: 'income', description: 'Logo Design Project' },
  { id: '7', date: '2024-03-15', amount: 60, category: 'Utilities', type: 'expense', description: 'Electricity Bill' },
  { id: '8', date: '2024-03-18', amount: 100, category: 'Groceries', type: 'expense', description: 'Mid-month top up' },
  { id: '9', date: '2024-03-20', amount: 45, category: 'Transport', type: 'expense', description: 'Uber rides' },
  { id: '10', date: '2024-03-22', amount: 120, category: 'Shopping', type: 'expense', description: 'New sneakers' },
  { id: '11', date: '2024-03-25', amount: 250, category: 'Freelance', type: 'income', description: 'Consulting' },
  { id: '12', date: '2024-03-28', amount: 90, category: 'Dining', type: 'expense', description: 'Lunch with friends' },
];

export const CATEGORIES = [
  'Salary', 'Rent', 'Groceries', 'Transport', 'Entertainment', 'Freelance', 'Utilities', 'Shopping', 'Dining', 'Other'
];
