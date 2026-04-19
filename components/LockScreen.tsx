import React, { useState, useEffect } from 'react';
import { Lock, Delete, ChevronLeft } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'motion/react';

const LockScreen: React.FC = () => {
  const { currentProfile, unlockApp } = useData();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        const success = unlockApp(newPin);
        if (!success) {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 1000);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-cardbg flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600 dark:text-primary-400 shadow-inner">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">App Locked</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Enter PIN to unlock {currentProfile?.name}</p>
      </motion.div>

      <div className="space-y-8 w-full max-w-xs">
        {/* PIN Indicators */}
        <div className="flex justify-center gap-6">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > i 
                  ? 'bg-primary-500 border-primary-500 scale-125' 
                  : 'border-gray-300 dark:border-gray-700'
              } ${error ? 'border-red-500 bg-red-500' : ''}`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="w-full aspect-square rounded-full flex items-center justify-center text-2xl font-bold text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
            >
              {num}
            </button>
          ))}
          <div className="w-full aspect-square" />
          <button
            onClick={() => handleKeyPress('0')}
            className="w-full aspect-square rounded-full flex items-center justify-center text-2xl font-bold text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-full aspect-square rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Delete size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
