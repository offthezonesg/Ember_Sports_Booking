import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { I18nextProvider } from 'react-i18next';
import { User } from '@supabase/supabase-js';
import i18n from './i18n';
import Header from './components/Header';
import Home from './pages/Home';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';
import { supabase } from './supabase/client';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <I18nextProvider i18n={i18n}>
      <HashRouter>
        <div className="min-h-screen bg-gray-50">
          <Header user={user} />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
              <Route path="/booking" element={<Booking user={user} />} />
              <Route path="/my-bookings" element={user ? <MyBookings user={user} /> : <Navigate to="/login" />} />
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </div>
      </HashRouter>
    </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
