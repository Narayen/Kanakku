import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import * as XLSX from 'xlsx';
import { 
  Moon, Sun, Monitor, Cloud, User, Download, Upload, FileText, CheckCircle, 
  ChevronUp, ChevronDown, Trash2, Globe, Layers, AlertTriangle, Plus, X, Settings as SettingsIcon, Edit2, Check, CircleHelp, Book as BookIcon, Shield, Lock, Fingerprint
} from 'lucide-react';
import { 
  CURRENCIES, PROFILE_ICONS, CATEGORY_ICONS, TEXT_COLORS, TEXT_COLOR_NAMES
} from '../constants';
import * as Icons from 'lucide-react';

const Settings: React.FC = () => {
  const { 
    profiles, 
    currentProfile, 
    books,
    updateProfileSettings, 
    switchProfile, 
    addProfile,
    deleteProfile,
    toggleBookSelection,
    categories,
    addCategory,
    deleteCategory,
    isCategoryUsed,
    reorderCategories,
    resetAllData,
    exportData,
    importData,
    downloadTemplate,
    initGoogleDrive,
    signInToGoogle,
    signOutFromGoogle,
    syncWithDrive,
    setAppPin,
    disableAppPin,
    lockApp,
    toggleBiometric,
    isBiometricSupported
  } = useData();
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security State
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinDraft, setPinDraft] = useState('');
  const [showDisablePinConfirm, setShowDisablePinConfirm] = useState(false);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');
  const [newCatColor, setNewCatColor] = useState(TEXT_COLORS[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Profile Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(currentProfile?.name || '');

  // Reset State
  const [resetConfirmCount, setResetConfirmCount] = useState(0);
  const [showFinalResetConfirm, setShowFinalResetConfirm] = useState(false);
  const [showProfileDeleteConfirm, setShowProfileDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState(false);

  useEffect(() => {
    if(currentProfile) {
      setEditingName(currentProfile.name);
    }
  }, [currentProfile]);

  const handleUpdateProfileName = (e: React.FormEvent) => {
    e.preventDefault();
    if(currentProfile && editingName.trim()) {
      updateProfileSettings(currentProfile.id, { name: editingName });
      setIsEditingName(false);
      showToast("Profile name updated", "success");
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    if (currentProfile) {
      updateProfileSettings(currentProfile.id, { themePreference: theme });
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await syncWithDrive();
    setIsSyncing(false);
    setLastSyncTime(new Date().toLocaleTimeString());
    showToast("Sync completed", "success");
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if(newProfileName.trim()){
      addProfile(newProfileName);
      setNewProfileName('');
      showToast("Profile created", "success");
    }
  };

  const handleDeleteProfile = () => {
      if(currentProfile && profiles.length > 1) {
          deleteProfile(currentProfile.id);
          setShowProfileDeleteConfirm(false);
          showToast("Profile deleted", "info");
      } else {
          showToast("Cannot delete the only profile", "error");
      }
  };

  const handleAddCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if(newCatName.trim()) {
          if (editingCategoryId) {
              updateCategory(editingCategoryId, { 
                  name: newCatName, 
                  icon: newCatIcon, 
                  color: newCatColor 
              });
              setEditingCategoryId(null);
              showToast("Category updated", "success");
          } else {
              addCategory({ name: newCatName, icon: newCatIcon, color: newCatColor });
              showToast("Category added", "success");
          }
          setNewCatName('');
      }
  };

  const handleEditCategory = (cat: any) => {
      setEditingCategoryId(cat.id);
      setNewCatName(cat.name);
      setNewCatIcon(cat.icon);
      setNewCatColor(cat.color);
      // Scroll to form
      document.getElementById('category-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteCategory = (id: string) => {
      if (id === 'cat_other') {
          showToast("Default category 'Others' cannot be deleted", "error");
          return;
      }

      if (isCategoryUsed(id)) {
          setCategoryToDelete(id);
          setShowCategoryDeleteConfirm(true);
      } else {
          deleteCategory(id);
          showToast("Category deleted", "success");
      }
  };

  const confirmDeleteCategory = () => {
      if (categoryToDelete) {
          deleteCategory(categoryToDelete);
          setCategoryToDelete(null);
          setShowCategoryDeleteConfirm(false);
          showToast("Category deleted and transactions updated", "success");
      }
  };

  const handleFactoryReset = () => {
      if(resetConfirmCount === 0) {
          setResetConfirmCount(1);
      } else if (resetConfirmCount === 1) {
          setResetConfirmCount(2);
      } else {
          setShowFinalResetConfirm(true);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = async (event) => {
      try {
        let data: any[] = [];
        if (isExcel) {
          const bstr = event.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          data = XLSX.utils.sheet_to_json(ws);
        } else {
          const text = event.target?.result as string;
          // We can still use importData for CSV, but let's make it more flexible
          const result = await importData(text);
          setImportStatus(result.message);
          return;
        }

        // For Excel data, we need a way to pass the parsed objects to importData
        // Let's update importData to accept either string or objects
        const result = await importData(data);
        setImportStatus(result.message);
      } catch (error) {
        setImportStatus("Failed to parse file");
      }
      setTimeout(() => setImportStatus(''), 5000);
    };

    if (isExcel) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
      const newCategories = [...categories];
      const othersIndex = newCategories.findIndex(c => c.id === 'cat_other');
      
      if (direction === 'up' && index > 0) {
          // Cannot move anything above index 0
          [newCategories[index], newCategories[index - 1]] = [newCategories[index - 1], newCategories[index]];
      } else if (direction === 'down' && index < newCategories.length - 1) {
          // If moving down, ensure we don't move past 'Others'
          if (othersIndex !== -1 && index === othersIndex - 1) return;
          if (index === othersIndex) return; // Cannot move 'Others' down
          
          [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
      }
      reorderCategories(newCategories);
  };

  const handleSetPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinDraft.length === 4) {
      setAppPin(pinDraft);
      setIsSettingPin(false);
      setPinDraft('');
      showToast("Security PIN enabled", "success");
    } else {
      showToast("PIN must be 4 digits", "error");
    }
  };

  if (!currentProfile) return null;

  // Render Icon helper
  const renderIcon = (iconName: string, size = 20, className = "") => {
    try {
      const LucideIcon = (Icons as any)[iconName] || CircleHelp;
      return <LucideIcon size={size} className={className} />;
    } catch (e) {
      return <CircleHelp size={size} className={className} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500">
          <SettingsIcon size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
      </div>

      {/* Profile Section */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <User className="text-primary-500" size={14} /> Profiles
        </h3>
        
        {/* Profile Switcher */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => switchProfile(p.id)}
              className={`flex-shrink-0 px-5 py-2 rounded-full border text-sm font-medium transition-colors flex items-center gap-2 ${p.id === currentProfile.id ? 'bg-primary-600 border-primary-600 text-white' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              {renderIcon(p.icon || 'User', 16)}
              {p.name}
            </button>
          ))}
        </div>

        {/* Create Profile */}
        <form onSubmit={handleCreateProfile} className="flex gap-2 mb-6">
           <input 
             type="text" 
             value={newProfileName}
             onChange={e => setNewProfileName(e.target.value)}
             placeholder="New profile name..."
             className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2.5 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
           />
           <button 
             type="submit" 
             disabled={!newProfileName} 
             className="bg-primary-600 hover:bg-primary-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 active:scale-95"
             title="Create Profile"
           >
             <Plus size={20} />
           </button>
        </form>

        {/* Current Profile Settings */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest">Current Profile Settings</h4>
            
            {/* Profile Name Editing */}
            <div className="mb-6">
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest ml-1">Profile Name</label>
                {isEditingName ? (
                  <form onSubmit={handleUpdateProfileName} className="flex gap-2">
                    <input 
                      type="text" 
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                      autoFocus
                    />
                    <button 
                      type="submit" 
                      className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                      title="Save"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setIsEditingName(false); setEditingName(currentProfile.name); }} 
                      className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                    <span className="text-gray-900 dark:text-white font-medium">{currentProfile.name}</span>
                    <button 
                      onClick={() => setIsEditingName(true)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                )}
            </div>

            {/* Icon Picker */}
            <div className="mb-6">
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest ml-1">Profile Icon</label>
                <div className="flex flex-wrap gap-2">
                    {PROFILE_ICONS.map(icon => (
                        <button
                            key={icon}
                            onClick={() => updateProfileSettings(currentProfile.id, { icon })}
                            className={`p-2 rounded-lg transition-all ${currentProfile.icon === icon ? 'bg-primary-100 dark:bg-primary-900 text-primary-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            {renderIcon(icon, 20)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Global Currency */}
            <div className="mb-6">
                 <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Globe size={14} /> Global Currency (Default)
                 </label>
                 <div className="relative">
                    <select 
                        value={currentProfile.currency || 'INR'}
                        onChange={(e) => updateProfileSettings(currentProfile.id, { currency: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 dark:text-white appearance-none"
                    >
                        {CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>
                                {c.flag} {c.code} - {c.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                 </div>
                 <p className="text-xs text-gray-500 mt-1">Used for Total Balance and new books.</p>
            </div>

            {/* Delete Profile */}
            {profiles.length > 1 && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={() => setShowProfileDeleteConfirm(true)}
                        className="text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} /> Delete Current Profile
                    </button>
                </div>
            )}
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <Shield className="text-primary-500" size={14} /> Security
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${currentProfile.isSecurityEnabled ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                <Lock size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">App PIN Lock</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Require PIN when opening the app</p>
              </div>
            </div>
            
            {currentProfile.isSecurityEnabled ? (
              <div className="flex gap-2">
                <button 
                  onClick={lockApp}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all active:scale-95"
                >
                  Lock Now
                </button>
                <button 
                  onClick={() => setShowDisablePinConfirm(true)}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-95"
                >
                  Disable
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSettingPin(true)}
                className="px-4 py-2 bg-primary-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95"
              >
                Enable
              </button>
            )}
          </div>

          {isSettingPin && (
            <div className="p-5 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/20 animate-in slide-in-from-top-2">
              <h4 className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-3 ml-1">Setup 4-Digit PIN</h4>
              <form onSubmit={handleSetPin} className="flex flex-col gap-4">
                <input 
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pinDraft}
                  onChange={e => setPinDraft(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Four digits"
                  className="w-full bg-white dark:bg-gray-800 border-2 border-primary-200 dark:border-primary-800 rounded-xl px-4 py-3 text-2xl font-bold tracking-[0.5em] text-center dark:text-white focus:outline-none focus:border-primary-500 placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => { setIsSettingPin(false); setPinDraft(''); }}
                    className="flex-1 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={pinDraft.length !== 4}
                    className="flex-[2] py-3 bg-primary-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary-500/20 disabled:opacity-50 whitespace-nowrap px-2 flex items-center justify-center p-2"
                  >
                    Confirm & Enable
                  </button>
                </div>
              </form>
            </div>
          )}

          {showDisablePinConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-cardbg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="animate-pulse" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Disable Pin?</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    This will remove the security requirement when opening the app. Your data will be accessible without a PIN.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowDisablePinConfirm(false)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => { disableAppPin(); setShowDisablePinConfirm(false); showToast("Security PIN disabled", "info"); }}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all active:scale-95"
                    >
                      Disable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Biometric Toggle */}
        {(isBiometricSupported || currentProfile.isBiometricEnabled) && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${currentProfile.isBiometricEnabled ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                  <Fingerprint size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Biometric Unlock</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Unlock with fingerprint or face ID</p>
                </div>
              </div>
              
              <button 
                onClick={toggleBiometric}
                className={`w-12 h-6 rounded-full transition-all relative ${currentProfile.isBiometricEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${currentProfile.isBiometricEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Book Selection Section */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <BookIcon className="text-emerald-500" size={14} /> Balance Calculation
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
          Select the books to include in your total balance, income, and expense summaries on the home screen.
        </p>
        
        <div className="space-y-2">
          {books.filter(b => b.profileId === currentProfile.id).map(book => {
            const isSelected = currentProfile.selectedBookIds?.includes(book.id);
            const isCurrencyMatch = book.currency === currentProfile.currency;
            
            return (
              <div key={book.id} className="space-y-1">
                <button
                  disabled={!isCurrencyMatch}
                  onClick={() => toggleBookSelection(book.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'} ${!isCurrencyMatch ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'}`}>
                      {isSelected && <Check size={12} strokeWidth={4} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${book.color}`}></div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-600 dark:text-gray-400'}`}>
                        {book.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {isSelected ? 'Included' : 'Excluded'}
                    </span>
                    <span className="text-[8px] text-gray-500 font-medium">{book.currency}</span>
                  </div>
                </button>
                {!isCurrencyMatch && (
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium px-2 flex items-center gap-1">
                    <AlertTriangle size={10} /> Cannot select: Currency mismatch with global ({currentProfile.currency})
                  </p>
                )}
              </div>
            );
          })}
          {books.filter(b => b.profileId === currentProfile.id).length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No books created yet.</p>
          )}
        </div>
      </section>

      {/* Profile Delete Confirmation Modal */}
      {showProfileDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-cardbg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Profile?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete <b>{currentProfile.name}</b>? All associated books and transactions will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowProfileDeleteConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteProfile}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all active:scale-95"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Modal */}
      {showCategoryDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-cardbg w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Category in Use</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                This category is currently being used in some transactions. If you delete it, those transactions will be moved to the <b>"Others"</b> category.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                      setShowCategoryDeleteConfirm(false);
                      setCategoryToDelete(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteCategory}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all active:scale-95"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Management */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
         <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <Layers className="text-indigo-500" size={14} /> Categories
        </h3>
        
        <div className="flex flex-col gap-2 mb-6">
            {categories.map((cat, index) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 group">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${cat.color} bg-opacity-10 dark:bg-opacity-20`}>
                            {renderIcon(cat.icon, 18)}
                        </div>
                        <span className="text-sm font-medium dark:text-gray-300">{cat.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 transition-opacity">
                        <button 
                            onClick={() => handleEditCategory(cat)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            disabled={index === 0 || cat.id === 'cat_other'}
                            onClick={() => handleMoveCategory(index, 'up')}
                            className="p-1.5 text-gray-400 hover:text-primary-600 disabled:opacity-20 transition-colors"
                            title="Move Up"
                        >
                            <ChevronUp size={16} />
                        </button>
                        <button 
                            disabled={index === categories.length - 1 || cat.id === 'cat_other' || (index === categories.length - 2 && categories[categories.length - 1].id === 'cat_other')}
                            onClick={() => handleMoveCategory(index, 'down')}
                            className="p-1.5 text-gray-400 hover:text-primary-600 disabled:opacity-20 transition-colors"
                            title="Move Down"
                        >
                            <ChevronDown size={16} />
                        </button>
                        {cat.id !== 'cat_other' && (
                            <button 
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1"
                                title="Delete"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>

        <div id="category-form" className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
             <div className="flex items-center justify-between mb-4">
                 <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                     {editingCategoryId ? 'Edit Category' : 'Add New Category'}
                 </h4>
                 {editingCategoryId && (
                     <button 
                        onClick={() => {
                            setEditingCategoryId(null);
                            setNewCatName('');
                            setNewCatIcon('Utensils');
                            setNewCatColor(TEXT_COLORS[0]);
                        }}
                        className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline"
                     >
                         Cancel Edit
                     </button>
                 )}
             </div>
             <form onSubmit={handleAddCategory} className="space-y-4">
                 <input 
                    type="text" 
                    value={newCatName} 
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Category Name" 
                    className="w-full bg-white dark:bg-cardbg border-none rounded-lg px-3 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-primary-500"
                 />
                 
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Select Color</label>
                    <div className="flex flex-wrap gap-2">
                        {TEXT_COLOR_NAMES.map(c => (
                            <button
                                key={c.color}
                                type="button"
                                onClick={() => setNewCatColor(c.color)}
                                className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${c.color.replace('text-', 'bg-')} ${newCatColor === c.color ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'opacity-60 hover:opacity-100'}`}
                                title={c.name}
                            >
                                {newCatColor === c.color && <CheckCircle size={14} className="text-white" />}
                            </button>
                        ))}
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Select Icon</label>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORY_ICONS.map(icon => (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => setNewCatIcon(icon)}
                                className={`p-2 rounded-lg transition-colors ${newCatIcon === icon ? 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                            >
                                {renderIcon(icon, 18)}
                            </button>
                        ))}
                    </div>
                 </div>
                 
                 <button type="submit" className="w-full bg-primary-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95">
                     {editingCategoryId ? 'Update Category' : 'Add Category'}
                 </button>
             </form>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
         <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <Monitor className="text-purple-500" size={14} /> Appearance
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleThemeChange(mode)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${currentProfile.themePreference === mode ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent bg-gray-50 dark:bg-gray-800'}`}
            >
               {mode === 'light' && <Sun size={24} className="mb-2 text-orange-500" />}
               {mode === 'dark' && <Moon size={24} className="mb-2 text-indigo-500" />}
               {mode === 'system' && <Monitor size={24} className="mb-2 text-gray-500" />}
               <span className="capitalize text-sm font-medium dark:text-gray-300">{mode}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Sync */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
         <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <Cloud className="text-blue-500" size={14} /> Google Drive Backup
        </h3>
        
        <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Securely backup your data to your personal Google Drive. This allows you to sync your expenses across devices and keep your data safe.
            </p>
        </div>

        {!currentProfile.googleAccessToken ? (
             <div className="space-y-4">
                 <button 
                    onClick={signInToGoogle}
                    className="w-full bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm active:scale-95"
                 >
                    <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                    Connect Google Drive
                 </button>
                 {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                     <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-start gap-2">
                         <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                         <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-tight">
                             Google Drive sync is not configured. Please set the <b>VITE_GOOGLE_CLIENT_ID</b> in the environment settings.
                         </p>
                     </div>
                 )}
             </div>
        ) : (
             <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl">
                     <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold text-xs uppercase tracking-wider">
                         <CheckCircle size={18} />
                         Connected
                     </div>
                     <button 
                        onClick={signOutFromGoogle}
                        className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                     >
                        Disconnect
                     </button>
                 </div>
                 
                 <div className="grid grid-cols-1 gap-3">
                     <button 
                        onClick={handleSyncNow}
                        disabled={isSyncing}
                        className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                        {isSyncing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Syncing...
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                Backup Now
                            </>
                        )}
                     </button>
                 </div>
                 {currentProfile.lastSyncedAt && (
                    <p className="text-[10px] text-center text-gray-400 font-medium uppercase tracking-widest">
                        Last synced: {new Date(currentProfile.lastSyncedAt).toLocaleString()}
                    </p>
                 )}
             </div>
        )}
      </section>

      {/* Data Management */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
         <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <FileText className="text-green-500" size={14} /> Data Management
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          <button 
             onClick={exportData}
             className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
             <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Download size={18} /> Export to Excel (.xlsx)
             </span>
          </button>

          <div className="relative">
             <input 
               type="file" 
               accept=".csv,.xlsx,.xls"
               ref={fileInputRef}
               onChange={handleFileUpload}
               className="hidden" 
               id="csv-upload"
             />
             <label 
               htmlFor="csv-upload"
               className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
             >
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Upload size={18} /> Import Data (CSV/Excel)
                </span>
             </label>
          </div>

          <button 
             onClick={downloadTemplate}
             className="text-xs text-primary-600 dark:text-primary-400 hover:underline text-left pl-2"
          >
             Download sample format template
          </button>
          
          {importStatus && (
             <div className={`text-sm p-3 rounded-lg ${importStatus.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {importStatus}
             </div>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 shadow-sm border border-red-100 dark:border-red-900/30 mb-20">
         <h3 className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <AlertTriangle size={14} /> Danger Zone
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Permanent actions that cannot be undone.
        </p>

        <button 
            onClick={handleFactoryReset}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all whitespace-nowrap overflow-hidden text-ellipsis px-4"
        >
            {resetConfirmCount === 0 && "Reset All Data (Factory Reset)"}
            {resetConfirmCount === 1 && "Are you sure? Click again."}
            {resetConfirmCount === 2 && "Click for Final Confirmation"}
        </button>

        {showFinalResetConfirm && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-white dark:bg-cardbg w-full max-w-sm rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 text-center">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-50 dark:border-red-900/20">
                            <AlertTriangle className="animate-bounce" size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Wipe All Data?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                            This is the <span className="font-bold text-red-600">final warning</span>. After this confirmation, <span className="font-bold">all your profiles, books, and transactions will be deleted</span> and reset to the initial state. This cannot be undone.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={resetAllData}
                                className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-red-500/40 hover:bg-red-700 transition-all active:scale-95"
                            >
                                YES, DELETE EVERYTHING
                            </button>
                            <button 
                                onClick={() => {
                                    setShowFinalResetConfirm(false);
                                    setResetConfirmCount(0);
                                }}
                                className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                            >
                                NO, TAKE ME BACK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </section>
    </div>
  );
};

export default Settings;