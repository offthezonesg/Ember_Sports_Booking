import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin } from 'lucide-react';
import { supabase } from '../supabase/client';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

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

const BookingPage: React.FC<{ user: any }> = ({ user }) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ court: Court; time: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [bookingError, setBookingError] = useState('');

  const dateLocale = lang === 'zh' ? zhCN : enUS;

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

  const handleBooking = async () => {
    if (!selectedSlot) return;
    const endTime = String(parseInt(selectedSlot.time.split(':')[0]) + 1).padStart(2, '0') + ':00';
    const { error } = await supabase.from('bookings').insert({
      court_id: selectedSlot.court.id,
      booking_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedSlot.time,
      end_time: endTime,
      user_id: user?.id || null,
      guest_name: guestName || null,
      guest_phone: guestPhone || null,
      total_amount: selectedSlot.court.price_per_hour,
      status: 'pending'
    });
    if (!error) {
      setShowModal(false);
      setSelectedSlot(null);
      setGuestName('');
      setGuestPhone('');
      setBookingError('');
      fetchBookings();
    } else {
      setBookingError(t('booking.error'));
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-4 md:p-6 border-b border-gray-100">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{t('booking.title')}</h1>
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
                          className={`flex-shrink-0 w-16 py-3 rounded-xl text-sm font-medium transition-all ${
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

      <AnimatePresence>
        {showModal && selectedSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{t('booking.confirm')}</h2>
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
                </div>
              )}
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-600">{t('booking.total')}</span>
                <span className="text-2xl font-bold text-primary">¥{selectedSlot.court.price_per_hour}</span>
              </div>
              {bookingError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{bookingError}</div>
              )}
              <button onClick={handleBooking} disabled={!user && (!guestName || !guestPhone)} className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                {t('booking.confirm')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingPage;
