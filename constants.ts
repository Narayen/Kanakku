import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Food & Dining', icon: 'Utensils', color: 'text-orange-500' },
  { id: 'cat_transport', name: 'Transportation', icon: 'Car', color: 'text-blue-500' },
  { id: 'cat_utilities', name: 'Utilities', icon: 'Zap', color: 'text-yellow-500' },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: 'text-pink-500' },
  { id: 'cat_health', name: 'Health', icon: 'Heart', color: 'text-red-500' },
  { id: 'cat_salary', name: 'Salary', icon: 'Briefcase', color: 'text-green-500' },
  { id: 'cat_other', name: 'Other', icon: 'MoreHorizontal', color: 'text-gray-500' },
];

export const MOCK_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
  'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
];

export const TEXT_COLORS = [
  'text-red-500', 'text-orange-500', 'text-amber-500', 
  'text-green-500', 'text-emerald-500', 'text-teal-500', 
  'text-cyan-500', 'text-blue-500', 'text-indigo-500', 
  'text-violet-500', 'text-purple-500', 'text-fuchsia-500', 'text-pink-500'
];

export const PROFILE_ICONS = [
  'User', 'Smile', 'Zap', 'Star', 'Heart', 'Crown', 'Coffee', 'Music', 'Sun', 'Moon'
];

export const CATEGORY_ICONS = [
  'Utensils', 'Car', 'Zap', 'ShoppingBag', 'Heart', 'Briefcase', 
  'MoreHorizontal', 'Home', 'Smartphone', 'Wifi', 'Gift', 'Coffee',
  'Music', 'Film', 'Book', 'Plane', 'Gamepad'
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
  { code: 'INR', symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr', flag: '🇨🇭', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'dh', flag: '🇦🇪', name: 'UAE Dirham' },
];