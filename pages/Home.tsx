import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Plus, Wallet, TrendingUp, TrendingDown, ArrowRight, Eye, EyeOff, Pencil, FolderOpen } from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import { TransactionType, Transaction, Book } from '../types';
import { CURRENCIES } from '../constants';
import { formatIndianCurrency } from '../utils/format';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area, LineChart, Line
} from 'recharts';

type TimeRange = '1day' | '1week' | '1month' | '1year' | '3years' | '5years' | '10years';
type ChartType = 'graph' | 'candle';

const Home: React.FC = () => {
  const { currentProfile, books, transactions, categories, togglePrivacyMode } = useData();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1week');
  const [chartType, setChartType] = useState<ChartType>('candle');

  // Derive data
  const profileBookIds = useMemo(() => 
    books.filter(b => b.profileId === currentProfile?.id).map(b => b.id), 
    [books, currentProfile]
  );

  const profileTransactions = useMemo(() => 
    transactions
      .filter(t => profileBookIds.includes(t.bookId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, profileBookIds]
  );

  const totalIncome = useMemo(() => 
    profileTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0),
    [profileTransactions]
  );

  const totalExpense = useMemo(() => 
    profileTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0),
    [profileTransactions]
  );

  // Data for Charts
  const pieData = useMemo(() => {
    const data: {[key: string]: number} = {};
    profileTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(t => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Other';
        data[catName] = (data[catName] || 0) + t.amount;
      });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [profileTransactions, categories]);

  const trendData = useMemo(() => {
    const now = new Date();
    let dataPoints: { date: string, label: string, fullDate: string }[] = [];
    
    switch (timeRange) {
      case '1day':
        // Last 24 hours
        dataPoints = [...Array(24)].map((_, i) => {
          const d = new Date(now);
          d.setHours(d.getHours() - i);
          return {
            date: d.toISOString().split(':')[0], // YYYY-MM-DDTHH
            label: `${d.getHours()}:00`,
            fullDate: d.toISOString()
          };
        }).reverse();
        break;
      case '1week':
        dataPoints = [...Array(7)].map((_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          return {
            date: dateStr,
            label: d.toLocaleDateString(undefined, { weekday: 'short' }),
            fullDate: dateStr
          };
        }).reverse();
        break;
      case '1month':
        dataPoints = [...Array(30)].map((_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          return {
            date: dateStr,
            label: d.getDate().toString(),
            fullDate: dateStr
          };
        }).reverse();
        break;
      case '1year':
        dataPoints = [...Array(12)].map((_, i) => {
          const d = new Date(now);
          d.setMonth(d.getMonth() - i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return {
            date: dateStr,
            label: d.toLocaleDateString(undefined, { month: 'short' }),
            fullDate: dateStr
          };
        }).reverse();
        break;
      case '3years':
      case '5years':
      case '10years':
        const years = timeRange === '3years' ? 3 : timeRange === '5years' ? 5 : 10;
        dataPoints = [...Array(years)].map((_, i) => {
          const d = new Date(now);
          d.setFullYear(d.getFullYear() - i);
          const dateStr = d.getFullYear().toString();
          return {
            date: dateStr,
            label: dateStr,
            fullDate: dateStr
          };
        }).reverse();
        break;
    }

    return dataPoints.map(dp => {
      const dayTxs = profileTransactions.filter(t => t.date.startsWith(dp.date));
      return {
        name: dp.label,
        income: dayTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0),
        expense: dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0)
      };
    });
  }, [profileTransactions, timeRange]);

  const COLORS = ['#0ea5e9', '#ef4444', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#64748b'];
  const getBook = (id: string) => books.find(b => b.id === id);
  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'Other';

  const handleQuickAdd = () => {
    if(profileBookIds.length === 0) {
      showToast("Please create a book first to add transactions.", "error");
      return;
    }
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const isPrivacy = currentProfile?.isPrivacyMode;
  // Use Global Currency for total, or fall back to '₹'
  const globalSymbol = CURRENCIES.find(c => c.code === currentProfile?.currency)?.symbol || '₹';

  const maskMoney = (amount: number, symbol: string = globalSymbol) => 
    isPrivacy ? '****' : formatIndianCurrency(amount, symbol);

  const getBookBalance = (bookId: string) => {
    return transactions
      .filter(t => t.bookId === bookId)
      .reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0);
  };

  const myBooks = useMemo(() => 
    books.filter(b => b.profileId === currentProfile?.id),
    [books, currentProfile]
  );

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-2">
      {/* Total Balance Tile */}
      <div className="bg-white dark:bg-cardbg p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Balance</h2>
            <button onClick={togglePrivacyMode} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400">
              {isPrivacy ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button 
            onClick={handleQuickAdd}
            className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-90"
            title="Quick Add"
          >
            <Plus size={24} />
          </button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isPrivacy ? '****' : formatIndianCurrency(totalIncome - totalExpense, globalSymbol)}
        </h1>
        {/* Subtle background decoration */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-cardbg p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
            <TrendingUp size={16} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tighter">Income</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {maskMoney(totalIncome)}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-cardbg p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
            <TrendingDown size={16} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-tighter">Expenses</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {maskMoney(totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Books Tile */}
      <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">My Books</h3>
          <Link to="/books" className="text-xs text-primary-600 hover:underline">Manage</Link>
        </div>
        <div className="space-y-2">
          {myBooks.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No books created yet.</p>
          ) : (
            myBooks.slice(0, 3).map(book => {
              const balance = getBookBalance(book.id);
              const symbol = CURRENCIES.find(c => c.code === book.currency)?.symbol || '₹';
              return (
                <button 
                  key={book.id}
                  onClick={() => navigate(`/books?id=${book.id}`)}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${book.color} bg-opacity-10 text-primary-600 dark:text-primary-400`}>
                      <FolderOpen size={14} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600">{book.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {maskMoney(balance, symbol)}
                  </span>
                </button>
              );
            })
          )}
          {myBooks.length > 3 && (
            <button onClick={() => navigate('/books')} className="w-full text-center text-[10px] text-gray-400 hover:text-primary-500 pt-1">
              + {myBooks.length - 3} more books
            </button>
          )}
        </div>
      </div>

      {/* Recent Transactions Tile */}
      <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-3">
           <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Recent Transactions</h3>
           {profileTransactions.length > 5 && (
             <button onClick={() => navigate('/books')} className="text-xs text-primary-600 hover:underline">
               View All
             </button>
           )}
        </div>
        
        <div className="space-y-1">
           {profileTransactions.length === 0 ? (
             <div className="py-4 text-center text-xs text-gray-400">No transactions yet.</div>
           ) : (
             <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
               {profileTransactions.slice(0, 5).map(tx => {
                 const dateObj = new Date(tx.date);
                 const book = getBook(tx.bookId);
                 const symbol = CURRENCIES.find(c => c.code === book?.currency)?.symbol || '₹';
                 const formattedDate = dateObj.toLocaleDateString(undefined, { 
                   month: 'short', 
                   day: 'numeric', 
                   year: 'numeric' 
                 });
                 
                 const truncatedBookName = book?.name 
                   ? (book.name.length > 15 ? book.name.substring(0, 15) + '...' : book.name)
                   : 'Unknown';

                 return (
                 <div key={tx.id} className="py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group px-1 rounded-md">
                    <div className="flex items-center gap-2.5">
                       <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tx.type === TransactionType.INCOME ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-red-100 text-red-600 dark:bg-red-900/20'}`}>
                          <Wallet size={14} />
                       </div>
                       <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-none mb-0.5">{getCatName(tx.categoryId)}</p>
                          <p className="text-[10px] text-gray-500 truncate">
                             {truncatedBookName} • {formattedDate}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className={`text-xs ${tx.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-500 dark:text-red-400'}`}>
                           {tx.type === TransactionType.INCOME ? '+' : '-'}
                           {maskMoney(tx.amount, symbol)}
                        </span>
                        <button 
                          onClick={() => handleEditTransaction(tx)}
                          className="p-1 text-gray-400 hover:text-primary-600 transition-colors -mr-1"
                        >
                            <Pencil size={12} />
                        </button>
                    </div>
                 </div>
               )})}
             </div>
           )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trend Chart */}
          <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Trends</h3>
                <div className="flex gap-2">
                  <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                    className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="1day">1 Day</option>
                    <option value="1week">1 Week</option>
                    <option value="1month">1 Month</option>
                    <option value="1year">1 Year</option>
                    <option value="3years">3 Years</option>
                    <option value="5years">5 Years</option>
                    <option value="10years">10 Years</option>
                  </select>
                  <select 
                    value={chartType} 
                    onChange={(e) => setChartType(e.target.value as ChartType)}
                    className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="candle">Candle Chart</option>
                    <option value="graph">Graph Chart</option>
                  </select>
                </div>
             </div>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 {chartType === 'candle' ? (
                   <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" fontSize={10} stroke="#888" tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} stroke="#888" hide={isPrivacy} tickLine={false} axisLine={false} />
                      <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          formatter={(value: number) => isPrivacy ? '****' : value}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" barSize={timeRange === '1month' ? 4 : undefined} />
                      <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" barSize={timeRange === '1month' ? 4 : undefined} />
                   </BarChart>
                 ) : (
                   <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" fontSize={10} stroke="#888" tickLine={false} axisLine={false} />
                      <YAxis fontSize={10} stroke="#888" hide={isPrivacy} tickLine={false} axisLine={false} />
                      <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          formatter={(value: number) => isPrivacy ? '****' : value}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
                   </AreaChart>
                 )}
               </ResponsiveContainer>
             </div>
          </div>

          {/* Pie Chart - Categories */}
          {pieData.length > 0 && (
             <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Spending Breakdown</h3>
                  <span className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Expenses
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-48 w-48 relative flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                          formatter={(value: number) => isPrivacy ? '****' : formatIndianCurrency(value)}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Total</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {isPrivacy ? '****' : formatIndianCurrency(totalExpense)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-2.5">
                    {pieData.sort((a, b) => b.value - a.value).slice(0, 4).map((entry, index) => {
                      const percentage = ((entry.value / totalExpense) * 100).toFixed(0);
                      return (
                        <div key={entry.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{entry.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-400">{percentage}%</span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white min-w-[60px] text-right">
                              {maskMoney(entry.value)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {pieData.length > 4 && (
                      <p className="text-[10px] text-gray-400 text-center pt-1 italic">
                        + {pieData.length - 4} more categories
                      </p>
                    )}
                  </div>
                </div>
             </div>
          )}
      </div>

      <TransactionModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         editTransaction={editingTransaction}
      />
    </div>
  );
};

export default Home;