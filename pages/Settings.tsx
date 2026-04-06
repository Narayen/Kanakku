import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Moon, Sun, Monitor, Cloud, User, Download, Upload, FileText, CheckCircle, 
  Trash2, Globe, Layers, AlertTriangle, Plus, X 
} from 'lucide-react';
import { 
  CURRENCIES, PROFILE_ICONS, CATEGORY_ICONS, TEXT_COLORS 
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
  const [clientId, setClientId] = useState(currentProfile?.googleClientId || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Utensils');
  const [newCatColor, setNewCatColor] = useState(TEXT_COLORS[0]);

  // Reset State
  const [resetConfirmCount, setResetConfirmCount] = useState(0);

  useEffect(() => {
    if(currentProfile?.googleClientId) {
      setClientId(currentProfile.googleClientId);
    }
  }, [currentProfile]);

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
          if(window.confirm(`Delete profile "${currentProfile.name}"? This cannot be undone.`)){
              deleteProfile(currentProfile.id);
              showToast("Profile deleted", "info");
          }
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

  const handleSaveClientId = () => {
    if(currentProfile && clientId) {
      updateProfileSettings(currentProfile.id, { googleClientId: clientId });
      initGoogleDrive(clientId);
      showToast("Client ID Saved");
    }
  };

  if (!currentProfile) return null;

  // Render Icon helper
  const renderIcon = (iconName: string, size = 20, className = "") => {
      const LucideIcon = (Icons as any)[iconName];
      return LucideIcon ? <LucideIcon size={size} className={className} /> : <Icons.HelpCircle size={size} className={className} />;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

      {/* Profile Section */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
          <User className="text-primary-500" size={20} /> Profiles
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
             className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
           />
           <button type="submit" disabled={!newProfileName} className="bg-gray-900 dark:bg-white dark:text-black text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">Create</button>
        </form>

        {/* Current Profile Settings */}
        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Current Profile Settings</h4>
            
            {/* Icon Picker */}
            <div className="mb-6">
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Profile Icon</label>
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
                 <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Globe size={16} /> Global Currency (Default)
                 </label>
                 <div className="relative">
                    <select 
                        value={currentProfile.currency || 'USD'}
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
                <button 
                    onClick={handleDeleteProfile}
                    className="text-red-500 text-sm font-medium flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg transition-colors"
                >
                    <Trash2 size={16} /> Delete Current Profile
                </button>
            )}
        </div>
      </section>

      {/* Categories Management */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
         <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
          <Layers className="text-indigo-500" size={20} /> Categories
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
             <h4 className="text-sm font-semibold mb-3 dark:text-gray-300">Add New Category</h4>
             <form onSubmit={handleAddCategory} className="space-y-3">
                 <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={newCatName} 
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="Category Name" 
                        className="flex-1 bg-white dark:bg-cardbg border-none rounded-lg px-3 py-2 text-sm dark:text-white"
                     />
                     <select 
                        value={newCatColor}
                        onChange={e => setNewCatColor(e.target.value)}
                        className={`bg-white dark:bg-cardbg border-none rounded-lg px-3 py-2 text-sm ${newCatColor}`}
                     >
                        {TEXT_COLORS.map(c => <option key={c} value={c} className={c}>Color</option>)}
                     </select>
                 </div>
                 
                 <div className="flex flex-wrap gap-2">
                     {CATEGORY_ICONS.map(icon => (
                         <button
                            key={icon}
                            type="button"
                            onClick={() => setNewCatIcon(icon)}
                            className={`p-1.5 rounded-md transition-colors ${newCatIcon === icon ? 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                         >
                             {renderIcon(icon, 16)}
                         </button>
                     ))}
                 </div>
                 
                 <button type="submit" className="w-full bg-primary-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-primary-700">Add Category</button>
             </form>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
         <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
          <Monitor className="text-purple-500" size={20} /> Appearance
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
         <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
          <Cloud className="text-blue-500" size={20} /> Google Drive Backup
        </h3>
        
        <div className="mb-4">
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Google Client ID</label>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={clientId} 
                    onChange={e => setClientId(e.target.value)}
                    placeholder="e.g. 12345...apps.googleusercontent.com"
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 dark:text-white text-sm"
                />
                <button 
                   onClick={handleSaveClientId}
                   className="bg-gray-200 dark:bg-gray-700 px-4 rounded-xl text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    Save
                </button>
            </div>
        </div>

        {!currentProfile.googleAccessToken ? (
             <button 
                onClick={signInToGoogle}
                disabled={!currentProfile.googleClientId}
                className="w-full bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
             >
                <img src="https://www.google.com/favicon.ico" alt="G" className="w-4 h-4" />
                Sign in with Google
             </button>
        ) : (
             <div className="space-y-4">
                 <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                     <CheckCircle size={20} /> Connected to Google Drive
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={handleSyncNow}
                        disabled={isSyncing}
                        className="bg-primary-600 text-white font-medium py-3 rounded-xl hover:bg-primary-700"
                     >
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                     </button>
                     <button 
                        onClick={signOutFromGoogle}
                        className="bg-red-50 dark:bg-red-900/20 text-red-600 font-medium py-3 rounded-xl hover:bg-red-100"
                     >
                        Sign Out
                     </button>
                 </div>
                 {lastSyncTime && <p className="text-xs text-center text-gray-400">Last synced: {lastSyncTime}</p>}
             </div>
        )}
      </section>

      {/* Data Management */}
      <section className="bg-white dark:bg-cardbg rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
         <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
          <FileText className="text-green-500" size={20} /> Data Management
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
         <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle size={20} /> Danger Zone
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