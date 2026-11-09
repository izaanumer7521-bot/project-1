import bcrypt from 'bcryptjs'; import { Admin, Banner, Product, Review, Category, Setting } from '../models/index.js';
const P = [['Halwa Puri Plate','breakfast',350,'per plate','Chana, halwa, 2 puri'],['Nihari','breakfast',450,'per plate','Slow-cooked beef nihari with naan'],
['Aata (Flour)','grocery',1450,'10 kg','Fine chakki aata'],['Basmati Rice','grocery',520,'per kg','Premium long grain'],['Cooking Oil','grocery',600,'1 litre','Pure cooking oil'],
['Chicken','meat',650,'per kg','Fresh, cleaned'],['Mutton','meat',2300,'per kg','Fresh local mutton'],
['Seasonal Vegetables','vegetables',200,'per kg','Farm fresh'],['Fresh Milk','vegetables',220,'per litre','Pure daily milk'],['Eggs','vegetables',380,'per dozen','Farm eggs'],
['Chicken Biryani','desi',380,'per plate','With raita'],['Daal Chawal','desi',250,'per plate','Home-style'],
['Zinger Burger','fastfood',420,'each','Crispy fillet'],['Large Pizza','fastfood',1500,'each','Fajita / Tikka'],['Chicken Shawarma','fastfood',250,'each','Garlic sauce'],
['Paracetamol Strip','medical',40,'per strip','Pharmacy item'],['Baby Diapers','medical',1200,'pack','Size M'],
['Sanitary Pads','ladies',250,'pack','Delivered in plain bag'],['Surf Detergent','home',650,'1 kg','Washing powder'],['Bath Soap','home',90,'each','Family soap'],
['Baby Cerelac','kids',780,'each','Baby food'],['Teddy Bear','kids',900,'each','Soft toy'],
['Local Rickshaw Ride','rickshaw',300,'per trip','City / school / hospital'],['Karahi Dinner','restaurant',1800,'half kg','Chicken karahi + naan'],
['Screen Protector','mobile',300,'each','All models'],['Fast Charger','mobile',900,'each','Type-C 33W']];
export default async () => {
  if (!(await Admin.countDocuments())) await Admin.create({ email: process.env.ADMIN_EMAIL, password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10) });
  if (!(await Banner.countDocuments())) await Banner.insertMany([
    { title: 'Everything You Need. One Call.', subtitle: 'Fast & safe delivery at your doorstep in Vihari City' },
    { title: 'Jo Ap Kahein, Hum Le Aayen!', subtitle: 'On-demand grocery and anything else you need' },
    { title: 'Fresh Breakfast, Hot at Your Door', subtitle: 'Halwa Puri, Nihari, Paye, Paratha' }]);
  if (!(await Product.countDocuments())) await Product.insertMany(P.map(([name, category, price, unit, description]) => ({ name, category, price, unit, description })));
  if (!(await Review.countDocuments())) await Review.insertMany([
    { name: 'Ayesha K.', rating: 5, text: 'Ordered groceries at night and they arrived in 30 minutes. Very polite rider!' },
    { name: 'Hamza R.', rating: 5, text: 'Breakfast was hot and fresh. Now my Sunday routine.' },
    { name: 'Sana M.', rating: 4, text: 'Private delivery in a plain bag was very thoughtful. Great service.' }]);

  if (!(await Category.countDocuments())) {
    const C = [['breakfast','☕','Breakfast'],['grocery','🛒','Grocery'],['meat','🥩','Meat'],['vegetables','🥬','Vegetables & Fruits'],['desi','🍛','Hotel & Desi Foods'],['fastfood','🍕','Fast Food & Bakery'],['medical','➕','Medical Store'],['ladies','🛍️','Ladies Care'],['home','🧴','Home Essentials'],['kids','🧸','Kids & Beauty'],['rickshaw','🛺','Rickshaw Pick & Drop'],['restaurant','🍽️','Hotel & Restaurant Food'],['mobile','📱','Mobile Repair & Accessories']];
    await Category.insertMany(C.map(([key, emoji, name], i) => ({ key, emoji, name, sort: i + 1 })));
    await Product.updateMany({ name: { $in: ['Chicken Biryani', 'Zinger Burger', 'Halwa Puri Plate', 'Large Pizza', 'Chicken', 'Fresh Milk'] } }, { bestSeller: true });
    await Product.updateOne({ name: 'Karahi Dinner' }, { hotDeal: true, oldPrice: 2100 });
    await Product.updateOne({ name: 'Large Pizza' }, { hotDeal: true, oldPrice: 1800 });
    await Product.updateOne({ name: 'Aata (Flour)' }, { hotDeal: true, oldPrice: 1600 });
  }
  if (!(await Setting.countDocuments())) await Setting.create({ area: 'Vihari City', deliveryTitle: 'Delivery: Today', deliverySub: 'Fast & safe delivery', phone1: '03229554736', phone2: '03067866727', hours: '7 AM – 12 AM',
    helpText: 'Need help with an order? Call or WhatsApp us any time between 7 AM and 12 AM. Tell us what you need and we will deliver it to your doorstep.',
    aboutUs: 'ByDoor EXPRESS is a local delivery service for Vihari City. Groceries, food, medicines, rickshaw pick & drop and mobile repair, all from one place with one call. Har Zaroorat, Ab Aapke Ghar Tak!',
    privacy: 'We only keep the details you give us (your mobile number, name and delivery address) so we can deliver your orders. We never sell your information. Ladies Care orders are delivered privately in a plain bag.' });
};
