require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Supabase Client
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log('✅ Supabase Admin (Service Role) client initialized successfully');
} else {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY missing in env. Server will run but cannot write enrollments directly.');
}

const PI_API_KEY = process.env.PI_API_KEY;
if (!PI_API_KEY) {
  console.warn('⚠️ PI_API_KEY missing in .env file. Running in Sandbox Mock Mode for Payments!');
}

/* ════════════ AUTHENTICATION ENDPOINT ════════════ */
app.post('/api/auth/pi', async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'accessToken is required' });
  }

  // 1. Verify access token with Pi Network API
  try {
    console.log(`Authenticating token: ${accessToken.substring(0, 15)}...`);
    const meResponse = await axios.get('https://api.minepi.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const piUser = meResponse.data; // Expected: { uid: string, username: string }
    const { uid, username } = piUser;
    
    console.log(`Pi authentication successful for: ${username} (${uid})`);

    // 2. Generate secure deterministic credentials
    const email = `${username}@pi.me`;
    const salt = SUPABASE_ANON_KEY || 'fitiq-iraq-pi-fallback-salt';
    const password = crypto.createHmac('sha256', salt).update(uid).digest('hex');

    return res.json({
      success: true,
      email,
      password,
      username,
      uid
    });
  } catch (error) {
    console.error('Pi API Auth Error:', error.response?.data || error.message);
    
    // Sandbox / local testing fallback if the request came from sandbox testing but isn't on real Pi Browser
    if (accessToken === 'mock-sandbox-token') {
      console.log('🔑 Mock sandbox token detected. Processing sandbox credentials...');
      const email = 'sandbox_user@pi.me';
      const password = crypto.createHmac('sha256', 'mock').update('mock-uid').digest('hex');
      return res.json({
        success: true,
        email,
        password,
        username: 'sandbox_user',
        uid: 'mock-uid'
      });
    }

    return res.status(401).json({ error: 'Unauthorized Pi Access Token' });
  }
});

/* ════════════ PAYMENTS APPROVAL ENDPOINT ════════════ */
app.post('/api/payments/approve', async (req, res) => {
  const { paymentId } = req.body;

  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId is required' });
  }

  console.log(`Received approval request for payment: ${paymentId}`);

  // Sandbox fallback
  if (!PI_API_KEY || paymentId.startsWith('mock-')) {
    console.log(`[Mock Mode] Payment approved successfully: ${paymentId}`);
    return res.json({ success: true, message: 'Mock payment approved' });
  }

  try {
    const response = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {},
      {
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
        },
      }
    );

    console.log(`Pi Payment Approved via API: ${paymentId}`);
    return res.json(response.data);
  } catch (error) {
    console.error('Pi Approve Payment Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to approve payment with Pi Network' });
  }
});

/* ════════════ PAYMENTS COMPLETION ENDPOINT ════════════ */
app.post('/api/payments/complete', async (req, res) => {
  const { paymentId, txid, courseId, athleteId } = req.body;

  if (!paymentId || !txid) {
    return res.status(400).json({ error: 'paymentId and txid are required' });
  }

  console.log(`Completing payment: ${paymentId} with transaction: ${txid}`);

  // Save enrollment helper
  const recordEnrollment = async (cId, aId) => {
    if (!supabaseAdmin) {
      console.warn('Cannot write enrollment record: Supabase admin client not active.');
      return false;
    }
    try {
      const { error } = await supabaseAdmin
        .from('enrollments')
        .insert({ athlete_id: aId, course_id: cId });
      
      if (error) {
        if (error.code === '23505') {
          console.log(`User ${aId} is already enrolled in course ${cId}`);
          return true;
        }
        throw error;
      }
      console.log(`Successfully enrolled user ${aId} in course ${cId}`);
      return true;
    } catch (err) {
      console.error('Error writing enrollment to database:', err);
      return false;
    }
  };

  // Sandbox fallback
  if (!PI_API_KEY || paymentId.startsWith('mock-')) {
    console.log(`[Mock Mode] Payment completed successfully: ${paymentId}`);
    if (courseId && athleteId) {
      await recordEnrollment(courseId, athleteId);
    }
    return res.json({ success: true, message: 'Mock payment completed' });
  }

  try {
    // 1. Finalize payment with Pi Network
    const response = await axios.post(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      { txid },
      {
        headers: {
          Authorization: `Key ${PI_API_KEY}`,
        },
      }
    );

    console.log(`Pi Payment Completed via API: ${paymentId}`);
    
    // 2. Fetch payment details to obtain metadata
    const paymentDetails = response.data;
    const cId = courseId || paymentDetails.metadata?.courseId;
    const aId = athleteId || paymentDetails.metadata?.athleteId;

    if (cId && aId) {
      await recordEnrollment(cId, aId);
    }

    return res.json({ success: true, details: paymentDetails });
  } catch (error) {
    console.error('Pi Complete Payment Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to complete payment with Pi Network' });
  }
});

/* ════════════ INCOMPLETE PAYMENTS RESOLUTION ENDPOINT ════════════ */
app.post('/api/payments/incomplete', async (req, res) => {
  const { payment } = req.body;

  if (!payment) {
    return res.status(400).json({ error: 'payment details are required' });
  }

  console.log(`Handling incomplete payment: ${payment.identifier}`);

  if (!PI_API_KEY) {
    console.log('[Mock Mode] Handled incomplete payment.');
    return res.json({ success: true });
  }

  try {
    // Check payment status on Pi API
    const getResponse = await axios.get(`https://api.minepi.com/v2/payments/${payment.identifier}`, {
      headers: { Authorization: `Key ${PI_API_KEY}` }
    });

    const paymentDetails = getResponse.data;
    
    if (paymentDetails.status.approved && !paymentDetails.status.completed) {
      console.log(`Incomplete payment ${payment.identifier} is approved but not completed. Completing now.`);
      const compResponse = await axios.post(
        `https://api.minepi.com/v2/payments/${payment.identifier}/complete`,
        { txid: payment.transaction.txid },
        { headers: { Authorization: `Key ${PI_API_KEY}` } }
      );
      
      const cId = paymentDetails.metadata?.courseId;
      const aId = paymentDetails.metadata?.athleteId;
      if (cId && aId && supabaseAdmin) {
        await supabaseAdmin.from('enrollments').insert({ athlete_id: aId, course_id: cId }).catch(() => {});
      }
      
      return res.json({ success: true, status: 'completed', details: compResponse.data });
    }

    return res.json({ success: true, status: paymentDetails.status });
  } catch (err) {
    console.error('Incomplete payment handling error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Error handling incomplete payment' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Pi Network Backend running on http://localhost:${PORT}`);
});
