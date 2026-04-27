import React, { useState } from 'react';
import { X, Moon, Sun, Monitor, Sprout } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const [tempTheme, setTempTheme] = useState<'light' | 'dark' | 'system'>(theme);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTempTheme(newTheme);
    if (newTheme !== 'system') {
      if (newTheme !== theme) {
        toggleTheme();
      }
    }
  };

  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const getCurrentTheme = () => {
    if (tempTheme === 'system') {
      return getSystemTheme();
    }
    return tempTheme;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Settings Panel */}
      <div className="absolute right-4 top-20 w-80 pointer-events-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Sprout className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Settings Content */}
          <div className="p-4 space-y-6">
            {/* Theme Settings */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Appearance</h3>
              <div className="space-y-2">
                {/* Light Theme */}
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    tempTheme === 'light' && theme === 'light'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Light</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bright and clean interface</p>
                  </div>
                  {tempTheme === 'light' && theme === 'light' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    tempTheme === 'dark' && theme === 'dark'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Moon className="w-4 h-4 text-blue-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Easy on the eyes</p>
                  </div>
                  {tempTheme === 'dark' && theme === 'dark' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>

                {/* System Theme */}
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    tempTheme === 'system'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Monitor className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">System</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Follow system preference ({getSystemTheme()})
                    </p>
                  </div>
                  {tempTheme === 'system' && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              </div>
            </div>

            {/* About Section */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Sprout className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Mochiforge Greenhouse Monitor
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Version 1.0.0 • Smart greenhouse monitoring
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
