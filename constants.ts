import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Food & Dining', icon: 'Utensils', color: 'text-orange-500' },
  { id: 'cat_transport', name: 'Transportation', icon: 'Car', color: 'text-blue-500' },
  { id: 'cat_utilities', name: 'Utilities', icon: 'Zap', color: 'text-yellow-500' },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: 'text-pink-500' },
  { id: 'cat_health', name: 'Health', icon: 'Heart', color: 'text-red-500' },
  { id: 'cat_salary', name: 'Salary', icon: 'Briefcase', color: 'text-green-500' },
  { id: 'cat_other', name: 'Others', icon: 'MoreHorizontal', color: 'text-gray-500' },
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

export const TEXT_COLOR_NAMES = [
  { color: 'text-red-500', name: 'Red'},
  { color: 'text-orange-500', name: 'Orange'},
  { color: 'text-amber-500', name: 'Amber'},
  { color: 'text-green-500', name: 'Green'},
  { color: 'text-emerald-500', name: 'Emerald'},
  { color: 'text-teal-500', name: 'Teal'},
  { color: 'text-cyan-500', name: 'Cyan'},
  { color: 'text-blue-500', name: 'Blue'},
  { color: 'text-indigo-500', name: 'Indigo'},
  { color: 'text-violet-500', name: 'Violet'},
  { color: 'text-purple-500', name: 'Purple'},
  { color: 'text-fuchsia-500', name: 'Fuchsia'},
  { color: 'text-pink-500', name: 'Pink'}
];

export const PROFILE_ICONS = [
  'User', 'Smile', 'Zap', 'Star', 'Heart', 'Crown', 'Coffee', 'Music', 'Sun', 'Moon',
  'Ghost', 'Rocket', 'Gamepad2', 'Camera', 'Cat', 'Dog', 'Bird'
];

export const CATEGORY_ICONS = [
  'Utensils', 'Car', 'Zap', 'ShoppingBag', 'Heart', 'Briefcase', 
  'MoreHorizontal', 'Home', 'Smartphone', 'Wifi', 'Gift', 'Coffee',
  'Music', 'Film', 'Book', 'Plane', 'Gamepad', 'ShoppingBasket',
  'Train', 'Bus', 'Bike', 'Dumbbell', 'Stethoscope', 'GraduationCap',
  'Lightbulb', 'Hammer', 'Wrench', 'Trash2', 'Cloud', 'Umbrella'
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', flag: '🇨🇦', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'Fr', flag: '🇨🇭', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'dh', flag: '🇦🇪', name: 'UAE Dirham' },
];