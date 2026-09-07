import mongoose from 'mongoose';
import dotenv from 'dotenv';
import users from './data/users.js';
import products from './data/products.js';
import categories from './data/categories.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Order from './models/Order.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();
const runSeeder = async () => {
  await connectDB();

  if (process.argv[2] === '-d') {
    await destroyData();
  } else {
    await importData();
  }
};

const importData = async () => {
  try {
    // Clear existing collections
    await Order.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();

    // Insert Users (User.create invokes pre-save hook for password hashing)
    const createdUsers = [];
    for (const user of users) {
      const created = await User.create(user);
      createdUsers.push(created);
    }

    // Insert Categories
    await Category.insertMany(categories);

    // Insert Products
    await Product.insertMany(products);

    console.log('🎉 Data Imported Successfully into MongoDB!');
    process.exit();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Data Import Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();

    console.log('🗑️  Data Destroyed Successfully!');
    process.exit();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Data Destroy Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
runSeeder();
