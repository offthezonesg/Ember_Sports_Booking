// api/wechat-auth.js - Vercel Serverless Function
// POST /api/wechat-auth
// Body: { code: string }
//
// Flow:
// 1. Exchange WeChat code for openid
// 2. Derive stable credentials from openid
// 3. Try signInWithPassword; if user not found, create user + profile
// 4. Return { access_token, refresh_token, user_id, nickname, is_first_login }

const https = require('https');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Make a GET request using Node's built-in https module.
 * Returns parsed JSON body.
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Set CORS headers on the response.
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Derive a stable password from openid + secret via HMAC-SHA256.
 */
function derivePassword(openid, secret) {
  return crypto.createHmac('sha256', secret).update(openid).digest('hex');
}

// ── Handler ───────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code } = req.body || {};
  if (!code) {
    res.status(400).json({ error: 'Missing code parameter' });
    return;
  }

  // ── Env vars ────────────────────────────────────────────────────────────────
  const WECHAT_APPID = process.env.WECHAT_APPID;
  const WECHAT_SECRET = process.env.WECHAT_SECRET;
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sjrinqsekowhgtikhnvv.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcmlucXNla293aGd0aWtobnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzODY5NTMsImV4cCI6MjA5MTk2Mjk1M30.qeGOQF6G3YOs_LSiSFBC0cGNWU_pVYWrJ50YDciDGj8';

  if (!WECHAT_APPID || !WECHAT_SECRET) {
    console.error('Missing WECHAT_APPID or WECHAT_SECRET env vars');
    res.status(500).json({ error: 'Server configuration error: missing WeChat credentials' });
    return;
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_SERVICE_KEY env var');
    res.status(500).json({ error: 'Server configuration error: missing Supabase service key' });
    return;
  }

  try {
    // ── Step 1: Exchange code for openid ──────────────────────────────────────
    const wxUrl =
      `https://api.weixin.qq.com/sns/jscode2session` +
      `?appid=${WECHAT_APPID}` +
      `&secret=${WECHAT_SECRET}` +
      `&js_code=${encodeURIComponent(code)}` +
      `&grant_type=authorization_code`;

    const wxResult = await httpsGet(wxUrl);

    if (wxResult.errcode) {
      console.error('WeChat jscode2session error:', wxResult);
      const errMap = {
        40029: '无效的 code，请重新获取',
        45011: 'API 调用太频繁，请稍后再试',
        40226: '高风险用户，登录受限',
      };
      const msg = errMap[wxResult.errcode] || `WeChat error ${wxResult.errcode}: ${wxResult.errmsg}`;
      res.status(401).json({ error: msg });
      return;
    }

    const { openid, session_key } = wxResult;
    if (!openid) {
      res.status(401).json({ error: 'No openid returned from WeChat' });
      return;
    }

    // ── Step 2: Derive stable credentials ─────────────────────────────────────
    const email = `wx_${openid}@ember-sports.app`;
    const password = derivePassword(openid, WECHAT_SECRET);

    // ── Step 3: Supabase clients ───────────────────────────────────────────────
    // Admin client (service role) for user management
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Anon client for sign-in
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ── Step 4: Try sign in ────────────────────────────────────────────────────
    let isFirstLogin = false;
    let signInResult = await supabaseAnon.auth.signInWithPassword({ email, password });

    if (signInResult.error) {
      // User likely doesn't exist yet — create them
      if (
        signInResult.error.message.includes('Invalid login credentials') ||
        signInResult.error.message.includes('invalid_credentials') ||
        signInResult.error.status === 400
      ) {
        isFirstLogin = true;

        // Create the auth user
        const createResult = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            wechat_openid: openid,
            source: 'wechat_miniapp',
          },
        });

        if (createResult.error) {
          console.error('createUser error:', createResult.error);
          res.status(500).json({ error: 'Failed to create user account: ' + createResult.error.message });
          return;
        }

        const newUserId = createResult.data.user.id;
        const defaultNickname = `微信用户_${openid.slice(-6)}`;

        // Create profile record
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: newUserId,
            full_name: defaultNickname,
            wechat_openid: openid,
            is_first_login: true,
          });

        if (profileError) {
          // Profile creation failure is non-fatal — log but continue
          console.warn('Profile insert warning:', profileError.message);
        }

        // Now sign in with the newly created user
        signInResult = await supabaseAnon.auth.signInWithPassword({ email, password });

        if (signInResult.error) {
          console.error('signIn after create error:', signInResult.error);
          res.status(500).json({ error: 'Account created but sign-in failed: ' + signInResult.error.message });
          return;
        }
      } else {
        console.error('signInWithPassword unexpected error:', signInResult.error);
        res.status(500).json({ error: 'Authentication failed: ' + signInResult.error.message });
        return;
      }
    }

    const session = signInResult.data.session;
    const user = signInResult.data.user;

    if (!session || !user) {
      res.status(500).json({ error: 'No session returned after sign-in' });
      return;
    }

    // ── Step 5: Fetch nickname from profiles ──────────────────────────────────
    let nickname = `微信用户_${openid.slice(-6)}`;

    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('full_name, is_first_login')
      .eq('id', user.id)
      .single();

    if (profileData && profileData.full_name) {
      nickname = profileData.full_name;
    }

    // Update wechat_openid if not set (for existing users migrated)
    if (!isFirstLogin) {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('wechat_openid')
        .eq('id', user.id)
        .single();

      if (existingProfile && !existingProfile.wechat_openid) {
        await supabaseAdmin
          .from('profiles')
          .update({ wechat_openid: openid })
          .eq('id', user.id);
      }
    }

    // ── Step 6: Return session data ───────────────────────────────────────────
    res.status(200).json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user_id: user.id,
      nickname,
      is_first_login: isFirstLogin,
    });
  } catch (err) {
    console.error('wechat-auth handler error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
