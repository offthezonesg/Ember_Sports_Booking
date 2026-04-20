// api/create-wechat-payment.js - Vercel Serverless Function
// POST /api/create-wechat-payment
// Body: { bookingId, amount, currency, description, openid }
//
// Flow:
// 1. Validate request
// 2. Call WeChat Pay Unified Order API to get prepay_id
// 3. Sign the payment parameters for wx.requestPayment()
// 4. Return payment parameters to mini program
//
// Required env vars:
//   WECHAT_APPID - Mini Program AppID
//   WECHAT_MCH_ID - WeChat Pay merchant ID
//   WECHAT_MCH_KEY - WeChat Pay merchant API key
//   WECHAT_MCH_SERIAL_NO - Merchant certificate serial number (for v3 API)
//   WECHAT_MCH_PRIVATE_KEY - Merchant private key (for v3 API)

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// ── Helpers ──────────────────────────────────────────────────────────────────

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Generate a random string for nonce_str.
 */
function generateNonceStr(length = 32) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Generate a merchant trade number (out_trade_no).
 */
function generateOutTradeNo() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EM${timestamp}${random}`;
}

/**
 * Create a signature for WeChat Pay API v2 (MD5).
 * For production, consider using v3 with RSA signing.
 */
function createSignature(params, apiKey) {
  // 1. Sort parameters by key alphabetically
  const sortedKeys = Object.keys(params).sort();
  // 2. Build query string: key=value&key=value
  const queryString = sortedKeys
    .filter((key) => params[key] !== '' && params[key] !== undefined && params[key] !== null)
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  // 3. Append API key
  const stringSignTemp = `${queryString}&key=${apiKey}`;
  // 4. MD5 hash and uppercase
  return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
}

/**
 * Sign the payment parameters returned to the mini program for wx.requestPayment().
 */
function signPaymentParams(appId, timeStamp, nonceStr, packageValue, signType, apiKey) {
  const params = {
    appId,
    timeStamp,
    nonceStr,
    package: packageValue,
    signType,
  };
  return createSignature(params, apiKey);
}

// ── Handler ───────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { bookingId, amount, currency = 'CNY', description, openid } = req.body || {};

  if (!bookingId || !amount || !openid) {
    res.status(400).json({
      error: 'Missing required fields',
      required: ['bookingId', 'amount', 'openid'],
    });
    return;
  }

  // ── Env vars ────────────────────────────────────────────────────────────────
  const WECHAT_APPID = process.env.WECHAT_APPID;
  const WECHAT_MCH_ID = process.env.WECHAT_MCH_ID;
  const WECHAT_MCH_KEY = process.env.WECHAT_MCH_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sjrinqsekowhgtikhnvv.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!WECHAT_APPID || !WECHAT_MCH_ID || !WECHAT_MCH_KEY) {
    console.error('Missing WeChat Pay credentials');
    // Return mock payment in development
    res.status(200).json({
      mock: true,
      message: 'WeChat Pay not configured - mock payment',
      paymentParams: null,
      out_trade_no: generateOutTradeNo(),
    });
    return;
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_SERVICE_KEY');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  try {
    // ── Step 1: Verify booking exists and is pending ──────────────────────────
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, status, payment_status, total_amount')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.status !== 'pending' || booking.payment_status !== 'unpaid') {
      res.status(400).json({ error: 'Booking is not in pending/unpaid state' });
      return;
    }

    // ── Step 2: Create WeChat Pay unified order ───────────────────────────────
    // Using WeChat Pay API v2 (XML-based, simpler setup)
    // For production, consider upgrading to v3 (JSON-based, more secure)

    const out_trade_no = generateOutTradeNo();
    const nonce_str = generateNonceStr();

    const unifiedOrderParams = {
      appid: WECHAT_APPID,
      mch_id: WECHAT_MCH_ID,
      nonce_str,
      sign_type: 'MD5',
      body: description || `合拍社场地预约 - ${bookingId.slice(0, 8)}`,
      out_trade_no,
      total_fee: Math.round(amount * 100), // Convert to fen (cents)
      spbill_create_ip: '127.0.0.1', // Server IP
      notify_url: `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://ember-sports-booking-site.vercel.app'}/api/wechat-payment-callback`,
      trade_type: 'JSAPI',
      openid,
    };

    // Sign the unified order params
    unifiedOrderParams.sign = createSignature(unifiedOrderParams, WECHAT_MCH_KEY);

    // Build XML body for WeChat Pay v2 API
    const xmlBody = '<xml>' +
      Object.entries(unifiedOrderParams)
        .map(([key, val]) => `<${key}>${val}</${key}>`)
        .join('') +
      '</xml>';

    // ── Step 3: Call WeChat Pay API ───────────────────────────────────────────
    // TODO: Use node-fetch or https to call https://api.mch.weixin.qq.com/pay/unifiedorder
    // For now, this is a scaffold - the actual HTTP call needs to be implemented
    // when you have WeChat Pay merchant credentials

    /*
    const fetch = require('node-fetch');
    const wxResponse = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
      method: 'POST',
      body: xmlBody,
      headers: { 'Content-Type': 'application/xml' },
    });
    const wxResultXml = await wxResponse.text();
    // Parse XML response and extract prepay_id
    // const prepay_id = parseXml(wxResultXml).prepay_id;
    */

    // ── Step 4: Generate payment params for wx.requestPayment() ───────────────
    /*
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = generateNonceStr();
    const packageValue = `prepay_id=${prepay_id}`;
    const paySign = signPaymentParams(
      WECHAT_APPID, timeStamp, nonceStr, packageValue, 'MD5', WECHAT_MCH_KEY
    );

    // Update booking with out_trade_no
    await supabaseAdmin
      .from('bookings')
      .update({
        out_trade_no,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    res.status(200).json({
      paymentParams: {
        timeStamp,
        nonceStr,
        package: packageValue,
        signType: 'MD5',
        paySign,
      },
      out_trade_no,
    });
    */

    // Scaffold response - remove when WeChat Pay is configured
    res.status(200).json({
      mock: true,
      message: 'WeChat Pay unified order scaffold - configure credentials to enable',
      out_trade_no,
    });
  } catch (err) {
    console.error('create-wechat-payment error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
