import type { VercelRequest, VercelResponse } from '@vercel/node';

interface CreateIntentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
}

interface AirwallexResponse {
  id: string;
  client_secret: string;
  checkout_url?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bookingId, amount, currency, customerEmail, customerName }: CreateIntentRequest = req.body;

    // Validate required fields
    if (!bookingId || !amount || !currency || !customerEmail || !customerName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['bookingId', 'amount', 'currency', 'customerEmail', 'customerName']
      });
    }

    // Determine environment
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = isProduction 
      ? 'https://api.airwallex.com' 
      : 'https://api-demo.airwallex.com';

    // Get credentials from environment variables
    const clientId = process.env.AIRWALLEX_CLIENT_ID;
    const apiKey = process.env.AIRWALLEX_API_KEY;

    if (!clientId || !apiKey) {
      console.error('Missing Airwallex credentials');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create payment intent
    const response = await fetch(`${baseUrl}/api/v1/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        merchant_order_id: bookingId,
        description: `Ember Sports Court Booking - ${bookingId}`,
        customer: {
          email: customerEmail,
          name: customerName,
        },
        // Configure payment methods
        payment_methods: ['card', 'alipay', 'wechatpay'],
        // Set return URL for redirect after payment
        return_url: `${process.env.VERCEL_URL || 'http://localhost:3266'}/booking/success?booking_id=${bookingId}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Airwallex API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to create payment intent',
        details: errorData
      });
    }

    const data: AirwallexResponse = await response.json();

    // Return success response
    return res.status(200).json({
      client_secret: data.client_secret,
      id: data.id,
      checkout_url: data.checkout_url,
    });

  } catch (error: any) {
    console.error('Create intent error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
