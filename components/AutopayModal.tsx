import React, { useState, useEffect } from 'react';
import { X, Calendar, Repeat, Info, ChevronDown, Play, Pause, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { TransactionType, AutopayFrequency, Category, Autopay } from '../types';
import { TEXT_COLORS } from '../constants';

interface AutopayModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  editAutopay?: Autopay | null;
}

const AutopayModal: React.FC<AutopayModalProps> = ({ isOpen, onClose, bookId, editAutopay }) => {
  const { categories, addAutopay, updateAutopay } = useData();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState<AutopayFrequency>(AutopayFrequency.MONTHLY);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('00:00');

  useEffect(() => {
    if (editAutopay) {
      setAmount(editAutopay.amount.toString());
      setType(editAutopay.type);
      setCategoryId(editAutopay.categoryId);
      setNote(editAutopay.note || '');
      setFrequency(editAutopay.frequency);
      setStartDate(editAutopay.startDate);
      setStartTime(editAutopay.startTime || '00:00');
    } else {
      setAmount('');
      setType(TransactionType.EXPENSE);
      setNote('');
      setFrequency(AutopayFrequency.MONTHLY);
      setStartDate(new Date().toISOString().split('T')[0]);
      setStartTime('00:00');
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
  }, [editAutopay, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !startDate) return;

    const autopayData = {
      bookId,
      amount: parseFloat(amount),
      type,
      categoryId,
      note,
      frequency,
      startDate,
      startTime,
    };

    if (editAutopay) {
      updateAutopay(editAutopay.id, autopayData);
    } else {
      addAutopay(autopayData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-cardbg w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
        <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editAutopay ? 'Edit Autopay' : 'Setup Autopay'}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{editAutopay ? 'Modify your recurring transaction' : 'Automate your recurring transactions'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Amount</label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-4 text-2xl font-bold dark:text-white focus:ring-2 focus:ring-primary-500 transition-all placeholder:text-gray-300"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Type Toggle */}
          <div className="flex bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                type === TransactionType.EXPENSE
                  ? 'bg-white dark:bg-gray-700 text-red-500 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                type === TransactionType.INCOME
                  ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              Income
            </button>
          </div>

          {/* Category Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                    categoryId === cat.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-transparent bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className={`${cat.color} mb-1`}>
                    <div className="w-5 h-5 flex items-center justify-center">
                       <Repeat size={16} />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate w-full text-center">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Frequency */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Frequency</label>
              <div className="relative">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as AutopayFrequency)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm dark:text-white appearance-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={AutopayFrequency.DAILY}>Daily</option>
                  <option value={AutopayFrequency.WEEKLY}>Weekly</option>
                  <option value={AutopayFrequency.MONTHLY}>Monthly</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Note (Optional)</label>
            <input
              type="text"
              placeholder="What is this for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3 text-sm dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95 mt-4"
          >
            {editAutopay ? 'Update Autopay' : 'Create Autopay'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AutopayModal;
