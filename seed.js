const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Supplier = require('./models/Supplier');
const Customer = require('./models/Customer');
const Sales = require('./models/Sales');
const Purchase = require('./models/Purchase');
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
    await Customer.deleteMany({});
    await Sales.deleteMany({});
    await Purchase.deleteMany({});
    await Cheque.deleteMany({});
    console.log('Cleared existing data');

    const today = new Date();

    // Create demo user
    const demoUser = await User.create({
      name: 'Demo User',
      email: 'demo@cashflow.com',
      password: 'demo123',
      role: 'admin'
    });
    console.log('Created demo user');    // Create suppliers
    const suppliers = await Supplier.insertMany([
      {
        name: 'ABC Electronics Ltd',
        email: 'contact@abcelectronics.lk',
        phone: '0112345678',
        address: {
          street: '123 Electronics St',
          city: 'Colombo',
          state: 'Western',
          zipCode: '00100',
          country: 'Sri Lanka'
        },
        bankDetails: {
          bankName: 'Commercial Bank',
          accountNumber: '1234567890',
          routingNumber: '111000025'
        },
        createdBy: demoUser._id
      },
      {
        name: 'Global Supplies Inc',
        email: 'orders@globalsupplies.lk',
        phone: '0114567890',
        address: {
          street: '456 Supply Ave',
          city: 'Kandy',
          state: 'Central',
          zipCode: '20000',
          country: 'Sri Lanka'
        },
        bankDetails: {
          bankName: 'People\'s Bank',
          accountNumber: '0987654321',
          routingNumber: '111000026'
        },
        createdBy: demoUser._id
      },
      {
        name: 'Premium Services LLC',
        email: 'billing@premiumservices.lk',
        phone: '0117890123',
        address: {
          street: '789 Service Blvd',
          city: 'Galle',
          state: 'Southern',
          zipCode: '80000',
          country: 'Sri Lanka'
        },
        createdBy: demoUser._id
      }
    ]);
    console.log('Created suppliers');

    // Create customers
    const customers = await Customer.insertMany([
      {
        customerCode: 'CUST001',
        personalInfo: {
          name: 'John Silva',
          phone: '0712345678',
          email: 'john.silva@email.com',
          address: '123 Main Street, Colombo 03',
          identificationNumber: '199012345678'
        },
        creditProfile: {
          rating: 8,
          creditLimit: 50000,
          availableCredit: 45000,
          paymentTerms: 30,
          riskCategory: 'low'
        },
        createdBy: demoUser._id
      },
      {
        customerCode: 'CUST002',
        personalInfo: {
          name: 'Mary Fernando',
          phone: '0776543210',
          email: 'mary.fernando@email.com',
          address: '456 Galle Road, Colombo 06',
          identificationNumber: '198509876543'
        },
        creditProfile: {
          rating: 6,
          creditLimit: 25000,
          availableCredit: 20000,
          paymentTerms: 15,
          riskCategory: 'medium'
        },
        createdBy: demoUser._id
      },
      {
        customerCode: 'CUST003',
        personalInfo: {
          name: 'David Perera',
          phone: '0701234567',
          email: 'david.perera@email.com',
          address: '789 Kandy Road, Maharagama',
          identificationNumber: '199212345678v'
        },
        creditProfile: {
          rating: 4,
          creditLimit: 10000,
          availableCredit: 5000,
          paymentTerms: 7,
          riskCategory: 'high'
        },
        createdBy: demoUser._id
      }
    ]);
    console.log('Created customers');

    // Create sales transactions
    const sales = await Sales.insertMany([
      {
        transactionId: 'SAL001',
        customerId: customers[0]._id,
        items: [
          {
            productName: 'Laptop Dell Inspiron',
            quantity: 2,
            unitPrice: 85000,
            totalPrice: 170000
          },
          {
            productName: 'Wireless Mouse',
            quantity: 2,
            unitPrice: 2500,
            totalPrice: 5000
          }
        ],
        transactionSummary: {
          subtotal: 175000,
          tax: 26250,
          discount: 5000,
          totalAmount: 196250
        },
        paymentDetails: {
          paymentMethod: 'mixed',
          cashAmount: 100000,
          creditAmount: 96250,
          dueDate: new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000))
        },
        status: 'completed',
        salesPerson: 'Ravi Kumara',
        createdBy: demoUser._id
      },
      {
        transactionId: 'SAL002',
        customerId: customers[1]._id,
        items: [
          {
            productName: 'Office Chair',
            quantity: 5,
            unitPrice: 12000,
            totalPrice: 60000
          }
        ],
        transactionSummary: {
          subtotal: 60000,
          tax: 9000,
          discount: 2000,
          totalAmount: 67000
        },
        paymentDetails: {
          paymentMethod: 'cash',
          cashAmount: 67000,
          creditAmount: 0
        },
        status: 'completed',
        salesPerson: 'Saman Liyanage',
        createdBy: demoUser._id
      },
      {
        transactionId: 'SAL003',
        customerId: customers[2]._id,
        items: [
          {
            productName: 'Printer HP LaserJet',
            quantity: 1,
            unitPrice: 45000,
            totalPrice: 45000
          }
        ],
        transactionSummary: {
          subtotal: 45000,
          tax: 6750,
          discount: 1000,
          totalAmount: 50750
        },
        paymentDetails: {
          paymentMethod: 'credit',
          cashAmount: 0,
          creditAmount: 50750,
          dueDate: new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000))
        },
        status: 'pending',
        salesPerson: 'Nimal Silva',
        createdBy: demoUser._id
      }
    ]);
    console.log('Created sales transactions');

    // Create purchase orders
    const purchases = await Purchase.insertMany([
      {
        purchaseOrderId: 'PO001',
        supplierId: suppliers[0]._id,
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            productName: 'Desktop Computers',
            quantity: 10,
            unitCost: 75000,
            totalCost: 750000
          },
          {
            productId: new mongoose.Types.ObjectId(),
            productName: 'Keyboards',
            quantity: 10,
            unitCost: 3500,
            totalCost: 35000
          }
        ],
        transactionSummary: {
          subtotal: 785000,
          tax: 117750,
          shipping: 5000,
          totalAmount: 907750
        },
        paymentDetails: {
          paymentMethod: 'bank_transfer',
          paidAmount: 907750,
          remainingAmount: 0
        },
        deliveryInfo: {
          expectedDate: new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)),
          deliveryStatus: 'pending'
        },
        status: 'paid',
        createdBy: demoUser._id
      },
      {
        purchaseOrderId: 'PO002',
        supplierId: suppliers[1]._id,
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            productName: 'Office Supplies Bundle',
            quantity: 1,
            unitCost: 25000,
            totalCost: 25000
          }
        ],
        transactionSummary: {
          subtotal: 25000,
          tax: 3750,
          shipping: 1500,
          totalAmount: 30250
        },
        paymentDetails: {
          paymentMethod: 'cheque',
          paidAmount: 0,
          remainingAmount: 30250,
          dueDate: new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)),
          chequeDetails: {
            chequeNumber: 'CHQ001',
            bankName: 'Commercial Bank',
            chequeDate: today
          }
        },
        deliveryInfo: {
          expectedDate: new Date(today.getTime() + (5 * 24 * 60 * 60 * 1000)),
          deliveryStatus: 'pending'
        },
        status: 'ordered',
        createdBy: demoUser._id
      }
    ]);
    console.log('Created purchase orders');    // Create cheques with new schema
    const cheques = [];

    // Cheque for purchase payment
    cheques.push({
      chequeNumber: 'CHQ001',
      type: 'issued',
      relatedTransaction: {
        transactionId: purchases[1]._id,
        transactionType: 'purchase',
        supplierId: suppliers[1]._id
      },
      chequeDetails: {
        amount: 30250,
        chequeDate: today,
        bankName: 'Commercial Bank',
        accountNumber: '1234567890',
        drawerName: 'Demo Company Ltd',
        payeeName: 'Global Supplies Inc'
      },
      status: 'pending',
      createdBy: demoUser._id
    });

    // Cheque for sales payment (if customer paid by cheque)
    cheques.push({
      chequeNumber: 'CHQ002',
      type: 'received',
      relatedTransaction: {
        transactionId: sales[0]._id,
        transactionType: 'sale',
        customerId: customers[0]._id
      },
      chequeDetails: {
        amount: 96250,
        chequeDate: new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000)),
        depositDate: new Date(today.getTime() - (1 * 24 * 60 * 60 * 1000)),
        bankName: 'People\'s Bank',
        accountNumber: '9876543210',
        drawerName: 'John Silva',
        payeeName: 'Demo Company Ltd',
        clearanceDate: today
      },
      status: 'cleared',
      bankProcessing: {
        depositDate: new Date(today.getTime() - (1 * 24 * 60 * 60 * 1000)),
        clearanceDate: today
      },
      createdBy: demoUser._id
    });

    // Past due cheque
    cheques.push({
      chequeNumber: 'CHQ003',
      type: 'issued',
      relatedTransaction: {
        transactionId: new mongoose.Types.ObjectId(),
        transactionType: 'purchase',
        supplierId: suppliers[2]._id
      },
      chequeDetails: {
        amount: 45000,
        chequeDate: new Date(today.getTime() - (15 * 24 * 60 * 60 * 1000)),
        bankName: 'Commercial Bank',
        accountNumber: '1234567890',
        drawerName: 'Demo Company Ltd',
        payeeName: 'Premium Services LLC'
      },
      status: 'pending',
      createdBy: demoUser._id
    });

    // Future dated cheque
    cheques.push({
      chequeNumber: 'CHQ004',
      type: 'issued',
      relatedTransaction: {
        transactionId: new mongoose.Types.ObjectId(),
        transactionType: 'purchase',
        supplierId: suppliers[0]._id
      },
      chequeDetails: {
        amount: 125000,
        chequeDate: new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)),
        bankName: 'Commercial Bank',
        accountNumber: '1234567890',
        drawerName: 'Demo Company Ltd',
        payeeName: 'ABC Electronics Ltd'
      },
      status: 'pending',
      createdBy: demoUser._id
    });

    await Cheque.insertMany(cheques);
    console.log('Created sample cheques');    console.log('\n=== SEED DATA COMPLETED ===');
    console.log('Demo User Credentials:');
    console.log('Email: demo@cashflow.com');
    console.log('Password: demo123');
    console.log(`\nCreated data summary:`);
    console.log(`- ${suppliers.length} suppliers`);
    console.log(`- ${customers.length} customers`);
    console.log(`- ${sales.length} sales transactions`);
    console.log(`- ${purchases.length} purchase orders`);
    console.log(`- ${cheques.length} cheques`);
    
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
