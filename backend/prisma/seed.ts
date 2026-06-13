import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const restaurant = await prisma.restaurant.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Demo Kitchen',
      gstRate: 0.05,
      currency: 'INR',
    },
  });

  // Tables 1–6
  for (let i = 1; i <= 6; i++) {
    await prisma.table.upsert({
      where: { restaurantId_number: { restaurantId: restaurant.id, number: i } },
      update: {},
      create: { restaurantId: restaurant.id, number: i, zone: i <= 3 ? 'Indoor' : 'Outdoor' },
    });
  }

  // Menu items
  const items = [
    { name: 'Masala Dosa',      category: 'Breakfast', price: 120, description: 'Crispy dosa with spiced potato filling' },
    { name: 'Idli Sambar',      category: 'Breakfast', price: 80,  description: 'Steamed rice cakes with lentil soup' },
    { name: 'Paneer Butter Masala', category: 'Main Course', price: 280, description: 'Cottage cheese in rich tomato gravy' },
    { name: 'Dal Tadka',        category: 'Main Course', price: 180, description: 'Yellow lentils tempered with spices' },
    { name: 'Butter Naan',      category: 'Breads',    price: 60,  description: 'Soft leavened bread with butter' },
    { name: 'Mango Lassi',      category: 'Drinks',    price: 90,  description: 'Chilled mango yoghurt drink' },
    { name: 'Gulab Jamun',      category: 'Desserts',  price: 80,  description: 'Soft milk-solid dumplings in sugar syrup' },
    { name: 'Veg Biryani',      category: 'Main Course', price: 220, description: 'Fragrant basmati rice with vegetables' },
  ];

  for (const item of items) {
    await prisma.menuItem.upsert({
      where: { id: items.indexOf(item) + 1 },
      update: {},
      create: { restaurantId: restaurant.id, ...item },
    });
  }

  // Staff users
  const staff = [
    { email: 'manager@demo.com',  role: 'manager',  password: 'manager123' },
    { email: 'kitchen@demo.com',  role: 'kitchen',  password: 'kitchen123' },
    { email: 'floor@demo.com',    role: 'floor',    password: 'floor123'   },
  ];

  for (const s of staff) {
    const hash = await bcrypt.hash(s.password, 10);
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, passwordHash: hash, role: s.role, restaurantId: restaurant.id },
    });
  }

  console.log('Seed complete — restaurant, 6 tables, 8 menu items, 3 staff users');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
