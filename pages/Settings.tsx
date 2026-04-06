import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Moon, Sun, Monitor, Cloud, User, Download, Upload, FileText, CheckCircle, 
  Trash2, Globe, Layers, AlertTriangle, Plus, X, Settings as SettingsIcon, Edit2, Check
} from 'lucide-react';
import { 
  CURRENCIES, PROFILE_ICONS, CATEGORY_ICONS, TEXT_COLORS, TEXT_COLOR_NAMES
} from '../constants';
import * as Icons from 'lucide-react';

const Settings: React.FC = () => {
  const { 
    profiles, 
    currentProfile, 
    updateProfileSettings, 
    switchProfile, 
    addProfile,
    deleteProfile,
    categories,
    addCategory,
    deleteCategory,
    resetAllData,
    exportData,
    importData,
    downloadTemplate,
    initGoogleDrive,
    signInToGoogle,
    signOutFromGoogle,
    syncWithDrive
  } = useData();
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');
  const [newCatColor, setNewCatColor] = useState(TEXT_COLORS[0]);

  // Profile Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(currentProfile?.name || '');

  // Reset State
  const [resetConfirmCount, setResetConfirmCount] = useState(0);
  const [showProfileDeleteConfirm, setShowProfileDeleteConfirm] = useState(false);

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
          addCategory({ name: newCatName, icon: newCatIcon, color: newCatColor });
          setNewCatName('');
          showToast("Category added", "success");
      }
  };

  const handleFactoryReset = () => {
      if(resetConfirmCount === 0) {
          setResetConfirmCount(1);
      } else if (resetConfirmCount === 1) {
          setResetConfirmCount(2);
      } else {
          resetAllData();
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const result = await importData(text);
      setImportStatus(result.message);
      setTimeout(() => setImportStatus(''), 5000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!currentProfile) return null;

  // Render Icon helper
  const renderIcon = (iconName: string, size = 20, className = "") => {
      const LucideIcon = (Icons as any)[iconName];
      return LucideIcon ? <LucideIcon size={size} className={className} /> : <Icons.HelpCircle size={size} className={className} />;
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

      {/* Categories Management */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
         <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <Layers className="text-indigo-500" size={14} /> Categories
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className={`${cat.color}`}>{renderIcon(cat.icon, 14)}</span>
                    <span className="text-sm dark:text-gray-300">{cat.name}</span>
                    <button 
                        onClick={() => {
                            if(categories.length > 1) deleteCategory(cat.id);
                            else showToast("Keep at least one category", "error");
                        }}
                        className="text-gray-400 hover:text-red-500 ml-1"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
             <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-widest ml-1">Add New Category</h4>
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
                 
                 <button type="submit" className="w-full bg-primary-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all active:scale-95">Add Category</button>
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
                <Download size={18} /> Export to Excel (CSV)
             </span>
          </button>

          <div className="relative">
             <input 
               type="file" 
               accept=".csv"
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
                  <Upload size={18} /> Import Data
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
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all"
        >
            {resetConfirmCount === 0 && "Reset All Data (Factory Reset)"}
            {resetConfirmCount === 1 && "Are you sure? Click again."}
            {resetConfirmCount === 2 && "FINAL CONFIRM: WIPE EVERYTHING"}
        </button>
      </section>
    </div>
  );
};

export default Settings;