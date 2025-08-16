import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';

const app = express();
app.use(express.json());

const {
  SHOPIFY_APP_PROXY_SECRET,
  CD_API_BASE = 'https://marketplace-api.centraldispatch.com',
  CD_PRICING_API = 'https://market-intelligence-api.centraldispatch.com/price/estimate', // TODO: confirma con CD
  CD_API_BEARER,
  PORT = 3000
} = process.env;

// Validación opcional del HMAC de Shopify App Proxy
function verifyShopifyProxy(req) {
  if (!SHOPIFY_APP_PROXY_SECRET) return true;
  const { signature, ...query } = req.query ?? {};
  const message = Object.keys(query || {}).sort().map(k => `${k}=${query[k]}`).join('');
  const digest = crypto.createHmac('sha256', SHOPIFY_APP_PROXY_SECRET).update(message).digest('hex');
  return signature === digest;
}

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/apps/cd-quote', async (req, res) => {
  try {
    if (!verifyShopifyProxy(req)) {
      return res.status(401).json({ error: 'Proxy inválido' });
    }

    const {
      orig_zip, dest_zip, vehicle_year, vehicle_make, vehicle_model,
      running, enclosed, ready_date
    } = req.body || {};

    if (!orig_zip || !dest_zip) throw new Error('Origen y destino son obligatorios');
    if (!vehicle_year || !vehicle_make || !vehicle_model) throw new Error('Datos del vehículo incompletos');
    if (!CD_API_BEARER) throw new Error('Falta CD_API_BEARER en el servidor');

    const payload = {
      origin: { postalCode: String(orig_zip) },
      destination: { postalCode: String(dest_zip) },
      vehicle: {
        year: Number(vehicle_year),
        make: String(vehicle_make),
        model: String(vehicle_model),
        operable: String(running) === 'true'
      },
      equipment: { enclosed: String(enclosed) === 'true' },
      readyDate: String(ready_date)
    };

    const cdRes = await fetch(CD_PRICING_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CD_API_BEARER}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await cdRes.text();
    let cdData = null;
    try { cdData = JSON.parse(text); } catch (_) { /* keep raw text */ }

    if (!cdRes.ok) {
      return res.status(502).json({ error: 'CD API error', details: text });
    }

    const estimate = {
      low: cdData?.rangeLow ?? null,
      high: cdData?.rangeHigh ?? null,
      currency: cdData?.currency ?? 'USD',
      formatted: (cdData?.amount != null) ? `$${Number(cdData.amount).toFixed(0)} USD` : null
    };

    return res.json({ ok: true, estimate, raw: cdData ?? text });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
