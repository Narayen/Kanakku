import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { TransactionType } from '../types';
import { CURRENCIES } from '../constants';
import { formatIndianCurrency } from '../utils/format';
import { Eye, EyeOff } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  AreaChart, Area
} from 'recharts';

type TimeRange = '1day' | '1week' | '1month' | '1year' | '3years' | '5years' | '10years';
type ChartType = 'graph' | 'candle';

const Analytics: React.FC = () => {
  const { currentProfile, books, transactions, categories, togglePrivacyMode } = useData();
  const [timeRange, setTimeRange] = useState<TimeRange>('1week');
  const [chartType, setChartType] = useState<ChartType>('candle');

  const profileBookIds = useMemo(() => 
    books.filter(b => b.profileId === currentProfile?.id).map(b => b.id), 
    [books, currentProfile]
  );

  const profileTransactions = useMemo(() => 
    transactions
      .filter(t => profileBookIds.includes(t.bookId))
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      }),
    [transactions, profileBookIds]
  );

  const totalExpense = useMemo(() => 
    profileTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [profileTransactions]
  );

  const pieData = useMemo(() => {
    const data: {[key: string]: number} = {};
    if (!profileTransactions || !Array.isArray(profileTransactions)) return [];
    
    profileTransactions
      .filter(t => t && t.type === TransactionType.EXPENSE)
      .forEach(t => {
        const catName = categories.find(c => c.id === t.categoryId)?.name || 'Other';
        data[catName] = (data[catName] || 0) + (Number(t.amount) || 0);
      });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [profileTransactions, categories]);

  const trendData = useMemo(() => {
    const now = new Date();
    let dataPoints: { date: string, label: string, fullDate: string }[] = [];
    
    switch (timeRange) {
      case '1day':
        dataPoints = [...Array(24)].map((_, i) => {
          const d = new Date(now);
          d.setHours(d.getHours() - i);
          return {
            date: d.toISOString().split(':')[0],
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
      const dayTxs = profileTransactions.filter(t => t.date && typeof t.date === 'string' && t.date.startsWith(dp.date));
      return {
        name: dp.label,
        income: dayTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
        expense: dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      };
    });
  }, [profileTransactions, timeRange]);

  const COLORS = ['#0ea5e9', '#ef4444', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#64748b'];
  const isPrivacy = currentProfile?.isPrivacyMode;
  const globalSymbol = CURRENCIES.find(c => c.code === currentProfile?.currency)?.symbol || '₹';

  const tagData = useMemo(() => {
    const data: {[key: string]: number} = {};
    profileTransactions
      .filter(t => t.type === TransactionType.EXPENSE && t.tags && t.tags.length > 0)
      .forEach(t => {
        t.tags?.forEach(tag => {
          data[tag] = (data[tag] || 0) + (Number(t.amount) || 0);
        });
      });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [profileTransactions]);

  const maskMoney = (amount: number, symbol: string = globalSymbol) => 
    isPrivacy ? '****' : formatIndianCurrency(amount, symbol);

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-2 pb-20">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <button onClick={togglePrivacyMode} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400">
            {isPrivacy ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Pie Chart - Categories */}
      {pieData.length > 0 ? (
        <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Spendings Breakdown</h3>
            <span className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              By Category
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

            <div className="flex-1 w-full space-y-2">
              {pieData.slice(0, 5).map((entry, index) => {
                const percentage = totalExpense > 0 ? ((entry.value / totalExpense) * 100).toFixed(0) : '0';
                return (
                  <div key={entry.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400">{percentage}%</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white min-w-[60px] text-right">
                        {maskMoney(entry.value)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {pieData.length > 5 && (
                <p className="text-[10px] text-gray-400 text-center pt-1 italic">
                  + {pieData.length - 5} more categories
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-cardbg p-10 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">No expense data available for the breakdown.</p>
        </div>
      )}

      {/* Tag Analysis */}
      {tagData.length > 0 && (
        <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Tag spending Analysis</h3>
            <span className="text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              By Tags
            </span>
          </div>
          <div className="space-y-3">
            {tagData.slice(0, 6).map((tag) => {
              const maxVal = tagData[0].value;
              const width = (tag.value / maxVal) * 100;
              return (
                <div key={tag.name} className="space-y-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">#{tag.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{maskMoney(tag.value)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full transition-all duration-500" 
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {tagData.length > 6 && (
              <p className="text-[10px] text-gray-400 text-center pt-1 italic">
                Showing top 6 tags
              </p>
            )}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      <div className="bg-white dark:bg-cardbg p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Trends</h3>
          <div className="flex gap-2">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="text-[10px] font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-600 dark:text-gray-400"
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
              className="text-[10px] font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-gray-600 dark:text-gray-400"
            >
              <option value="candle">Candle</option>
              <option value="graph">Graph</option>
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
                  formatter={(value: number) => isPrivacy ? '****' : formatIndianCurrency(value)}
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
                  formatter={(value: number) => isPrivacy ? '****' : formatIndianCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
