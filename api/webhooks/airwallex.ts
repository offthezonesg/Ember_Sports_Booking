import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get webhook signature from headers
    const signature = req.headers['x-airwallex-signature'] as string;
    const webhookSecret = process.env.AIRWALLEX_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return res.status(400).json({ error: 'Invalid webhook configuration' });
    }

    // Verify HMAC-SHA256 signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse webhook event
    const event = req.body;
    console.log('Received webhook event:', event.name);

    // Handle payment success
    if (event.name === 'payment_intent.succeeded') {
      const paymentIntent = event.data;
      const bookingId = paymentIntent.merchant_order_id;

      if (!bookingId) {
        console.error('Missing merchant_order_id in webhook');
        return res.status(400).json({ error: 'Missing booking ID' });
      }

      // Check current payment status (idempotency check)
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('payment_status')
        .eq('id', bookingId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch booking:', fetchError);
        return res.status(500).json({ error: 'Database error' });
      }

      // Idempotency: only process if not already paid
      if (booking?.payment_status === 'paid') {
        console.log(`Booking ${bookingId} already marked as paid, skipping`);
        return res.status(200).json({ message: 'Already processed' });
      }

      // Update booking status to paid
      const { error: updateError } = await supabaseAdmin
        .from('bookings')
        .update({
          payment_status: 'paid',
          airwallex_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Failed to update booking:', updateError);
        return res.status(500).json({ error: 'Failed to update booking' });
      }

      console.log(`✅ Booking ${bookingId} marked as paid`);

      // TODO: Send receipt email using Resend
      // This would require installing @resend/sdk and configuring RESEND_API_KEY
      /*
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Get user email from booking
      const { data: bookingDetails } = await supabaseAdmin
        .from('bookings')
        .select('user_id, amount')
        .eq('id', bookingId)
        .single();

      if (bookingDetails) {
        // Send receipt to customer
        await resend.emails.send({
          from: 'Ember Sports <noreply@embersports.com>',
          to: [customerEmail],
          subject: 'Payment Confirmation - Ember Sports',
          html: `
            <h1>Payment Successful!</h1>
            <p>Your court booking has been confirmed.</p>
            <p>Order ID: ${bookingId}</p>
            <p>Amount: ${paymentIntent.currency} ${paymentIntent.amount}</p>
          `,
        });

        // Send notification to admin
        await resend.emails.send({
          from: 'Ember Sports <noreply@embersports.com>',
          to: ['admin@embersports.com'],
          subject: 'New Payment Received',
          html: `
            <h1>New Payment</h1>
            <p>Booking ID: ${bookingId}</p>
            <p>Amount: ${paymentIntent.currency} ${paymentIntent.amount}</p>
          `,
        });
      }
      */
    }

    // Return success
    return res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    // Still return 200 to acknowledge receipt
    return res.status(200).json({ 
      error: 'Processing error',
      message: error.message 
    });
  }
}
