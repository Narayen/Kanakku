import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, Clock, Trash2, AlertCircle, CircleHelp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { TransactionType, Transaction } from '../types';
import { CURRENCIES } from '../constants';
import * as Icons from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedBookId?: string;
  editTransaction?: Transaction | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, preSelectedBookId, editTransaction }) => {
  const { books, categories, addTransaction, updateTransaction, deleteTransaction, currentProfile } = useData();
  const { showToast } = useToast();
  
  // State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [bookId, setBookId] = useState(preSelectedBookId || '');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter books for current profile
  const myBooks = books.filter(b => b.profileId === currentProfile?.id);

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      if (editTransaction) {
        // Edit Mode
        setBookId(editTransaction.bookId);
        setAmount(editTransaction.amount.toString());
        setType(editTransaction.type);
        setCategoryId(editTransaction.categoryId);
        setNote(editTransaction.note || '');
        const dateObj = new Date(editTransaction.date);
        setDate(dateObj.toISOString().split('T')[0]);
        setTime(dateObj.toTimeString().slice(0, 5));
      } else {
        // Add Mode
        if (preSelectedBookId) setBookId(preSelectedBookId);
        else if (myBooks.length > 0) setBookId(myBooks[0].id);
        
        if (categories.length > 0) setCategoryId(categories[0].id);
        setAmount('');
        setNote('');
        const now = new Date();
        setDate(now.toISOString().split('T')[0]);
        setTime(now.toTimeString().slice(0, 5)); // HH:MM
        setType(TransactionType.EXPENSE);
      }
    }
  }, [isOpen, editTransaction, preSelectedBookId, currentProfile, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !bookId || !categoryId || !date || !time) {
      showToast("Please fill all required fields", "error");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0.01) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    let dateTime: string;
    try {
      const dt = new Date(`${date}T${time}:00`);
      if (isNaN(dt.getTime())) throw new Error("Invalid date");
      dateTime = dt.toISOString();
    } catch (e) {
      showToast("Invalid date or time", "error");
      return;
    }

    if (editTransaction) {
       updateTransaction(editTransaction.id, {
        bookId,
        amount: parseFloat(amount),
        type,
        categoryId,
        date: dateTime,
        note
       });
       showToast("Transaction updated successfully", "success");
    } else {
       addTransaction({
        bookId,
        amount: parseFloat(amount),
        type,
        categoryId,
        date: dateTime,
        note
      });
      showToast("Transaction added successfully", "success");
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (editTransaction) {
      deleteTransaction(editTransaction.id);
      showToast("Transaction deleted successfully", "info");
      onClose();
    }
  };

  const selectedBook = myBooks.find(b => b.id === bookId);
  const currencyInfo = CURRENCIES.find(c => c.code === selectedBook?.currency) || { symbol: '₹', code: 'INR' };
  
  // Render Icon helper
  const renderIcon = (iconName: string) => {
    try {
      const LucideIcon = (Icons as any)[iconName] || CircleHelp;
      return <LucideIcon size={20} />;
    } catch (e) {
      return <CircleHelp size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-cardbg w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold dark:text-white">
             {editTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Amount & Type Toggle */}
          <div>
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-cardbg text-red-500 shadow-sm' : 'text-gray-500'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white dark:bg-cardbg text-green-500 shadow-sm' : 'text-gray-500'}`}
              >
                Income
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                {currencyInfo.symbol}
              </span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" 
                step="0.01"
                min="0.01"
                className="w-full pl-10 pr-4 py-4 text-3xl font-bold bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 outline-none text-gray-900 dark:text-white placeholder-gray-300"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Book Selection */}
          {(!preSelectedBookId || editTransaction) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Book</label>
              <select 
                value={bookId} 
                onChange={(e) => setBookId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                required
              >
                {myBooks.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>
                ))}
              </select>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center p-2 rounded-xl border ${categoryId === cat.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <div className={`mb-1 ${cat.color}`}>
                     {renderIcon(cat.icon)}
                  </div>
                  <span className="text-[10px] text-center dark:text-gray-300 truncate w-full px-1">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex gap-3">
             <div className="flex-1">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Date</label>
                 <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
                    <input 
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                 </div>
             </div>
             <div className="flex-1">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Time</label>
                 <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
                    <input 
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                 </div>
             </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
            <input 
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Lunch with client"
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {showDeleteConfirm ? (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium px-1">
                <AlertCircle size={16} />
                <span>Are you sure you want to delete?</span>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white dark:bg-cardbg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              {editTransaction && (
                <button 
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95"
                  title="Delete Transaction"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button 
                onClick={handleSubmit}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Check size={20} />
                {editTransaction ? 'Update Transaction' : 'Save Transaction'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;