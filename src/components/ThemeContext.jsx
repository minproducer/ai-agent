import React, { createContext, useContext, useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from Puter storage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const loadTheme = async () => {
    try {
      // Try to load from Puter storage first
      if (window.puter) {
        const savedTheme = await window.puter.kv.get('userTheme');
        if (savedTheme) {
          setTheme(savedTheme);
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to localStorage
      const localTheme = localStorage.getItem('theme');
      if (localTheme) {
        setTheme(localTheme);
      } else {
        // Auto-detect system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      // Use system preference as fallback
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(systemTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    try {
      // Save to Puter storage
      if (window.puter) {
        await window.puter.kv.set('userTheme', newTheme);
      }
      // Also save to localStorage as backup
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
      // Fallback to localStorage only
      localStorage.setItem('theme', newTheme);
    }
  };

  const setThemeMode = async (newTheme) => {
    setTheme(newTheme);
    
    try {
      if (window.puter) {
        await window.puter.kv.set('userTheme', newTheme);
      }
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
      localStorage.setItem('theme', newTheme);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
    isLoading,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme Toggle Button Component
export const ThemeToggle = ({ className = "" }) => {
  const { theme, toggleTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className={`w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 ${
        theme === 'dark'
          ? 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400'
          : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
      } ${className}`}
      title={theme === 'dark' ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};

// Theme-aware classes helper
export const themeClasses = {
  // Backgrounds
  bg: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    tertiary: 'bg-gray-100 dark:bg-gray-700',
    accent: 'bg-blue-50 dark:bg-blue-900/20',
    surface: 'bg-white dark:bg-gray-800',
    overlay: 'bg-black/50 dark:bg-black/70'
  },
  
  // Text colors
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-300',
    tertiary: 'text-gray-500 dark:text-gray-400',
    muted: 'text-gray-400 dark:text-gray-500',
    accent: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400'
  },
  
  // Borders
  border: {
    primary: 'border-gray-200 dark:border-gray-700',
    secondary: 'border-gray-300 dark:border-gray-600',
    accent: 'border-blue-200 dark:border-blue-700',
    focus: 'border-blue-500 dark:border-blue-400'
  },
  
  // Interactive elements
  interactive: {
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    active: 'active:bg-gray-100 dark:active:bg-gray-600',
    focus: 'focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed'
  },
  
  // Buttons
  button: {
    primary: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200',
    success: 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white',
    danger: 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white'
  },
  
  // Cards and containers
  card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/10',
  input: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
  
  // Gradients
  gradient: {
    primary: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20',
    header: 'bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700'
  }
};