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
  '',
  o.paymentMethod === 'advance' ? `*PAYMENT: Advance (already sent)*\n${o.paymentAccount ? 'Paid to: ' + o.paymentAccount + '\n' : ''}Transaction ID: ${o.paymentRef || '-'}\nPlease verify before confirming.` : '*PAYMENT: Cash on Delivery*',
].join('\n');

const clean = t => String(t || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220);

// Returns { ok, reason, provider } and never throws
export async function notifyOwner(order) {
  const text = orderText(order), ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 8000);
  try {
    if (process.env.CALLMEBOT_APIKEY) {
      const key = process.env.CALLMEBOT_APIKEY.trim(), r = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${TO}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(key)}`, { signal: ctl.signal });
      const body = clean(await r.text()), bad = !r.ok || /error|invalid|not\s+(found|allowed|activated)|blocked|wrong/i.test(body);
      if (bad) console.error('CallMeBot error:', r.status, body);
      return { ok: !bad, provider: 'callmebot', reason: bad ? `CallMeBot (${r.status}): ${body || 'no reply'}` : '' };
    }
    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
      const r = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST', signal: ctl.signal, headers: { Authorization: 'Bearer ' + process.env.WHATSAPP_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: TO, type: 'text', text: { body: text } }) });
      const body = clean(await r.text()); if (!r.ok) console.error('WhatsApp Cloud API error:', r.status, body);
      return { ok: r.ok, provider: 'cloud', reason: r.ok ? '' : `WhatsApp Cloud API (${r.status}): ${body}` };
    }
    console.warn('WhatsApp not configured');
    return { ok: false, provider: 'none', reason: 'Not configured: the server has no CALLMEBOT_APIKEY (add it in Vercel > Settings > Environment Variables, then redeploy)' };
  } catch (e) { console.error('WhatsApp notify failed:', e.message); return { ok: false, provider: 'error', reason: e.name === 'AbortError' ? 'Timed out reaching the WhatsApp service' : e.message }; }
  finally { clearTimeout(timer); }
}
