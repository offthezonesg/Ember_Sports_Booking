// api/wechat-payment-callback.js - Vercel Serverless Function
// POST /api/wechat-payment-callback
//
// WeChat Pay payment result notification callback.
// WeChat calls this endpoint after a payment succeeds or fails.
//
// Flow:
// 1. Receive XML notification from WeChat Pay
// 2. Verify the signature
// 3. Update booking status in Supabase
// 4. Return success XML to WeChat (to stop retrying)
//
// Required env vars:
//   WECHAT_MCH_KEY - WeChat Pay merchant API key (for signature verification)
//   SUPABASE_URL - Supabase project URL
//   SUPABASE_SERVICE_KEY - Supabase service role key

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse XML string to JavaScript object (flat, one level).
 * WeChat Pay v2 notifications are XML-based.
 */
function parseXml(xml) {
  const result = {};
  const regex = /<(\w+)>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/\1>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    result[match[1]] = match[2] || match[3] || '';
  }
  return result;
}

/**
 * Verify WeChat Pay callback signature.
 */
function verifySignature(params, apiKey) {
  const { sign, ...restParams } = params;

  // Sort parameters alphabetically by key
  const sortedKeys = Object.keys(restParams).sort();
  const queryString = sortedKeys
    .filter((key) => restParams[key] !== '' && restParams[key] !== undefined && restParams[key] !== null)
    .map((key) => `${key}=${restParams[key]}`)
    .join('&');

  const stringSignTemp = `${queryString}&key=${apiKey}`;
  const expectedSign = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();

  return sign === expectedSign;
}

/**
 * Build success response XML for WeChat Pay.
 */
function buildSuccessXml() {
  return '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>';
}

/**
 * Build failure response XML for WeChat Pay.
 */
function buildFailXml(message) {
  return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[${message}]]></return_msg></xml>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // WeChat Pay sends POST with Content-Type: application/xml
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const WECHAT_MCH_KEY = process.env.WECHAT_MCH_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sjrinqsekowhgtikhnvv.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!WECHAT_MCH_KEY || !SUPABASE_SERVICE_KEY) {
    console.error('Missing required env vars for payment callback');
    res.setHeader('Content-Type', 'application/xml');
    res.status(500).send(buildFailXml('Server configuration error'));
    return;
  }

  try {
    // ── Step 1: Parse XML notification ─────────────────────────────────────────
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const notification = parseXml(rawBody);

    console.log('WeChat Pay callback received:', notification.return_code, notification.result_code);

    // Check if WeChat reported success at the communication level
    if (notification.return_code !== 'SUCCESS') {
      console.error('WeChat Pay communication failure:', notification.return_msg);
      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(buildFailXml('Communication failed'));
      return;
    }

    // ── Step 2: Verify signature ──────────────────────────────────────────────
    if (!verifySignature(notification, WECHAT_MCH_KEY)) {
      console.error('Invalid signature in WeChat Pay callback');
      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(buildFailXml('Invalid signature'));
      return;
    }

    // ── Step 3: Check payment result ──────────────────────────────────────────
    if (notification.result_code !== 'SUCCESS') {
      console.error('Payment failed:', notification.err_code, notification.err_code_des);
      // Still return SUCCESS to WeChat so they stop retrying
      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(buildSuccessXml());
      return;
    }

    const out_trade_no = notification.out_trade_no; // Our merchant order number
    const transaction_id = notification.transaction_id; // WeChat Pay transaction ID
    const total_fee = notification.total_fee; // Amount in fen
    const openid = notification.openid;

    // ── Step 4: Update booking in Supabase ────────────────────────────────────
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find booking by out_trade_no
    // Note: out_trade_no column needs to be added to bookings table
    // For now, we search by the booking ID embedded in the description
    const { data: bookings, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, status, payment_status, total_amount')
      .eq('out_trade_no', out_trade_no)
      .limit(1);

    if (fetchError || !bookings || bookings.length === 0) {
      console.error('Booking not found for out_trade_no:', out_trade_no);
      // Return SUCCESS anyway to stop WeChat retries
      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(buildSuccessXml());
      return;
    }

    const booking = bookings[0];

    // Idempotency check - already paid?
    if (booking.payment_status === 'paid') {
      console.log('Booking already marked as paid, skipping:', booking.id);
      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(buildSuccessXml());
      return;
    }

    // Verify amount matches (in fen)
    const expectedFee = Math.round(Number(booking.total_amount) * 100);
    if (parseInt(total_fee, 10) !== expectedFee) {
      console.error('Amount mismatch:', { expected: expectedFee, received: total_fee });
      // This could be fraud - don't confirm the booking
      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(buildSuccessXml());
      return;
    }

    // Update booking to confirmed/paid
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        wechat_transaction_id: transaction_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      // Return FAIL so WeChat retries
      res.setHeader('Content-Type', 'application/xml');
      res.status(200).send(buildFailXml('Update failed'));
      return;
    }

    console.log('Booking confirmed and paid:', booking.id, 'transaction:', transaction_id);

    // TODO: Send booking confirmation message via WeChat template message
    // wx.request({
    //   url: 'https://api.weixin.qq.com/cgi-bin/message/subscribe/send',
    //   ...
    // });

    // ── Step 5: Return success to WeChat ──────────────────────────────────────
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(buildSuccessXml());
  } catch (err) {
    console.error('wechat-payment-callback error:', err);
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(buildFailXml(err.message || 'Internal error'));
  }
};
