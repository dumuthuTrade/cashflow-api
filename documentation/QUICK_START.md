# Quick Start Guide - Cashflow API

## 🚀 Quick Setup (5 minutes)

### 1. Install & Setup
```bash
# Install dependencies
npm install

# Create environment file
echo NODE_ENV=development > .env
echo PORT=5000 >> .env
echo MONGO_URI=mongodb://localhost:27017/cashflow >> .env
echo JWT_SECRET=your_secret_key_here >> .env
echo CLIENT_URL=http://localhost:5173 >> .env
```

### 2. Start MongoDB
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 3. Initialize Database
```bash
npm run seed
```
✅ Creates admin user and sample data

### 4. Start Server
```bash
npm run dev
```
🌐 Server running at: http://localhost:5000

### 5. Test API
```bash
# Health check
curl http://localhost:5000/api/health

# Login (get your token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 📋 Default Login Credentials
- **Email:** admin@example.com
- **Password:** admin123

## 🔧 Available Scripts
- `npm start` - Production server
- `npm run dev` - Development server (with auto-reload)
- `npm run seed` - Populate database with sample data

## 📊 Sample Data Created
- ✅ 1 Admin user
- ✅ 5 Suppliers
- ✅ 5 Customers  
- ✅ 10 Sales transactions
- ✅ 10 Purchase orders
- ✅ 20 Cheques

## 🧪 Quick API Test

### Get Authentication Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Test Endpoints (Replace YOUR_TOKEN)
```bash
# Get all suppliers
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/suppliers

# Get statistics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/suppliers/stats

# Get sales with pagination
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/sales?page=1&limit=5"
```

## 🗂️ Main API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login user |
| GET | `/api/suppliers` | Get all suppliers |
| GET | `/api/customers` | Get all customers |
| GET | `/api/sales` | Get all sales |
| GET | `/api/purchases` | Get all purchases |
| GET | `/api/cheques` | Get all cheques |
| GET | `/api/*/stats` | Get statistics |

## 📖 Full Documentation
See `API_DOCUMENTATION.md` for complete API reference.

## ❗ Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
# Windows
net start MongoDB

# Check connection
mongo --eval "db.runCommand({connectionStatus : 1})"
```

### Reset Database
```bash
# Drop database and recreate
mongo cashflow --eval "db.dropDatabase()"
npm run seed
```

### Port Already in Use
```bash
# Change port in .env file
echo PORT=5001 >> .env
```

## 🎯 Next Steps
1. ✅ Test all endpoints with Postman
2. ✅ Explore sample data structure
3. ✅ Try creating new records
4. ✅ Test business logic (credit limits, cheque validation)
5. ✅ Check statistics endpoints
