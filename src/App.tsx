import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  TrendingUp, 
  PieChart as PieChartIcon,
  Moon,
  Sun,
  User,
  Shield,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { cn, formatCurrency } from './lib/utils';
import { Transaction, UserRole, DashboardStats, TransactionType } from './types';
import { INITIAL_TRANSACTIONS, CATEGORIES } from './mockData';

export default function App() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fintrack_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  const [role, setRole] = useState<UserRole>('admin');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fintrack_theme') === 'dark' || 
             (!localStorage.getItem('fintrack_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'insights'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'description' | 'date' | 'amount'; direction: 'asc' | 'desc' } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleSort = (key: 'description' | 'date' | 'amount') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: 'description' | 'date' | 'amount') => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />;
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('fintrack_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('fintrack_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Derived Stats
  const stats = useMemo((): DashboardStats => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      totalBalance: income - expenses,
      totalIncome: income,
      totalExpenses: expenses
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const data: any[] = [];
    let runningBalance = 0;
    
    // Group by date for the trend chart
    const byDate = sorted.reduce((acc: any, t) => {
      if (!acc[t.date]) acc[t.date] = { income: 0, expense: 0 };
      if (t.type === 'income') acc[t.date].income += t.amount;
      else acc[t.date].expense += t.amount;
      return acc;
    }, {});

    Object.keys(byDate).forEach(date => {
      runningBalance += byDate[date].income - byDate[date].expense;
      data.push({
        date: format(parseISO(date), 'MMM dd'),
        balance: runningBalance,
        income: byDate[date].income,
        expense: byDate[date].expense
      });
    });
    
    return data;
  }, [transactions]);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totals = expenses.reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = transactions
      .filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        
        const matchesStartDate = !startDate || t.date >= startDate;
        const matchesEndDate = !endDate || t.date <= endDate;

        return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
      });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by date descending
      result.sort((a, b) => b.date.localeCompare(a.date));
    }

    return result;
  }, [transactions, searchQuery, typeFilter, startDate, endDate, sortConfig]);

  const insights = useMemo(() => {
    const highestExpense = categoryData[0];
    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const getMonthTotal = (date: Date) => {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      return transactions
        .filter(t => t.type === 'expense' && isWithinInterval(parseISO(t.date), { start, end }))
        .reduce((acc, t) => acc + t.amount, 0);
    };

    const currentTotal = getMonthTotal(currentMonth);
    const lastTotal = getMonthTotal(lastMonth);
    const diff = currentTotal - lastTotal;
    const percentChange = lastTotal === 0 ? 0 : (diff / lastTotal) * 100;

    return {
      highestExpense,
      monthlyComparison: {
        current: currentTotal,
        last: lastTotal,
        percentChange
      }
    };
  }, [transactions, categoryData]);

  // Handlers
  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role !== 'admin') return;

    const formData = new FormData(e.currentTarget);
    const newTransaction: Transaction = {
      id: editingTransaction?.id || Math.random().toString(36).substr(2, 9),
      date: formData.get('date') as string,
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as string,
      type: formData.get('type') as TransactionType,
      description: formData.get('description') as string,
    };

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? newTransaction : t));
    } else {
      setTransactions(prev => [...prev, newTransaction]);
    }

    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (role !== 'admin') return;
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleEditTransaction = (t: Transaction) => {
    if (role !== 'admin') return;
    setEditingTransaction(t);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.type,
      t.amount.toString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fintrack_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredTransactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fintrack_export_${format(new Date(), 'yyyy-MM-dd')}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-8 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Wallet size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">FinTrack</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "btn justify-start gap-3 w-full",
              activeTab === 'overview' ? "bg-primary/10 dark:bg-primary/20 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <LayoutDashboard size={20} />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={cn(
              "btn justify-start gap-3 w-full",
              activeTab === 'transactions' ? "bg-primary/10 dark:bg-primary/20 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <TrendingUp size={20} />
            Transactions
          </button>
          <button 
            onClick={() => setActiveTab('insights')}
            className={cn(
              "btn justify-start gap-3 w-full",
              activeTab === 'insights' ? "bg-primary/10 dark:bg-primary/20 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <PieChartIcon size={20} />
            Insights
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Theme</span>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Role</span>
              {role === 'admin' ? <Shield size={14} className="text-primary" /> : <User size={14} className="text-slate-400 dark:text-slate-500" />}
            </div>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-slate-900 dark:text-slate-100"
            >
              <option value="admin" className="dark:bg-slate-900">Administrator</option>
              <option value="viewer" className="dark:bg-slate-900">Viewer Only</option>
            </select>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold">
              {activeTab === 'overview' && "Dashboard Overview"}
              {activeTab === 'transactions' && "Transactions History"}
              {activeTab === 'insights' && "Financial Insights"}
            </h2>
            <p className="text-slate-500">Welcome back! Here's what's happening with your money.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {role === 'admin' && (
              <button 
                onClick={() => {
                  setEditingTransaction(null);
                  setIsModalOpen(true);
                }}
                className="btn btn-primary"
              >
                <Plus size={20} />
                Add Transaction
              </button>
            )}
            <button 
              onClick={handleExportCSV}
              className="btn btn-secondary"
              title="Export as CSV"
            >
              <Download size={20} />
              CSV
            </button>
            <button 
              onClick={handleExportJSON}
              className="btn btn-secondary"
              title="Export as JSON"
            >
              <Download size={20} />
              JSON
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 border-l-4 border-l-primary">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Total Balance</span>
                    <div className="p-2 bg-primary/10 dark:bg-primary/20 text-primary rounded-lg">
                      <Wallet size={20} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalBalance)}</div>
                  <div className="mt-2 flex items-center gap-1 text-sm text-success">
                    <ArrowUpRight size={14} />
                    <span>+2.4% from last month</span>
                  </div>
                </div>

                <div className="card p-6 border-l-4 border-l-success">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Total Income</span>
                    <div className="p-2 bg-success/10 dark:bg-success/20 text-success rounded-lg">
                      <ArrowUpRight size={20} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalIncome)}</div>
                  <div className="mt-2 text-sm text-slate-400 dark:text-slate-500">Total earnings this period</div>
                </div>

                <div className="card p-6 border-l-4 border-l-danger">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Total Expenses</span>
                    <div className="p-2 bg-danger/10 dark:bg-danger/20 text-danger rounded-lg">
                      <ArrowDownLeft size={20} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.totalExpenses)}</div>
                  <div className="mt-2 text-sm text-slate-400 dark:text-slate-500">Total spending this period</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-lg font-bold mb-6">Balance Trend</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#0f172a' : '#fff', 
                            border: isDarkMode ? '1px solid #1e293b' : 'none', 
                            borderRadius: '12px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }} 
                          itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                        />
                        <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-bold mb-6">Spending by Category</h3>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    {categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDarkMode ? '#0f172a' : '#fff', 
                              border: isDarkMode ? '1px solid #1e293b' : 'none', 
                              borderRadius: '12px',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                            }} 
                            itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center gap-2">
                        <PieChartIcon size={48} strokeWidth={1} />
                        <p>No expense data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Transactions Preview */}
              <div className="card">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Recent Transactions</h3>
                  <button onClick={() => setActiveTab('transactions')} className="text-primary text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-3 font-semibold">Transaction</th>
                        <th className="px-6 py-3 font-semibold">Category</th>
                        <th className="px-6 py-3 font-semibold">Date</th>
                        <th className="px-6 py-3 font-semibold text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transactions.slice(0, 5).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                t.type === 'income' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                              )}>
                                {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                              </div>
                              <span className="font-medium">{t.description}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                              {t.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm">
                            {format(parseISO(t.date), 'MMM dd, yyyy')}
                          </td>
                          <td className={cn(
                            "px-6 py-4 text-right font-bold",
                            t.type === 'income' ? "text-success" : "text-danger"
                          )}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div 
              key="transactions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Filters Bar */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search by description or category..." 
                      className="input pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <select 
                        className="input pr-10 appearance-none min-w-[140px]"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                      >
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <Filter size={16} />
                    <span>Date Range:</span>
                  </div>
                  <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
                    <input 
                      type="date" 
                      className="input py-1.5 text-sm"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-slate-400">to</span>
                    <input 
                      type="date" 
                      className="input py-1.5 text-sm"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  {(searchQuery || typeFilter !== 'all' || startDate || endDate) && (
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setTypeFilter('all');
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      <X size={14} />
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Transactions Table */}
              <div className="card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                        <th 
                          className="px-6 py-3 font-semibold cursor-pointer group hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                          onClick={() => handleSort('description')}
                        >
                          <div className="flex items-center gap-2">
                            Transaction
                            {getSortIcon('description')}
                          </div>
                        </th>
                        <th className="px-6 py-3 font-semibold">Category</th>
                        <th 
                          className="px-6 py-3 font-semibold cursor-pointer group hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center gap-2">
                            Date
                            {getSortIcon('date')}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 font-semibold text-right cursor-pointer group hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center justify-end gap-2">
                            Amount
                            {getSortIcon('amount')}
                          </div>
                        </th>
                        {role === 'admin' && <th className="px-6 py-3 font-semibold text-center">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center",
                                  t.type === 'income' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                                )}>
                                  {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                </div>
                                <span className="font-medium">{t.description}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                                {t.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-sm">
                              {format(parseISO(t.date), 'MMM dd, yyyy')}
                            </td>
                            <td className={cn(
                              "px-6 py-4 text-right font-bold",
                              t.type === 'income' ? "text-success" : "text-danger"
                            )}>
                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </td>
                            {role === 'admin' && (
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => handleEditTransaction(t)}
                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTransaction(t.id)}
                                    className="p-2 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={role === 'admin' ? 5 : 4} className="px-6 py-12 text-center text-slate-400">
                            <div className="flex flex-col items-center gap-2">
                              <Search size={48} strokeWidth={1} />
                              <p>No transactions found matching your criteria</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div 
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-lg font-bold mb-4">Top Spending Category</h3>
                  {insights.highestExpense ? (
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                        <PieChartIcon size={32} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{insights.highestExpense.name}</div>
                        <div className="text-slate-500">Total spent: {formatCurrency(insights.highestExpense.value)}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400">No expense data available</p>
                  )}
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-bold mb-4">Monthly Comparison</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">This Month</div>
                      <div className="text-2xl font-bold">{formatCurrency(insights.monthlyComparison.current)}</div>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1",
                      insights.monthlyComparison.percentChange > 0 ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
                    )}>
                      {insights.monthlyComparison.percentChange > 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                      {Math.abs(insights.monthlyComparison.percentChange).toFixed(1)}%
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-500 mb-1">Last Month</div>
                      <div className="text-2xl font-bold">{formatCurrency(insights.monthlyComparison.last)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-bold mb-6">Income vs Expenses</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 12 }} />
                      <Tooltip 
                        cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#0f172a' : '#fff', 
                          border: isDarkMode ? '1px solid #1e293b' : 'none', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }} 
                        itemStyle={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold">{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Date</label>
                    <input 
                      required 
                      type="date" 
                      name="date" 
                      defaultValue={editingTransaction?.date || format(new Date(), 'yyyy-MM-dd')}
                      className="input" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Amount ($)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.01" 
                      name="amount" 
                      defaultValue={editingTransaction?.amount}
                      placeholder="0.00" 
                      className="input" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      "has-[:checked]:border-primary has-[:checked]:bg-primary/5 border-slate-100 dark:border-slate-800"
                    )}>
                      <input type="radio" name="type" value="income" defaultChecked={editingTransaction?.type !== 'expense'} className="hidden" />
                      <ArrowUpRight size={18} className="text-success" />
                      <span className="font-medium">Income</span>
                    </label>
                    <label className={cn(
                      "flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      "has-[:checked]:border-primary has-[:checked]:bg-primary/5 border-slate-100 dark:border-slate-800"
                    )}>
                      <input type="radio" name="type" value="expense" defaultChecked={editingTransaction?.type === 'expense'} className="hidden" />
                      <ArrowDownLeft size={18} className="text-danger" />
                      <span className="font-medium">Expense</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Category</label>
                  <select name="category" defaultValue={editingTransaction?.category || 'Other'} className="input">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500">Description</label>
                  <input 
                    required 
                    type="text" 
                    name="description" 
                    defaultValue={editingTransaction?.description}
                    placeholder="e.g. Monthly Rent" 
                    className="input" 
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingTransaction ? 'Save Changes' : 'Add Transaction'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
