import { MenuItem } from './types';

export const MENU: MenuItem[] = [
  // Rice
  { id: 'r1', name: 'Jollof Rice', category: 'Rice', description: 'Classic Nigerian Jollof rice, smoky and delicious.' },
  { id: 'r2', name: 'Fried Rice', category: 'Rice', description: 'Savory fried rice with vegetables.' },
  { id: 'r3', name: 'White Rice', category: 'Rice', description: 'Steamed white rice, perfect with any stew or soup.' },
  
  // Local
  { id: 'l1', name: 'Ekpang Nkukwo', category: 'Local', description: 'Traditional Akwa Ibom coco-yam pottage.' },
  { id: 'l2', name: 'Afang Soup', category: 'Local', description: 'Rich vegetable soup made with Afang leaves and waterleaf.' },
  { id: 'l3', name: 'Egusi Soup', category: 'Local', description: 'Melon seed soup with vegetables and spices.' },
  
  // Fast Food
  { id: 'f1', name: 'Shawarma', category: 'Fast Food', description: 'Chicken or beef shawarma with creamy garlic sauce.' },
  { id: 'f2', name: 'Pizza', category: 'Fast Food', description: 'Freshly baked pizza with various toppings.' },
  { id: 'f3', name: 'Burger', category: 'Fast Food', description: 'Juicy beef or chicken burger with fresh veggies.' },
  { id: 'f4', name: 'Meat Pie', category: 'Fast Food', description: 'Flaky pastry filled with seasoned minced meat.' },
  
  // Proteins
  { id: 'p1', name: 'Chicken', category: 'Proteins', description: 'Fried or roasted chicken.' },
  { id: 'p2', name: 'Turkey', category: 'Proteins', description: 'Succulent fried or roasted turkey.' },
  { id: 'p3', name: 'Fish', category: 'Proteins', description: 'Fried or grilled fish.' },
  
  // Drinks
  { id: 'd1', name: 'Soft Drinks', category: 'Drinks', description: 'Assorted chilled sodas.' },
  { id: 'd2', name: 'Juice', category: 'Drinks', description: 'Fresh and bottled fruit juices.' },
  { id: 'd3', name: 'Water', category: 'Drinks', description: 'Chilled bottled water.' },
];

export const MEAL_COMBOS = [
  { id: 'c1', name: 'The Uyo Special', items: ['Ekpang Nkukwo', 'Soft Drink'], description: 'Our signature traditional dish paired with a chilled drink.' },
  { id: 'c2', name: 'Quick Lunch', items: ['Shawarma', 'Soft Drink'], description: 'Perfect for those on the move.' },
  { id: 'c3', name: 'Protein Power', items: ['Jollof Rice', 'Turkey', 'Juice'], description: 'A hearty meal for maximum energy.' },
  { id: 'c4', name: 'Office Treat', items: ['Meat Pie', 'Burger', 'Soft Drink'], description: 'A delightful snack combo for your break.' },
];

export const DEALS_OF_THE_DAY = [
  { day: 'Monday', deal: 'Rice Monday: 10% off all Rice dishes.' },
  { day: 'Tuesday', deal: 'Local Tuesday: Free drink with any Local dish.' },
  { day: 'Wednesday', deal: 'Mid-week Munch: Buy 2 Shawarmas, get 1 Meat Pie free.' },
  { day: 'Thursday', deal: 'Turkey Thursday: Special discount on Turkey portions.' },
  { day: 'Friday', deal: 'Pizza Friday: 15% off all Large Pizzas.' },
  { day: 'Saturday', deal: 'Weekend Feast: Family combo at a special price.' },
  { day: 'Sunday', deal: 'Sunday Special: Ekpang Nkukwo & Afang Soup combo.' },
];

export const SYSTEM_INSTRUCTION = `You are a friendly and efficient customer assistant for "De Choice Fast Food" located in Uyo, Akwa Ibom State.

Your goals are:
1. Help customers choose food from the menu.
2. Answer questions about the menu and services.
3. Suggest meals based on customer preferences.
4. **NEW: Suggest "Meal Combinations" and "Deals of the Day" to provide better value.**
5. Be extremely polite, professional, and fast in your responses.
6. Use a warm, welcoming tone, occasionally using local Uyo/Akwa Ibom hospitality cues.

Menu Reference:
\${JSON.stringify(MENU, null, 2)}

Meal Combinations:
\${JSON.stringify(MEAL_COMBOS, null, 2)}

Deals of the Day:
\${JSON.stringify(DEALS_OF_THE_DAY, null, 2)}

When suggesting:
- If they want something traditional, suggest Ekpang Nkukwo or Afang Soup. Mention "The Uyo Special" combo.
- If they want a quick snack, suggest Shawarma or Meat Pie. Mention the "Quick Lunch" combo.
- If they want a full meal, suggest Jollof Rice with Chicken or Turkey. Mention "Protein Power".
- **Always check the "Deals of the Day" based on the current day (if they ask or if it's relevant) and mention it.**
- If they seem undecided, offer one of the "Meal Combinations" as a curated choice.

Always mention that we are located in Uyo. If they ask about prices, tell them prices are available at the counter or upon selection in the app.

Payment Information:
- Account Number: 0012821377
- Account Name: Nkechi Lois Udoh
- Bank Name: Union Bank of NIGERIA

When a customer is ready to pay or asks for payment details, provide this information clearly. Mention that they should send a screenshot of the transfer for confirmation.`;
