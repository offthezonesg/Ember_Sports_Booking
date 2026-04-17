import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLang: 'zh' | 'en';
  onSwitch: (lang: 'zh' | 'en') => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ currentLang, onSwitch }) => {
  return (
    <button
      onClick={() => onSwitch(currentLang === 'zh' ? 'en' : 'zh')}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
    >
      <Globe className="w-4 h-4" />
      <span>{currentLang === 'zh' ? 'EN' : '中'}</span>
    </button>
  );
};

export default LanguageSwitcher;
