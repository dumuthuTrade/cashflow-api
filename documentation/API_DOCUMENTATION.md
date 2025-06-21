# Cashflow Management API Documentation

## Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Testing](#testing)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/cashflow
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:5173
   ```

3. **Start MongoDB**
   - **Windows**: `net start MongoDB`
   - **macOS/Linux**: `sudo systemctl start mongod`

4. **Initialize Database with Sample Data**
   ```bash
   npm run seed
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   or for production:
   ```bash
   npm start
   ```

6. **Verify Server is Running**
   Visit: `http://localhost:5000/api/health`

### Scripts Available
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Populate database with sample data
- `npm test` - Run tests (not implemented yet)

## Authentication

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

### Authentication Headers
For all protected routes, include the JWT token in the Authorization header:
```http
Authorization: Bearer your_jwt_token_here
```

## API Endpoints

### Health Check
```http
GET /api/health
```
Returns server status and timestamp.

### Suppliers

#### Get All Suppliers
```http
GET /api/suppliers
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search in name, phone, or supplier code
- `status` - Filter by status (active, inactive, suspended)
- `riskCategory` - Filter by risk category (low, medium, high)
- `sort` - Sort field (name, supplierCode, createdAt)
- `order` - Sort order (asc, desc)

#### Get Supplier by ID
```http
GET /api/suppliers/:id
```

#### Create Supplier
```http
POST /api/suppliers
Content-Type: application/json

{
  "supplierCode": "SUP001",
  "personalInfo": {
    "name": "ABC Suppliers Ltd",
    "phone": "0112345678",
    "email": "contact@abcsuppliers.lk",
    "address": "123 Main Street, Colombo 03",
    "identificationNumber": "123456789V"
  },
  "creditProfile": {
    "creditLimit": 100000,
    "paymentTerms": 30,
    "riskCategory": "low"
  }
}
```

#### Update Supplier
```http
PUT /api/suppliers/:id
```

#### Delete Supplier
```http
DELETE /api/suppliers/:id
```

#### Get Supplier Statistics
```http
GET /api/suppliers/stats
```

### Customers

#### Get All Customers
```http
GET /api/customers
```

**Query Parameters:** Same as suppliers

#### Get Customer by ID
```http
GET /api/customers/:id
```

#### Create Customer
```http
POST /api/customers
Content-Type: application/json

{
  "customerCode": "CUST001",
  "personalInfo": {
    "name": "John Doe",
    "phone": "0771234567",
    "email": "john@example.com",
    "address": "456 Customer Street, Kandy",
    "identificationNumber": "987654321V"
  },
  "creditProfile": {
    "creditLimit": 50000,
    "paymentTerms": 15,
    "riskCategory": "medium"
  }
}
```

#### Update Customer
```http
PUT /api/customers/:id
```

#### Delete Customer
```http
DELETE /api/customers/:id
```

#### Get Customer Statistics
```http
GET /api/customers/stats
```

### Sales

#### Get All Sales
```http
GET /api/sales
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `search` - Search in transaction ID or customer info
- `status` - Filter by status (pending, completed, cancelled)
- `paymentStatus` - Filter by payment status (pending, partial, paid, overdue)
- `customerId` - Filter by customer
- `dateFrom`, `dateTo` - Date range filter
- `amountMin`, `amountMax` - Amount range filter

#### Get Sale by ID
```http
GET /api/sales/:id
```

#### Create Sale
```http
POST /api/sales
Content-Type: application/json

{
  "transactionId": "SALE001",
  "customerId": "customer_object_id",
  "items": [
    {
      "description": "Product A",
      "quantity": 10,
      "unitPrice": 1500,
      "total": 15000
    }
  ],
  "financials": {
    "subtotal": 15000,
    "taxAmount": 2250,
    "discountAmount": 0,
    "totalAmount": 17250
  },
  "paymentTerms": {
    "dueDate": "2025-07-21",
    "paymentMethod": "credit"
  }
}
```

#### Update Sale
```http
PUT /api/sales/:id
```

#### Delete Sale
```http
DELETE /api/sales/:id
```

#### Get Sales Statistics
```http
GET /api/sales/stats
```

### Purchases

#### Get All Purchases
```http
GET /api/purchases
```

**Query Parameters:** Similar to sales

#### Get Purchase by ID
```http
GET /api/purchases/:id
```

#### Create Purchase
```http
POST /api/purchases
Content-Type: application/json

{
  "purchaseOrderId": "PO001",
  "supplierId": "supplier_object_id",
  "items": [
    {
      "description": "Raw Material A",
      "quantity": 100,
      "unitPrice": 500,
      "total": 50000
    }
  ],
  "financials": {
    "subtotal": 50000,
    "taxAmount": 7500,
    "discountAmount": 1000,
    "totalAmount": 56500
  },
  "deliveryInfo": {
    "expectedDate": "2025-07-01",
    "actualDate": "2025-07-01",
    "address": "Warehouse, Industrial Zone"
  }
}
```

#### Update Purchase
```http
PUT /api/purchases/:id
```

#### Delete Purchase
```http
DELETE /api/purchases/:id
```

#### Get Purchase Statistics
```http
GET /api/purchases/stats
```

### Cheques

#### Get All Cheques
```http
GET /api/cheques
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `search` - Search in cheque number or bank name
- `type` - Filter by type (issued, received)
- `status` - Filter by status (pending, cleared, bounced, cancelled)
- `bankName` - Filter by bank
- `dateFrom`, `dateTo` - Date range filter
- `amountMin`, `amountMax` - Amount range filter

#### Get Cheque by ID
```http
GET /api/cheques/:id
```

#### Create Cheque
```http
POST /api/cheques
Content-Type: application/json

{
  "chequeNumber": "CHQ001",
  "type": "issued",
  "amount": 25000,
  "issueDate": "2025-06-21",
  "dueDate": "2025-07-21",
  "bankInfo": {
    "bankName": "Commercial Bank",
    "branchName": "Colombo 03",
    "accountNumber": "1234567890"
  },
  "partyInfo": {
    "name": "ABC Suppliers Ltd",
    "contactNumber": "0112345678"
  },
  "transactionId": "sale_or_purchase_object_id"
}
```

#### Update Cheque
```http
PUT /api/cheques/:id
```

#### Delete Cheque
```http
DELETE /api/cheques/:id
```

#### Get Cheque Statistics
```http
GET /api/cheques/stats
```

#### Update Cheque Status
```http
PATCH /api/cheques/:id/status
Content-Type: application/json

{
  "status": "cleared",
  "notes": "Cheque cleared successfully"
}
```

## Data Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'user'], default: 'user'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Supplier Model
```javascript
{
  supplierCode: String (required, unique),
  personalInfo: {
    name: String (required),
    phone: String (required, Sri Lankan format),
    email: String (email format),
    address: String,
    identificationNumber: String (Sri Lankan NIC format)
  },
  creditProfile: {
    rating: Number (1-10, default: 5),
    creditLimit: Number (min: 0),
    availableCredit: Number (min: 0),
    paymentTerms: Number (default: 30 days),
    riskCategory: String (enum: ['low', 'medium', 'high']),
    creditHistory: Array
  },
  status: String (enum: ['active', 'inactive', 'suspended']),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Customer Model
Similar structure to Supplier model.

### Sales Model
```javascript
{
  transactionId: String (required, unique),
  customerId: ObjectId (ref: Customer, required),
  items: Array of {
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  },
  financials: {
    subtotal: Number,
    taxAmount: Number,
    discountAmount: Number,
    totalAmount: Number
  },
  paymentTerms: {
    dueDate: Date,
    paymentMethod: String,
    installments: Array
  },
  status: String (enum: ['pending', 'completed', 'cancelled']),
  paymentStatus: String (enum: ['pending', 'partial', 'paid', 'overdue']),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### Purchase Model
Similar structure to Sales model but with supplier and delivery info.

### Cheque Model
```javascript
{
  chequeNumber: String (required, unique),
  type: String (enum: ['issued', 'received']),
  amount: Number (required, min: 0),
  issueDate: Date (required),
  dueDate: Date (required),
  bankInfo: {
    bankName: String,
    branchName: String,
    accountNumber: String
  },
  partyInfo: {
    name: String,
    contactNumber: String
  },
  status: String (enum: ['pending', 'cleared', 'bounced', 'cancelled']),
  statusHistory: Array,
  transactionId: ObjectId (ref: Sales/Purchase),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

### Error Response Format
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ],
  "stack": "Error stack trace (development only)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Testing

### Sample Test Data
The seed file creates the following test data:
- 1 Admin user (email: admin@example.com, password: admin123)
- 5 Suppliers with various credit profiles
- 5 Customers with different risk categories
- 10 Sales transactions
- 10 Purchase orders
- 20 Cheques (both issued and received)

### Testing with Sample Data

1. **Run the seed file:**
   ```bash
   npm run seed
   ```

2. **Login to get authentication token:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"admin123"}'
   ```

3. **Test API endpoints:**
   ```bash
   # Get all suppliers
   curl -X GET http://localhost:5000/api/suppliers \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # Get supplier statistics
   curl -X GET http://localhost:5000/api/suppliers/stats \
     -H "Authorization: Bearer YOUR_TOKEN"
   
   # Get sales with pagination
   curl -X GET "http://localhost:5000/api/sales?page=1&limit=5" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Postman Collection
You can import the following endpoints into Postman for easier testing:
- Base URL: `http://localhost:5000/api`
- Set up environment variables for `baseUrl` and `authToken`
- Create requests for all the endpoints listed above

### Common Testing Scenarios

1. **Authentication Flow:**
   - Register new user
   - Login with credentials
   - Access protected endpoints

2. **CRUD Operations:**
   - Create supplier/customer
   - Read with pagination and filters
   - Update existing records
   - Delete records

3. **Business Logic:**
   - Create sales with credit validation
   - Issue cheques linked to transactions
   - Update cheque status
   - View statistics and reports

4. **Error Handling:**
   - Test with invalid data
   - Test unauthorized access
   - Test duplicate record creation

### Database Reset
To reset the database and re-run the seed file:
```bash
# Connect to MongoDB and drop the database
mongo
use cashflow
db.dropDatabase()
exit

# Re-run the seed file
npm run seed
```

## Notes

- All monetary amounts are in Sri Lankan Rupees (LKR)
- Phone numbers must follow Sri Lankan format
- NIC numbers support both old (9 digits + V/X) and new (12 digits) formats
- All timestamps are in ISO format
- The API supports CORS for frontend integration
- Rate limiting and additional security measures should be implemented for production use
