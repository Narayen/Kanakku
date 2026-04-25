import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Repeat, Info, ChevronDown, Play, Pause, Trash2, Tag, Plus, CircleHelp } from 'lucide-react';
import * as Icons from 'lucide-react';
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
  const { categories, addAutopay, updateAutopay, tagHistory, addTagsToHistory, removeFromTagHistory } = useData();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [frequency, setFrequency] = useState<AutopayFrequency>(AutopayFrequency.MONTHLY);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('00:00');

  useEffect(() => {
    if (editAutopay) {
      setAmount(editAutopay.amount.toString());
      setType(editAutopay.type);
      setCategoryId(editAutopay.categoryId);
      setNote(editAutopay.note || '');
      setSelectedTags(editAutopay.tags || []);
      setFrequency(editAutopay.frequency);
      setStartDate(editAutopay.startDate);
      setStartTime(editAutopay.startTime || '00:00');
    } else {
      setAmount('');
      setType(TransactionType.EXPENSE);
      setNote('');
      setSelectedTags([]);
      setFrequency(AutopayFrequency.MONTHLY);
      setStartDate(new Date().toISOString().split('T')[0]);
      setStartTime('00:00');
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
  }, [editAutopay, categories, isOpen]);

  const handleAddTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
      setTagInput('');
    }
  }, [selectedTags]);

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId || !startDate) return;

    if (selectedTags.length > 0) {
      addTagsToHistory(selectedTags);
    }

    const autopayData = {
      bookId,
      amount: parseFloat(amount),
      type,
      categoryId,
      note,
      tags: selectedTags,
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

  const renderIcon = (iconName: string) => {
    try {
      const LucideIcon = (Icons as any)[iconName] || CircleHelp;
      return <LucideIcon size={16} />;
    } catch (e) {
      return <CircleHelp size={16} />;
    }
  };

  if (!isOpen) return null;

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
                  className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white min-w-[60px]"
                />
                {tagInput.trim() && (
                  <button 
                    type="button" 
                    onClick={() => handleAddTag(tagInput)}
                    className="p-1 text-primary-600 hover:bg-primary-100 rounded-md transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
            </div>

            {tagHistory.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                {tagHistory.map(tag => (
                  <div key={tag} className="group flex items-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full pl-2.5 pr-1 py-1 transition-all">
                    <button 
                      type="button" 
                      onClick={() => handleAddTag(tag)}
                      className={`text-xs font-medium transition-colors ${selectedTags.includes(tag) ? 'text-primary-500' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      {tag}
                    </button>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromTagHistory(tag);
                      }}
                      className="ml-1 p-0.5 text-gray-400 hover:text-red-500 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                    categoryId === cat.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-transparent bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className={`${cat.color} bg-opacity-10 dark:bg-opacity-20 p-1.5 rounded-lg mb-1`}>
                    {renderIcon(cat.icon)}
                  </div>
                  <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400 truncate w-full text-center px-1">
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
                  <option value={AutopayFrequency.BI_WEEKLY}>Bi-Weekly</option>
                  <option value={AutopayFrequency.MONTHLY}>Monthly</option>
                  <option value={AutopayFrequency.BI_MONTHLY}>Bi-Monthly</option>
                  <option value={AutopayFrequency.QUARTERLY}>Quarterly</option>
                  <option value={AutopayFrequency.HALF_YEARLY}>Half Yearly</option>
                  <option value={AutopayFrequency.YEARLY}>Yearly</option>
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
