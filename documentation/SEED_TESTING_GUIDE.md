# Seed File Testing Guide

## 📋 Overview
The `seed.js` file initializes your cashflow database with realistic sample data for development and testing purposes.

## 🎯 What the Seed File Creates

### 👤 Users
- **1 Admin User**
  - Email: `admin@example.com`
  - Password: `admin123`
  - Role: `admin`

### 🏢 Suppliers (5 companies)
```javascript
[
  {
    supplierCode: "SUP001",
    name: "ABC Suppliers Ltd",
    phone: "0112345678",
    email: "contact@abcsuppliers.lk",
    creditLimit: 100000,
    riskCategory: "low"
  },
  {
    supplierCode: "SUP002", 
    name: "XYZ Trading Company",
    phone: "0114567890",
    email: "info@xyztrading.lk",
    creditLimit: 200000,
    riskCategory: "medium"
  }
  // ... and 3 more suppliers
]
```

### 👥 Customers (5 individuals/companies)
```javascript
[
  {
    customerCode: "CUST001",
    name: "John Doe",
    phone: "0771234567",
    email: "john@example.com",
    creditLimit: 50000,
    riskCategory: "low"
  }
  // ... and 4 more customers
]
```

### 💰 Sales Transactions (10 records)
- Various amounts from LKR 15,000 to LKR 175,000
- Different payment statuses (pending, partial, paid)
- Different due dates
- Linked to customers

### 🛒 Purchase Orders (10 records)
- Various amounts from LKR 25,000 to LKR 200,000
- Different statuses (pending, completed, delivered)
- Linked to suppliers

### 🏦 Cheques (20 records)
- **10 Issued cheques** (payments to suppliers)
- **10 Received cheques** (payments from customers)
- Various banks (Commercial Bank, Sampath Bank, BOC, etc.)
- Different statuses (pending, cleared, bounced)
- Linked to sales/purchase transactions

## 🚀 How to Run the Seed File

### Method 1: Using npm script (Recommended)
```bash
npm run seed
```

### Method 2: Direct node command
```bash
node seed.js
```

### Method 3: With debug output
```bash
node --trace-warnings seed.js
```

## ✅ Expected Output

### Successful Run
```
🔗 Database connected successfully
🧹 Existing data cleared
👤 Admin user created successfully
🏢 5 suppliers created successfully
👥 5 customers created successfully
💰 10 sales transactions created successfully
🛒 10 purchase orders created successfully
🏦 20 cheques created successfully

📊 SEED SUMMARY:
✅ Users: 1
✅ Suppliers: 5  
✅ Customers: 5
✅ Sales: 10
✅ Purchases: 10
✅ Cheques: 20

🎉 Database seeded successfully!
🔗 Database connection closed
```

## ❌ Common Issues & Solutions

### Issue 1: MongoDB Connection Error
```
Database connection error: MongooseServerSelectionError: connect ECONNREFUSED
```

**Solution:**
```bash
# Windows
net start MongoDB

# macOS/Linux  
sudo systemctl start mongod

# Check if MongoDB is running
mongo --eval "db.runCommand({connectionStatus : 1})"
```

### Issue 2: Duplicate Index Warnings
```
Warning: Duplicate schema index on {"customerCode":1} found
```

**Solution:** These warnings are fixed in the current version. If you still see them:
```bash
# Drop the database and recreate
mongo cashflow --eval "db.dropDatabase()"
npm run seed
```

### Issue 3: Permission Errors
```
Error: EACCES: permission denied
```

**Solution:**
```bash
# Run as administrator (Windows)
# Or check MongoDB folder permissions
```

### Issue 4: Port Already in Use
```
Error: listen EADDRINUSE :::27017
```

**Solution:**
- Another MongoDB instance is running
- Stop the other instance or use a different port in your connection string

## 🧪 Verifying Seed Data

### Method 1: Using MongoDB Compass
1. Connect to `mongodb://localhost:27017`
2. Open `cashflow` database
3. Check collections: `users`, `suppliers`, `customers`, `sales`, `purchases`, `cheques`

### Method 2: Using MongoDB Shell
```bash
mongo cashflow

# Check collections
show collections

# Count documents
db.users.count()        // Should be 1
db.suppliers.count()    // Should be 5
db.customers.count()    // Should be 5
db.sales.count()        // Should be 10
db.purchases.count()    // Should be 10  
db.cheques.count()      // Should be 20

# View sample data
db.suppliers.findOne()
db.customers.findOne() 
db.sales.findOne()
```

### Method 3: Using API Endpoints
```bash
# First login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Then test endpoints (replace YOUR_TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/suppliers

curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/suppliers/stats
```

## 🔄 Re-running the Seed File

The seed file **clears existing data** before creating new data. You can safely run it multiple times:

```bash
npm run seed  # This will:
# 1. Delete all existing data
# 2. Create fresh sample data
# 3. Reset all IDs and relationships
```

## 📊 Testing Business Logic

### Credit Limit Validation
```javascript
// Customers have credit limits
// Sales transactions respect these limits
// Test by creating sales that exceed credit limits
```

### Cheque Validation  
```javascript
// Cheques are linked to sales/purchases
// Due dates are validated
// Amount validation against transactions
```

### Payment Status Logic
```javascript
// Sales have payment statuses: pending, partial, paid, overdue
// Purchase statuses: pending, completed, delivered  
// Cheque statuses: pending, cleared, bounced, cancelled
```

## 🎛️ Customizing Seed Data

### Modify Sample Data
Edit `seed.js` to change:
- Number of records created
- Sample values (names, amounts, dates)
- Business logic scenarios

### Example Customization
```javascript
// In seed.js, modify these arrays:
const supplierData = [
  {
    supplierCode: 'YOUR_CODE',
    personalInfo: {
      name: 'Your Company Name',
      // ... other fields
    }
  }
  // Add more suppliers...
];
```

## 🔧 Advanced Testing

### Performance Testing
```bash
# Time the seed operation
time npm run seed

# Monitor MongoDB during seeding
mongostat --host localhost:27017
```

### Data Validation Testing
```bash
# Run seed file multiple times to test consistency
for i in {1..3}; do
  echo "Run $i:"
  npm run seed
done
```

### Memory Usage Testing
```bash
# Check memory usage during seeding
node --max-old-space-size=512 seed.js
```

## 📝 Seed File Structure

```javascript
// seed.js structure:
1. Database connection setup
2. Data clearing functions  
3. Sample data definitions
4. Creation functions for each model
5. Main execution flow
6. Error handling
7. Cleanup and exit
```

## 🎯 Next Steps After Seeding

1. ✅ Start the development server: `npm run dev`
2. ✅ Test login with admin credentials
3. ✅ Explore API endpoints with sample data
4. ✅ Test business logic scenarios
5. ✅ Use data for frontend development
6. ✅ Create additional test scenarios as needed

## 📞 Support

If you encounter issues:
1. Check MongoDB service status
2. Verify environment variables in `.env`
3. Review console output for specific errors
4. Check MongoDB logs for detailed error information
5. Ensure proper file permissions
