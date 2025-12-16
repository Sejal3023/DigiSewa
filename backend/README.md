# DigiSewa Backend (Node.js + Express)

API for Blockchain-Based Digital Government License & Registration System.

## Features

- **Authentication & Authorization**: Secure user management with Supabase
- **Application Management**: Complete license application lifecycle
- **Blockchain Integration**: Ethereum-based license verification using Ethers.js
- **Officer Dashboard**: Administrative tools for license processing
- **Real-time Updates**: WebSocket support for live application status

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Ethereum network (Ganache for development)
- Supabase account

## Setup

### 1. Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
BLOCKCHAIN_RPC_URL=http://127.0.0.1:7545
PRIVATE_KEY=your_blockchain_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
PORT=5000
NODE_ENV=development
```

### 2. Installation & Running

```bash
cd backend
npm install
npm run dev
```

### 3. Database Setup

```bash
# Apply database schema
npm run setup-db

# Seed initial data
npm run seed-admin
```

## API Routes

### Health Check
- `GET /health` - Backend status check

### Authentication
- `GET /auth/profile` - Get user profile
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Applications
- `POST /applications` - Submit new application
- `GET /applications/:id` - Get application details
- `GET /applications/officer/pending` - Get pending applications for officers
- `POST /applications/:id/verify` - Verify application
- `POST /applications/:id/issue` - Issue license
- `POST /applications/:id/revoke` - Revoke license

### Licenses
- `GET /licenses/:id` - Get license details
- `GET /licenses/:id/verify` - Verify license authenticity

### Blockchain Operations
- `POST /blockchain/recordIssuance` - Record license issuance on blockchain
- `POST /blockchain/recordRevocation` - Record license revocation on blockchain
- `GET /blockchain/tx/:txHash` - Get transaction details

### Admin Routes
- `GET /admin/users` - Get all users
- `POST /admin/users/:id/role` - Update user role
- `GET /admin/stats` - System statistics

## Architecture

- **Database**: PostgreSQL with Supabase
- **Authentication**: Supabase Auth
- **Blockchain**: Ethereum (Ethers.js)
- **API**: RESTful Express.js
- **Middleware**: Custom authentication & validation

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run setup-db     # Setup database schema
npm run seed-admin   # Seed admin accounts
npm run test         # Run tests
```

### Local Development

1. Start Ganache on port 7545
2. Deploy smart contract and update `CONTRACT_ADDRESS`
3. Configure Supabase project
4. Run `npm run dev`

## Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Update blockchain RPC URL
4. Set secure private keys
5. Run `npm run build && npm start`

## Security Notes

- Never commit `.env` files
- Use strong private keys for blockchain operations
- Implement rate limiting in production
- Validate all input data
- Use HTTPS in production

## Support

For issues and questions, check the main project documentation or create an issue in the repository.


