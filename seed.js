const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Supplier = require('./models/Supplier');
const Cheque = require('./models/Cheque');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cashflow-app');
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Supplier.deleteMany({});
    await Cheque.deleteMany({});
    console.log('Cleared existing data');

    // Create demo user
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@cashflow.com',
      password: 'demo123',
      role: 'admin'
    });
    console.log('Created demo user');

    // Create suppliers
    const suppliers = await Supplier.insertMany([
      {
        name: 'ABC Electronics Ltd',
        email: 'contact@abcelectronics.com',
        phone: '+1-555-0101',
        address: {
          street: '123 Electronics St',
          city: 'Tech City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        bankDetails: {
          bankName: 'Tech Bank',
          accountNumber: '1234567890',
          routingNumber: '111000025'
        },
        createdBy: demoUser._id
      },
      {
        name: 'Global Supplies Inc',
        email: 'orders@globalsupplies.com',
        phone: '+1-555-0102',
        address: {
          street: '456 Supply Ave',
          city: 'Commerce City',
          state: 'TX',
          zipCode: '75001',
          country: 'USA'
        },
        bankDetails: {
          bankName: 'Commerce Bank',
          accountNumber: '0987654321',
          routingNumber: '111000026'
        },
        createdBy: demoUser._id
      },
      {
        name: 'Premium Services LLC',
        email: 'billing@premiumservices.com',
        phone: '+1-555-0103',
        address: {
          street: '789 Service Blvd',
          city: 'Service Town',
          state: 'FL',
          zipCode: '33101',
          country: 'USA'
        },
        createdBy: demoUser._id
      }
    ]);
    console.log('Created suppliers');

    // Create cheques with various dates and statuses
    const today = new Date();
    const cheques = [];

    // Past due cheques
    cheques.push({
      chequeNumber: 'CHK-001',
      amount: 2500.00,
      issueDate: new Date(today.getTime() - (15 * 24 * 60 * 60 * 1000)), // 15 days ago
      dueDate: new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000)), // 5 days ago
      supplier: suppliers[0]._id,
      status: 'pending',
      description: 'Office equipment purchase',
      bankAccount: 'Main Business Account',
      reference: 'PO-2024-001',
      createdBy: demoUser._id
    });

    // Due today
    cheques.push({
      chequeNumber: 'CHK-002',
      amount: 1750.50,
      issueDate: new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)),
      dueDate: today,
      supplier: suppliers[1]._id,
      status: 'pending',
      description: 'Monthly supplies order',
      bankAccount: 'Main Business Account',
      reference: 'INV-2024-045',
      createdBy: demoUser._id
    });

    // Due in 3 days
    cheques.push({
      chequeNumber: 'CHK-003',
      amount: 3200.00,
      issueDate: today,
      dueDate: new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000)),
      supplier: suppliers[2]._id,
      status: 'pending',
      description: 'Professional services consultation',
      bankAccount: 'Main Business Account',
      reference: 'SRV-2024-012',
      createdBy: demoUser._id
    });

    // Due in 7 days
    cheques.push({
      chequeNumber: 'CHK-004',
      amount: 950.75,
      issueDate: today,
      dueDate: new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)),
      supplier: suppliers[0]._id,
      status: 'pending',
      description: 'Software licensing renewal',
      bankAccount: 'Main Business Account',
      reference: 'LIC-2024-SW01',
      createdBy: demoUser._id
    });

    // Cleared cheque
    cheques.push({
      chequeNumber: 'CHK-005',
      amount: 1500.00,
      issueDate: new Date(today.getTime() - (20 * 24 * 60 * 60 * 1000)),
      dueDate: new Date(today.getTime() - (10 * 24 * 60 * 60 * 1000)),
      supplier: suppliers[1]._id,
      status: 'cleared',
      description: 'Previous month utilities',
      bankAccount: 'Main Business Account',
      reference: 'UTIL-2024-11',
      clearanceDate: new Date(today.getTime() - (8 * 24 * 60 * 60 * 1000)),
      createdBy: demoUser._id
    });

    // Future cheques
    for (let i = 6; i <= 10; i++) {
      cheques.push({
        chequeNumber: `CHK-${String(i).padStart(3, '0')}`,
        amount: Math.floor(Math.random() * 5000) + 500,
        issueDate: today,
        dueDate: new Date(today.getTime() + (Math.floor(Math.random() * 30 + 10) * 24 * 60 * 60 * 1000)),
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)]._id,
        status: 'pending',
        description: `Sample payment ${i}`,
        bankAccount: 'Main Business Account',
        reference: `REF-2024-${String(i).padStart(3, '0')}`,
        createdBy: demoUser._id
      });
    }

    await Cheque.insertMany(cheques);
    console.log('Created sample cheques');

    console.log('\n=== SEED DATA COMPLETED ===');
    console.log('Demo User Credentials:');
    console.log('Email: demo@cashflow.com');
    console.log('Password: demo123');
    console.log(`\nCreated ${suppliers.length} suppliers and ${cheques.length} cheques`);
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

const runSeed = async () => {
  await connectDB();
  await seedData();
};

runSeed();
