import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  Home, Book, Settings, User, Smile, Zap, Star, Heart, Crown, Coffee, Music, Sun, Moon, BarChart3,
  Ghost, Rocket, Gamepad2, Camera, Cat, Dog, Bird
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const IconMap: { [key: string]: any } = {
  User, Smile, Zap, Star, Heart, Crown, Coffee, Music, Sun, Moon,
  Ghost, Rocket, Gamepad2, Camera, Cat, Dog, Bird
};

const Layout: React.FC = () => {
  const { currentProfile } = useData();
  const ProfileIcon = currentProfile?.icon && IconMap[currentProfile.icon] ? IconMap[currentProfile.icon] : User;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-darkbg text-gray-900 dark:text-gray-100 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-cardbg shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold">
             K
           </div>
           <h1 className="text-xl font-bold tracking-tight text-primary-700 dark:text-primary-400">Kanakku</h1>
           <span className="hidden sm:inline text-[10px] font-bold text-gray-400 dark:text-gray-500 border-l border-gray-200 dark:border-gray-700 pl-2 ml-1 uppercase tracking-widest leading-none">Expense Tracker</span>
        </div>
        <div className="flex items-center gap-2 px-1 py-1">
           <ProfileIcon size={16} className="text-primary-600 dark:text-primary-400" />
           <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {currentProfile?.name && currentProfile.name.length > 15 
                ? `${currentProfile.name.substring(0, 15)}...` 
                : currentProfile?.name}
           </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-6 px-4 py-6 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile First approach) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-cardbg border-t border-gray-200 dark:border-gray-700 pb-safe z-40 md:sticky md:bottom-auto md:top-0">
        <div className="flex justify-around items-center h-14 max-w-5xl mx-auto">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full space-y-0.5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`
            }
          >
            <Home size={19} />
            <span className="text-[10px] font-medium">Home</span>
          </NavLink>
          
          <NavLink 
            to="/books" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full space-y-0.5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`
            }
          >
            <Book size={19} />
            <span className="text-[10px] font-medium">Books</span>
          </NavLink>

          <NavLink 
            to="/analytics" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full space-y-0.5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`
            }
          >
            <BarChart3 size={19} />
            <span className="text-[10px] font-medium">Analytics</span>
          </NavLink>
 
          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full space-y-0.5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`
            }
          >
            <Settings size={19} />
            <span className="text-[10px] font-medium">Settings</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;