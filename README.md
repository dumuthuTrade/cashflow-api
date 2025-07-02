# Cashflow Backend API

A Node.js/Express backend for the Cashflow Management Application with MongoDB database.

## Features

- **Authentication**: JWT-based user authentication
- **Cheque Management**: Full CRUD operations for cheques with filtering and search
- **Supplier Management**: Manage suppliers with autocomplete functionality
- **Dashboard Analytics**: Real-time statistics and metrics
- **Data Validation**: Comprehensive input validation and error handling
- **Security**: Helmet, CORS, and input sanitization

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/cashflow-app
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:5173
   ```

3. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

4. **Seed demo data (optional):**
   ```bash
   node seed.js
   ```

## API Endpoints

### Admin logins
- `POST /api/auth/admin/login` - Login admin
  
### Authentication
- `POST /api/auth/register` - Register new customer
- `GET /api/auth/customers` - Get customer and customer details
- `PUT /api/auth/customers/:id` - Update customer
- `DELETE /api/auth/customers/:id` - Delete customer

### Cheques
- `GET /api/cheques` - Get all cheques (with filtering)
- `GET /api/cheques/:id` - Get single cheque
- `POST /api/cheques` - Create new cheque
- `PUT /api/cheques/:id` - Update cheque
- `DELETE /api/cheques/:id` - Delete cheque
- `GET /api/cheques/stats` - Get dashboard statistics

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get single supplier
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier
- `GET /api/suppliers/search` - Search suppliers (autocomplete)

### Customers
- `GET /api/customers` - Get all customers (with filtering, sorting, pagination)
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `PATCH /api/customers/:id/credit-rating` - Update customer credit rating
- `GET /api/customers/stats` - Get customer statistics and analytics

#### Customer Query Parameters
- `page` - Page number for pagination (default: 1)
- `limit` - Number of items per page (default: 10, max: 100)
- `status` - Filter by status: `active`, `inactive`, `suspended`
- `riskCategory` - Filter by risk category: `low`, `medium`, `high`
- `search` - Search in customer code, name, email, phone
- `sortBy` - Sort field: `personalInfo.name`, `customerCode`, `creditProfile.rating`, `createdAt`
- `sortOrder` - Sort direction: `asc`, `desc` (default: asc)

#### Customer Data Structure
```json
{
  "customerCode": "CUST001",
  "personalInfo": {
    "name": "John Doe",
    "phone": "+94112345678",
    "email": "john@example.com",
    "address": "123 Main Street, Colombo",
    "identificationNumber": "123456789V"
  },
  "creditProfile": {
    "rating": 7,
    "creditLimit": 100000,
    "availableCredit": 75000,
    "paymentTerms": 30,
    "riskCategory": "medium",
    "creditHistory": [
      {
        "date": "2025-01-01T00:00:00.000Z",
        "previousRating": 6,
        "newRating": 7,
        "reason": "Improved payment history"
      }
    ]
  },
  "status": "active"
}
```

## Deployment

### Free Deployment Options

#### 1. Vercel (Recommended for API)
```bash
npm install -g vercel
vercel
```

#### 2. Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

#### 3. Render
1. Connect your GitHub repository
2. Create a new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`

### Database Options

#### MongoDB Atlas (Free Tier)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string
4. Update `MONGODB_URI` in environment variables

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 5000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRE` | JWT expiration time | No (default: 30d) |
| `CLIENT_URL` | Frontend URL for CORS | Yes |

## Demo Data

The application includes a seed script that creates:
- Demo user: `demo@cashflow.com` / `demo123`
- 3 sample suppliers
- Sample customers with various credit profiles and risk categories
- 10 sample cheques with various statuses and dates

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Rate limiting ready
- Error handling and logging

## API Response Format

```json
{
  "status": "success|error",
  "message": "Response message",
  "data": {
    "resource": "data"
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": ["validation errors array"]
}
```

## License

ISC
