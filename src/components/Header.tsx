import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Home, Menu, X } from 'lucide-react';
import { supabase } from '../supabase/client';
import { useTranslation } from '../hooks/useTranslation';
import { useTranslation as useReactI18nextTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  user: any;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, lang, setLang } = useTranslation();
  const { i18n } = useReactI18nextTranslation();
  const isZh = i18n.language === 'zh';

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/booking', label: t('nav.booking'), icon: Calendar },
    { path: '/my-bookings', label: t('nav.myBookings'), icon: User },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center flex-shrink-0">
            <span className="text-2xl tracking-wide whitespace-nowrap">
              <span className="font-extrabold text-orange-500">{isZh ? '合拍' : 'Ember'}</span>
              <span className="font-normal text-white">{isZh ? '社' : 'Sports'}</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    isActive ? 'text-primary' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher currentLang={lang} onSwitch={setLang} variant="light" />
            {user ? (
              <button
                onClick={handleLogout}
                className="text-sm text-gray-300 hover:text-primary transition-colors"
              >
                {t('nav.logout')}
              </button>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                {t('nav.login')}
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-gray-800 bg-gray-900"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-gray-800 mt-2">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">{t('nav.logout')}</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">{t('nav.login')}</span>
                  </Link>
                )}
                <div className="flex justify-center pt-2 pb-1">
                  <LanguageSwitcher currentLang={lang} onSwitch={(newLang) => {
                    setLang(newLang);
                    setMobileMenuOpen(false);
                  }} variant="dark" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
