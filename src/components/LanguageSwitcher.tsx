import React from 'react';

interface LanguageSwitcherProps {
  currentLang: 'zh' | 'en';
  onSwitch: (lang: 'zh' | 'en') => void;
  variant?: 'light' | 'dark';
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, onSwitch, variant = 'light' }) => {
  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center rounded-full p-0.5 ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-100'
    }`}>
      <button
        onClick={() => onSwitch('en')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
          currentLang === 'en'
            ? isDark
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
              : 'bg-white text-orange-500 shadow-sm'
            : isDark
              ? 'text-gray-400 hover:text-gray-200'
              : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onSwitch('zh')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
          currentLang === 'zh'
            ? isDark
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
              : 'bg-white text-orange-500 shadow-sm'
            : isDark
              ? 'text-gray-400 hover:text-gray-200'
              : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        中文
      </button>
    </div>
  );
};

export default LanguageSwitcher;
