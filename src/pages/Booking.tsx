import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';
import { supabase } from '../supabase/client';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { sendBookingReceipt } from '../utils/email';
import Skeleton from '../components/Skeleton';

interface Court {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
}

interface Booking {
  id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
];

// Payment mode: when PAYMENT_ENABLED is not 'true', use mock payment
const isPaymentEnabled = process.env.PAYMENT_ENABLED === 'true';
const isMockPayment = !isPaymentEnabled;

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info';
}

const BookingPage: React.FC<{ user: any }> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ court: Court; time: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dateLocale = lang === 'zh' ? zhCN : enUS;

  const addToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    fetchCourts();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchCourts = async () => {
    const { data } = await supabase.from('courts').select('*').order('name');
    if (data) setCourts(data);
    setLoading(false);
  };

  const fetchBookings = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', dateStr)
      .in('status', ['confirmed', 'pending']);
    if (data) setBookings(data);
  };

  const isSlotBooked = (courtId: string, time: string) => {
    return bookings.some(b =>
      b.court_id === courtId &&
      b.start_time <= time &&
      b.end_time > time
    );
  };

  const handleSlotClick = (court: Court, time: string) => {
    if (isSlotBooked(court.id, time)) return;
    setSelectedSlot({ court, time });
    setBookingError('');
    setShowModal(true);
  };

  // Step 1: User confirms booking details -> proceed to payment
  const handleConfirmBooking = () => {
    if (!selectedSlot) return;
    if (!user && (!guestName || !guestPhone)) return;
    setShowModal(false);

    if (isMockPayment) {
      // In mock mode, show mock payment modal
      setShowPaymentModal(true);
    } else {
      // In real mode, would redirect to Airwallex payment flow
      // TODO: Implement real Airwallex payment integration
      // For now, also show payment modal as placeholder
      setShowPaymentModal(true);
    }
  };

  // Step 2: Process payment (mock or real)
  const handlePayment = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setBookingError('');

    const endTime = String(parseInt(selectedSlot.time.split(':')[0]) + 1).padStart(2, '0') + ':00';
    const bookingDate = format(selectedDate, 'yyyy-MM-dd');

    if (isMockPayment) {
      // Mock payment flow: insert booking with mock_paid status
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          court_id: selectedSlot.court.id,
          booking_date: bookingDate,
          start_time: selectedSlot.time,
          end_time: endTime,
          user_id: user?.id || null,
          guest_name: guestName || null,
          guest_phone: guestPhone || null,
          total_amount: selectedSlot.court.price_per_hour,
          status: 'confirmed',
          payment_status: 'mock_paid',
        })
        .select()
        .single();

      if (!error && data) {
        setShowPaymentModal(false);
        setSelectedSlot(null);
        setGuestName('');
        setGuestPhone('');
        setGuestEmail('');
        setBookingError('');
        fetchBookings();

        // Send booking receipt
        await sendBookingReceipt({
          bookingId: data.id,
          courtName: selectedSlot.court.name,
          date: bookingDate,
          timeSlot: `${selectedSlot.time} - ${endTime}`,
          amount: selectedSlot.court.price_per_hour,
          currency: 'CNY',
          guestName: guestName || undefined,
          guestEmail: guestEmail || undefined,
        });

        addToast(t('booking.testMode.success'), 'success');
        addToast(t('booking.receipt.logged'), 'info');
      } else {
        setBookingError(t('booking.error'));
      }
    } else {
      // Real Airwallex payment flow
      // TODO: Replace with actual Airwallex integration when activated
      // This would call the /api/airwallex/create-intent endpoint
      // and redirect to Airwallex checkout
      try {
        const { data, error } = await supabase
          .from('bookings')
          .insert({
            court_id: selectedSlot.court.id,
            booking_date: bookingDate,
            start_time: selectedSlot.time,
            end_time: endTime,
            user_id: user?.id || null,
            guest_name: guestName || null,
            guest_phone: guestPhone || null,
            total_amount: selectedSlot.court.price_per_hour,
            status: 'pending',
            payment_status: 'unpaid',
          })
          .select()
          .single();

        if (!error && data) {
          // TODO: Create Airwallex payment intent and redirect
          // const response = await fetch('/api/airwallex/create-intent', { ... });
          // window.location.href = response.checkout_url;

          setShowPaymentModal(false);
          setSelectedSlot(null);
          setGuestName('');
          setGuestPhone('');
          setGuestEmail('');
          setBookingError('');
          fetchBookings();

          await sendBookingReceipt({
            bookingId: data.id,
            courtName: selectedSlot.court.name,
            date: bookingDate,
            timeSlot: `${selectedSlot.time} - ${endTime}`,
            amount: selectedSlot.court.price_per_hour,
            currency: 'CNY',
            guestName: guestName || undefined,
            guestEmail: guestEmail || undefined,
          });

          addToast(t('booking.receipt.sent'), 'success');
        } else {
          setBookingError(t('booking.error'));
        }
      } catch {
        setBookingError(t('booking.error'));
      }
    }

    setSubmitting(false);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100">
              <Skeleton className="h-9 w-48 mb-4" />
              <div className="flex items-center gap-2">
                {Array.from({ length: 7 }, (_, i) => (
                  <Skeleton key={i} className="flex-1 h-16 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 15 }, (_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      {/* Test Mode Banner */}
      {isMockPayment && (
        <div className="bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {t('booking.testMode.banner')}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-4 md:p-6 border-b border-gray-100">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('booking.title')}</h1>
            <div className="flex items-center gap-2">
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`flex-1 py-2 md:py-3 px-1 md:px-2 rounded-xl text-center transition-all ${
                    isSameDay(day, selectedDate)
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs mb-0.5 md:mb-1">{format(day, 'EEE', { locale: dateLocale })}</div>
                  <div className="text-base md:text-lg font-semibold">{format(day, 'd')}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-max">
              <div className="grid grid-cols-[100px_repeat(15,80px)]">
                <div className="p-3 text-sm font-medium text-gray-500 border-b border-r border-gray-100 bg-gray-50">{t('booking.court')}</div>
                {timeSlots.map((time) => (
                  <div key={time} className="p-3 text-xs text-center text-gray-500 border-b border-r border-gray-100 bg-gray-50">{time}</div>
                ))}
                {courts.map((court) => (
                  <React.Fragment key={court.id}>
                    <div className="p-4 border-b border-r border-gray-100 bg-gray-50">
                      <div className="font-medium text-gray-900">{court.name}</div>
                      <div className="text-xs text-gray-500">¥{court.price_per_hour}/h</div>
                    </div>
                    {timeSlots.map((time) => {
                      const booked = isSlotBooked(court.id, time);
                      return (
                        <button
                          key={`${court.id}-${time}`}
                          onClick={() => handleSlotClick(court, time)}
                          disabled={booked}
                          className={`p-2 border-b border-r border-gray-100 transition-all ${
                            booked ? 'bg-gray-200 cursor-not-allowed' : 'bg-white hover:bg-primary/5 cursor-pointer'
                          }`}
                        >
                          <div className={`w-full h-8 rounded-lg flex items-center justify-center text-xs ${
                            booked ? 'text-gray-400' : 'text-primary font-medium'
                          }`}>
                            {booked ? t('booking.booked') : t('booking.available')}
                          </div>
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="md:hidden">
            {courts.map((court) => (
              <div key={court.id} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{court.name}</div>
                    <div className="text-xs text-gray-500">{court.description}</div>
                  </div>
                  <div className="text-sm font-medium text-primary">¥{court.price_per_hour}/h</div>
                </div>
                <div className="overflow-x-auto scrollbar-thin">
                  <div className="flex gap-2 p-4 min-w-max">
                    {timeSlots.map((time) => {
                      const booked = isSlotBooked(court.id, time);
                      return (
                        <button
                          key={`${court.id}-${time}`}
                          onClick={() => handleSlotClick(court, time)}
                          disabled={booked}
                          className={`flex-shrink-0 w-16 min-h-[44px] py-3 rounded-xl text-sm font-medium transition-all ${
                            booked
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-2 border-primary/20 text-primary hover:bg-primary/5'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Booking Details Modal (Step 1) */}
      <AnimatePresence>
        {showModal && selectedSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{t('booking.confirmTitle')}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-gray-900">{selectedSlot.court.name}</div>
                    <div className="text-sm text-gray-500">{selectedSlot.court.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-gray-900">{format(selectedDate, lang === 'zh' ? 'yyyy年MM月dd日' : 'MMM dd, yyyy')}</div>
                    <div className="text-sm text-gray-500">{selectedSlot.time} - {parseInt(selectedSlot.time.split(':')[0]) + 1}:00</div>
                  </div>
                </div>
              </div>
              {!user && (
                <div className="space-y-3 mb-6">
                  <input type="text" placeholder={t('booking.name')} value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
                  <input type="tel" placeholder={t('booking.phone')} value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
                  <input type="email" placeholder={t('booking.email')} value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
              )}
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-600">{t('booking.total')}</span>
                <span className="text-2xl font-bold text-primary">¥{selectedSlot.court.price_per_hour}</span>
              </div>
              {bookingError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{bookingError}</div>
              )}
              <button
                onClick={handleConfirmBooking}
                disabled={!user && (!guestName || !guestPhone)}
                className="w-full min-h-[44px] py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {t('booking.proceedToPay')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal (Step 2) */}
      <AnimatePresence>
        {showPaymentModal && selectedSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => !submitting && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900">{t('booking.payment.title')}</h2>
                {!submitting && (
                  <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>

              {isMockPayment && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {t('booking.testMode.paymentBanner')}
                </div>
              )}

              {/* Order Summary */}
              <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-gray-900">{selectedSlot.court.name}</div>
                    <div className="text-sm text-gray-500">{selectedSlot.court.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium text-gray-900">{format(selectedDate, lang === 'zh' ? 'yyyy年MM月dd日' : 'MMM dd, yyyy')}</div>
                    <div className="text-sm text-gray-500">{selectedSlot.time} - {parseInt(selectedSlot.time.split(':')[0]) + 1}:00</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-gray-600">{t('booking.total')}</span>
                  <span className="text-2xl font-bold text-primary">¥{selectedSlot.court.price_per_hour}</span>
                </div>
              </div>

              {bookingError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{bookingError}</div>
              )}

              {isMockPayment ? (
                <button
                  onClick={handlePayment}
                  disabled={submitting}
                  className="w-full min-h-[44px] py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  {submitting ? t('booking.processing') : t('booking.testMode.confirmPay')}
                </button>
              ) : (
                <button
                  onClick={handlePayment}
                  disabled={submitting}
                  className="w-full min-h-[44px] py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  {submitting ? t('booking.processing') : t('booking.payment.confirmPay')}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
                toast.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BookingPage;
