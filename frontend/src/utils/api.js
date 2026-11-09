export const api = async (path, method = 'GET', body) => {
  const t = localStorage.getItem(path.startsWith('customers/me') ? 'bd_ctoken' : 'bd_token');
  const r = await fetch('/api/' + path, { method, headers: { 'Content-Type': 'application/json', ...(t && { Authorization: 'Bearer ' + t }) }, body: body && JSON.stringify(body) });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || 'Something went wrong'); return d;
};
export const PHONES = ['03229554736', '03067866727'];
export const CATS = [['breakfast','☕','Breakfast'],['grocery','🛒','Grocery'],['meat','🥩','Meat'],['vegetables','🥬','Vegetables, Fruits'],['desi','🍛','Hotel & Desi Foods'],['fastfood','🍕','Fast Food & Bakery'],['medical','➕','Medical Store'],['ladies','🛍️','Ladies Care'],['home','🧴','Home Essentials'],['kids','🧸','Kids & Beauty'],['rickshaw','🛺','Rickshaw Pick & Drop'],['restaurant','🍽️','Hotel & Restaurant Food'],['mobile','📱','Mobile Repair & Accessories']];
