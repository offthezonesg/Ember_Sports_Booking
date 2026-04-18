import React from 'react';

interface LanguageSwitcherProps {
  currentLang: 'zh' | 'en';
  onSwitch: (lang: 'zh' | 'en') => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, onSwitch }) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-full p-0.5">
      <button
        onClick={() => onSwitch('en')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
          currentLang === 'en'
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onSwitch('zh')}
        className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
          currentLang === 'zh'
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        中文
      </button>
    </div>
  );
};

export default LanguageSwitcher;
