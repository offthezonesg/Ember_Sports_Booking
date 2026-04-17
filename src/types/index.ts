export interface Court {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_per_hour: number;
  is_active: boolean | null;
}

export interface Booking {
  id: string;
  court_id: string;
  user_id: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_amount: number;
  payment_status: 'unpaid' | 'paid' | 'refunded' | null;
  guest_name: string | null;
  guest_phone: string | null;
  created_at: string | null;
}

export interface TimeSlot {
  time: string;
  label: string;
  available: boolean;
}

export interface CourtSchedule {
  court: Court;
  slots: TimeSlot[];
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}
