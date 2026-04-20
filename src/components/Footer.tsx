import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useTranslation as useReactI18nextTranslation } from 'react-i18next';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { i18n } = useReactI18nextTranslation();
  const isZh = i18n.language === 'zh';
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { path: '/', label: t('footer.home') },
    { path: '/booking', label: t('footer.booking') },
    { path: '/my-bookings', label: t('footer.myBookings') },
  ];

  return (
    <footer className="bg-gray-900 text-gray-400 relative overflow-hidden">
      {/* Subtle orange gradient overlay */}
      <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-bl from-orange-500/[0.05] to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center">
              <span className="text-2xl tracking-wide whitespace-nowrap">
                <span className="font-extrabold text-orange-500">{isZh ? '合拍' : 'Ember'}</span>
                <span className="font-normal text-white">{isZh ? '社' : 'Sports'}</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              {t('footer.description')}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="font-space text-xs font-semibold uppercase tracking-[0.15em] text-orange-500">
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm hover:text-orange-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-4">
            <h3 className="font-space text-xs font-semibold uppercase tracking-[0.15em] text-orange-500">
              {t('footer.contact')}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" />
                <span className="text-sm">{t('footer.address')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 flex-shrink-0 text-orange-500" />
                <span className="text-sm">{t('footer.phone')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 flex-shrink-0 text-orange-500" />
                <span className="text-sm">{t('footer.email')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-sm text-center">
            {t('footer.copyright').replace('year', String(currentYear))}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
