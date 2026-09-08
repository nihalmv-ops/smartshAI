import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';

dotenv.config();

const createAdminCli = async () => {
  try {
    await connectDB();

    const args = process.argv.slice(2);
    const email = (args[0] || 'admin@smartmart.ai').trim().toLowerCase();
    const password = args[1] || 'Admin@123';
    const name = args[2] || 'Store Administrator';
    const phone = args[3] || '+91 99999 11111';

    console.log(`\n🔐 Creating / Updating Administrator Account...`);
    console.log(`   Email: ${email}`);
    console.log(`   Name:  ${name}`);
    console.log(`   Phone: ${phone}\n`);

    let user = await User.findOne({ email });

    if (user) {
      user.role = 'admin';
      user.name = name;
      user.password = password; // pre-save hook will hash it
      user.phone = phone;
      await user.save();
      console.log(`✅ Existing user "${email}" has been successfully upgraded to ADMINISTRATOR!`);
    } else {
      user = await User.create({
        name,
        email,
        password,
        phone,
        address: 'SmartMart AI HQ, Koramangala, Bengaluru',
        role: 'admin'
      });
      console.log(`✅ New ADMINISTRATOR account created successfully for "${email}"!`);
    }

    console.log(`\n📋 Login Credentials:`);
    console.log(`   URL:      http://localhost:5173/admin/login`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     admin\n`);

    process.exit(0);
  } catch (error) {
    console.error(`❌ Failed to create administrator:`, error.message);
    process.exit(1);
  }
};

createAdminCli();
