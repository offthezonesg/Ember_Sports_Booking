import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../supabase/client';
import { useTranslation } from 'react-i18next';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for PKCE code flow (modern)
        const code = searchParams.get('code');
        
        if (code) {
          // Exchange code for session (PKCE flow)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            throw error;
          }
        } else {
          // Fallback to hash-based flow (legacy)
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          if (!data.session) {
            throw new Error('No session found');
          }
        }

        // Success - show animation then redirect
        setStatus('success');
        setTimeout(() => {
          navigate('/onboarding', { replace: true });
        }, 1200);
        
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error.message || t('authCallback.errorMessage'));
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-secondary/5 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <Loader2 className="w-16 h-16 text-primary" />
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <CheckCircle className="w-16 h-16 text-green-500" />
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <XCircle className="w-16 h-16 text-red-500" />
          </motion.div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {status === 'loading' && t('authCallback.loading')}
          {status === 'success' && t('authCallback.success')}
          {status === 'error' && t('authCallback.error')}
        </h2>

        <p className="text-gray-600 mb-6">
          {status === 'loading' && t('authCallback.loadingMessage')}
          {status === 'success' && t('authCallback.successMessage')}
          {status === 'error' && errorMessage}
        </p>

        {status === 'error' && (
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('authCallback.backToLogin')}
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;
