interface BookingReceipt {
  bookingId: string;
  courtName: string;
  date: string;
  timeSlot: string;
  amount: number;
  currency: string;
  guestName?: string;
  guestEmail?: string;
}

export async function sendBookingReceipt(receipt: BookingReceipt): Promise<boolean> {
  // TODO: Replace with real email provider (Resend, SendGrid, etc.)
  console.log('📧 Booking Receipt:', JSON.stringify(receipt, null, 2));
  console.log('📧 Email would be sent to:', receipt.guestEmail || 'registered user');
  // Return true to indicate "sent" (mocked)
  return true;
}

export type { BookingReceipt };
