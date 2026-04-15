import React from 'react';
import { X } from 'lucide-react';
import TransactionForm from './TransactionForm';
import { Transaction } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedBookId?: string | null;
  editTransaction?: Transaction | null;
  title?: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  preSelectedBookId, 
  editTransaction, 
  title 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <TransactionForm 
          onClose={onClose}
          preSelectedBookId={preSelectedBookId}
          editTransaction={editTransaction}
          title={title}
        />
      </div>
    </div>
  );
};

export default TransactionModal;
