// Sends each new order to the shop owner's WhatsApp from the SERVER (the customer never leaves the website).
// Option A (easy, free, one number): CallMeBot  -> set CALLMEBOT_APIKEY
// Option B (official):               WhatsApp Cloud API -> set WHATSAPP_TOKEN + WHATSAPP_PHONE_ID
const TO = (process.env.WHATSAPP_TO || '923095179963').replace(/\D/g, '');
const rs = n => 'Rs ' + Number(n || 0).toLocaleString('en-US');

export const orderText = o => [
  '🛒 *NEW ORDER – ByDoor EXPRESS*',
  `Order #${String(o._id).slice(-5).toUpperCase()}`,
  new Date(o.createdAt || Date.now()).toLocaleString('en-GB', { timeZone: 'Asia/Karachi' }),
  '',
  '*CUSTOMER*',
  `Name: ${o.name}`,
  `Phone: ${o.phone}`,
  `Address: ${o.address}`,
  ...(o.note ? [`Note: ${o.note}`] : []),
  ...(o.lat != null && o.lng != null ? [`Location: https://maps.google.com/?q=${o.lat},${o.lng}`] : []),
  '',
  '*ORDER DETAILS*',
  ...o.items.map((i, k) => `${k + 1}. ${i.name} × ${i.qty} = ${rs(i.price * i.qty)}`),
  '',
  `Subtotal: ${rs(o.subtotal)}`,
  `Delivery charges: ${rs(o.delivery)}`,
  `*TOTAL: ${rs(o.total)}*`,
].join('\n');

export async function notifyOwner(order) {
  const text = orderText(order), ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 7000);
  try {
    if (process.env.CALLMEBOT_APIKEY) {
      const r = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${TO}&text=${encodeURIComponent(text)}&apikey=${process.env.CALLMEBOT_APIKEY}`, { signal: ctl.signal });
      if (!r.ok) console.error('CallMeBot error:', r.status, (await r.text()).slice(0, 200)); return r.ok;
    }
    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
      const r = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST', signal: ctl.signal, headers: { Authorization: 'Bearer ' + process.env.WHATSAPP_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: TO, type: 'text', text: { body: text } }) });
      if (!r.ok) console.error('WhatsApp Cloud API error:', r.status, (await r.text()).slice(0, 300)); return r.ok;
    }
    console.warn('WhatsApp not configured: set CALLMEBOT_APIKEY (or WHATSAPP_TOKEN + WHATSAPP_PHONE_ID)'); return false;
  } catch (e) { console.error('WhatsApp notify failed:', e.message); return false; }
  finally { clearTimeout(timer); }
}
