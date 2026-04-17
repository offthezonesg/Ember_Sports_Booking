import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import { supabase } from '../supabase/client';
import { useTranslation } from 'react-i18next';

interface MyBookingsProps {
  user: any;
}

interface Booking {
  id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  payment_status: string;
  court: {
    name: string;
    description: string;
  };
}

const MyBookings: React.FC<MyBookingsProps> = ({ user }) => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, court:courts(name, description)')
      .eq('user_id', user.id)
      .order('booking_date', { ascending: false });
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm(t('myBookings.cancelConfirm'))) return;
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    fetchBookings();
  };

  const getStatus = (status: string, payment: string) => {
    if (status === 'cancelled') return { text: t('myBookings.status.cancelled'), color: 'bg-gray-100 text-gray-600' };
    if (payment === 'paid') return { text: t('myBookings.status.paid'), color: 'bg-green-100 text-green-700' };
    return { text: t('myBookings.status.pending'), color: 'bg-orange-100 text-orange-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{t('myBookings.title')}</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('myBookings.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const status = getStatus(b.status, b.payment_status);
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-4 rounded-xl border border-gray-100"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{b.court?.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        {b.booking_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary" />
                        {b.start_time.slice(0, 5)}-{b.end_time.slice(0, 5)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="font-medium text-primary">¥{b.total_amount}</span>
                      {b.status !== 'cancelled' && b.status !== 'completed' && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          {t('myBookings.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
