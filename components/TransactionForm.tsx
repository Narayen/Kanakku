import React, { useState, useEffect } from 'react';
import { X, Calendar, Check, Clock, Trash2, AlertCircle, CircleHelp, Tag, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { TransactionType, Transaction } from '../types';
import { CURRENCIES } from '../constants';
import * as Icons from 'lucide-react';

interface TransactionFormProps {
  onClose: () => void;
  preSelectedBookId?: string | null;
  editTransaction?: Transaction | null;
  title?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, preSelectedBookId, editTransaction, title }) => {
  const { 
    books, categories, addTransaction, updateTransaction, 
    deleteTransaction, currentProfile, tagHistory, 
    addTagsToHistory, removeFromTagHistory 
  } = useData();
  const { showToast } = useToast();
  
  // State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [bookId, setBookId] = useState(preSelectedBookId || '');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter books for current profile
  const myBooks = books.filter(b => b.profileId === currentProfile?.id);

  // Initialize form
  useEffect(() => {
    setShowDeleteConfirm(false);
    if (editTransaction) {
      // Edit Mode
      setBookId(editTransaction.bookId || '');
      setAmount(editTransaction.amount?.toString() || '');
      setType(editTransaction.type || TransactionType.EXPENSE);
      setCategoryId(editTransaction.categoryId || '');
      setNote(editTransaction.note || '');
      setSelectedTags(editTransaction.tags || []);
      
      try {
        const dateObj = new Date(editTransaction.date || Date.now());
        if (isNaN(dateObj.getTime())) throw new Error("Invalid date");
        
        // Use local date methods to avoid timezone shifts
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        
        setDate(`${year}-${month}-${day}`);
        setTime(`${hours}:${minutes}`);
      } catch (e) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        setDate(`${year}-${month}-${day}`);
        setTime(`${hours}:${minutes}`);
      }
    } else {
      // Add Mode
      if (preSelectedBookId) setBookId(preSelectedBookId);
      else if (myBooks.length > 0) setBookId(myBooks[0].id);
      
      if (categories.length > 0) {
        // Try to find a sensible default category or just pick the first
        setCategoryId(categories[0].id);
      }
      setAmount('');
      setNote('');
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      setDate(`${year}-${month}-${day}`);
      setTime(`${hours}:${minutes}`);
      setType(TransactionType.EXPENSE);
      setSelectedTags([]);
      setTagInput('');
    }
  }, [editTransaction, preSelectedBookId, currentProfile, categories]);

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed.length > 30) return;
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tagToRemove));
  };

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
        time,
        note,
        tags: selectedTags
       });
       addTagsToHistory(selectedTags);
       showToast("Transaction updated successfully", "success");
    } else {
       addTransaction({
        bookId,
        amount: parseFloat(amount),
        type,
        categoryId,
        date: dateTime,
        time,
        note,
        tags: selectedTags
      });
      addTagsToHistory(selectedTags);
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
    if (!iconName) return <CircleHelp size={20} />;
    try {
      const LucideIcon = (Icons as any)[iconName];
      if (typeof LucideIcon === 'function' || (typeof LucideIcon === 'object' && LucideIcon !== null)) {
        return <LucideIcon size={20} />;
      }
      return <CircleHelp size={20} />;
    } catch (e) {
      return <CircleHelp size={20} />;
    }
  };

  return (
    <div className="bg-white dark:bg-cardbg rounded-2xl shadow-xl border border-primary-100 dark:border-primary-900 animate-in fade-in slide-in-from-top-2 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest">
           {title || (editTransaction ? 'Edit Transaction' : 'Add Transaction')}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        
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
              required
            />
          </div>
        </div>

        {/* Book Selection */}
        {(!preSelectedBookId || editTransaction) && (
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Select Book</label>
            <div className="relative">
              <select 
                value={bookId} 
                onChange={(e) => setBookId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-primary-500 transition-all"
                required
              >
                {myBooks.map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                 <Icons.ChevronDown size={16} />
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Tags (Optional)</label>
          
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <div className="flex flex-wrap gap-2 min-h-[44px] bg-gray-50 dark:bg-gray-800 rounded-xl pl-10 pr-4 py-2 border-2 border-transparent focus-within:border-primary-500 transition-all">
              {selectedTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-lg text-xs font-medium">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-primary-900 dark:hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input 
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder={selectedTags.length === 0 ? "Add tags..." : ""}
                className={`flex-1 bg-transparent border-none outline-none text-sm min-w-[60px] ${tagInput.length > 30 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}
              />
              {tagInput.trim() && tagInput.length <= 30 && (
                <button 
                  type="button" 
                  onClick={() => handleAddTag(tagInput)}
                  className="p-1 text-primary-600 hover:bg-primary-100 rounded-md transition-colors"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            {tagInput.length > 30 && (
              <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1">
                <AlertCircle size={10} />
                Error: Tag cannot exceed 30 characters
              </p>
            )}
          </div>

          {tagHistory.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
              {tagHistory.map(tag => (
                <button 
                  key={tag}
                  type="button" 
                  onClick={() => handleAddTag(tag)}
                  className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedTags.includes(tag) ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Category</label>
          <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
            {(categories || []).filter(Boolean).map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`flex flex-col items-center p-2 rounded-xl border transition-all ${categoryId === cat.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <div className={`mb-1 ${cat.color} bg-opacity-10 dark:bg-opacity-20 p-1.5 rounded-lg`}>
                   {renderIcon(cat.icon)}
                </div>
                <span className="text-[9px] font-medium text-center dark:text-gray-300 truncate w-full px-1">{cat.name}</span>
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
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Note (Optional)</label>
          <input 
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Lunch with client"
            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all text-sm"
          />
        </div>

        {/* Actions */}
        <div className="pt-2">
          {showDeleteConfirm ? (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest px-1">
                <AlertCircle size={16} />
                <span>Confirm Delete?</span>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-white dark:bg-cardbg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95"
                >
                  Delete
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
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Check size={20} />
                {editTransaction ? 'Update' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
