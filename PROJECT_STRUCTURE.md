# TrustLens - Complete Project Structure

> Explainable AI Layer for Digital Banking | Production-Ready Scaffolding

---

## 📦 Monorepo Architecture

```
TrustLens/
├── package.json (root workspace)
├── .env.example
├── .gitignore
│
├── client/                          # React 18 + Vite Frontend
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   │
│   └── src/
│       ├── main.jsx                 # Entry point
│       ├── App.jsx                  # Router + App shell
│       ├── styles/
│       │   └── globals.css          # Tailwind + CSS variables
│       │
│       ├── components/
│       │   ├── Layout/
│       │   │   ├── MainLayout.jsx
│       │   │   ├── Header.jsx
│       │   │   └── Sidebar.jsx
│       │   ├── TrustScoreCard.jsx
│       │   ├── TransactionForm.jsx
│       │   ├── TransactionList.jsx
│       │   ├── DecisionBadge.jsx
│       │   ├── FraudAlertPanel.jsx
│       │   ├── AlertNotification.jsx
│       │   ├── ExplanationBox.jsx
│       │   ├── SystemMessage.jsx
│       │   └── DemoMode.jsx
│       │
│       ├── pages/
│       │   ├── Dashboard.jsx        # Main overview
│       │   ├── FraudSimulator.jsx   # Interactive fraud testing
│       │   ├── TransactionInsights.jsx
│       │   ├── PrivacyDashboard.jsx
│       │   ├── TrustBreakdown.jsx   # Detailed score breakdown
│       │   ├── AlertsCenter.jsx     # Real-time alerts
│       │   ├── ProfileIntelligence.jsx
│       │   └── AuditLog.jsx
│       │
│       ├── services/
│       │   ├── api.js               # Axios + REST endpoints
│       │   └── socketService.js     # Socket.io client
│       │
│       ├── contexts/
│       │   └── ThemeContext.jsx
│       │
│       └── hooks/
│           └── useTheme.js
│
├── server/                          # Node.js + Express Backend
│   ├── package.json
│   ├── server.js                    # Express app + Socket.io + MongoDB
│   │
│   ├── models/
│   │   ├── User.js                  # User profile + behavioral data
│   │   ├── Transaction.js           # Transaction records
│   │   ├── FraudLog.js              # Fraud detection logs
│   │   └── AuditLog.js              # Audit trail
│   │
│   ├── routes/
│   │   ├── transactions.js          # Transaction endpoints
│   │   ├── data.js                  # Data generation
│   │   ├── audit.js                 # Audit log endpoints
│   │   └── demo.js                  # Demo scenarios
│   │
│   ├── controllers/
│   │   ├── transactionController.js
│   │   └── dataGenerationController.js
│   │
│   ├── services/
│   │   ├── trustScoreService.js     # Trust score calculation
│   │   ├── fraudService.js          # ML-based fraud detection
│   │   ├── ruleBasedFraudService.js # Rule-based detection
│   │   ├── anomalyDetectionService.js
│   │   ├── confidenceScoringService.js
│   │   ├── decisionEngine.js        # AI decision logic
│   │   ├── explainabilityService.js # AI explanations
│   │   └── demoScenarioService.js
│   │
│   ├── utils/
│   │   ├── seed.js                  # Database seeding
│   │   ├── profileCalculator.js
│   │   └── syntheticDataGenerator.js
│   │
│   ├── scripts/
│   │   └── seed-synthetic-data.js
│   │
│   └── docs/
│       └── DATA_GENERATION.md
│
└── docs/
    └── DATA_GENERATION_QUICKSTART.md
```

---

## 🔧 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18.2.0 |
| **Build Tool** | Vite | 4.3.4 |
| **Router** | React Router | 6.20.0 |
| **Charts** | Recharts | 2.10.0 |
| **Styling** | Tailwind CSS | 3.3.0 |
| **HTTP Client** | Axios | 1.3.4 |
| **Real-time** | Socket.io Client | 4.6.1 |
| **Icons** | Lucide React | 0.263.1 |
| | | |
| **Backend** | Node.js + Express | 18.2 / 4.18.2 |
| **Database** | MongoDB | via Mongoose 7.0.0 |
| **Authentication** | JWT | 9.0.0 |
| **Password Hashing** | bcryptjs | 2.4.3 |
| **Validation** | Joi | 17.9.1 |
| **Real-time** | Socket.io | 4.6.1 |
| **CORS** | cors | 2.8.5 |
| **Dev Tool** | nodemon | 2.0.20 |

---

## 📋 Environment Variables

**`.env.example`** - Copy to `.env` before running:

```bash
# Backend Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/trustlens
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/trustlens

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRY=7d

# CORS
CLIENT_URL=http://localhost:5173

# Fraud Detection Thresholds
FRAUD_THRESHOLD=0.6
HIGH_AMOUNT_MULTIPLIER=3
UNUSUAL_TIME_WINDOW=2

# WebSocket
SOCKET_PORT=5000
```

---

## 🎨 Design System

### CSS Variables (in `client/src/styles/globals.css`)

```css
:root {
  /* Primary Colors */
  --color-primary: #1A56DB;
  --color-primary-dark: #1345B7;
  --color-primary-light: #E0E7FF;

  /* Background & Surface */
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F1F5F9;

  /* Text */
  --color-text: #0F172A;
  --color-text-muted: #64748B;
  --color-text-light: #94A3B8;

  /* Border */
  --color-border: #E2E8F0;
  --color-border-light: #F1F5F9;

  /* Status Colors */
  --color-success: #16A34A;     /* Green */
  --color-danger: #DC2626;      /* Red */
  --color-warning: #D97706;     /* Amber */
  --color-info: #0284C7;        /* Blue */

  /* Trust Score Colors */
  --color-trust-high: #16A34A;    /* Green (80-100) */
  --color-trust-medium: #D97706;  /* Amber (50-79) */
  --color-trust-low: #DC2626;     /* Red (0-49) */
}
```

### Component Classes

- `.card` - Default card with subtle shadow
- `.card-lg` - Large card for emphasis
- `.card-secondary` - Secondary surface
- `.btn` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-ghost` - Ghost button
- `.badge` - Badge with variants (success, danger, warning, info, primary)
- `.alert` - Alert box with variants
- `.input` - Form input
- `.grid-responsive` - Auto-responsive grid (300px min)
- `.grid-responsive-lg` - Large responsive grid (400px min)

---

## 🚀 Running the Application

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm 8+

### Setup

```bash
# Clone and navigate
cd TrustLens

# Install all dependencies
npm run install-all

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start MongoDB (if local)
mongod

# Run dev servers (client + server parallel)
npm run dev

# Client: http://localhost:5173
# Server: http://localhost:5000
# WebSocket: ws://localhost:5000
```

### Build for Production

```bash
npm run build

# Output:
# - client/dist/ (React build)
# - server/ready to deploy
```

---

## 📡 API Endpoints

### Transaction Management
- `POST /api/transactions` - Submit transaction for analysis
- `GET /api/transactions/user/:userId` - Get user transactions
- `GET /api/transactions/trust-score/:userId` - Get trust score
- `GET /api/transactions/fraud-log/:transactionId` - Get fraud details

### Data Generation
- `POST /api/data/generate` - Generate synthetic transactions
- `POST /api/data/generate-multi` - Generate multi-user profile data
- `DELETE /api/data/:userId` - Clear synthetic data
- `GET /api/data/stats/:userId` - Get data statistics

### Audit & System
- `GET /api/audit-logs/:userId` - Get audit trail
- `GET /api/demo/scenarios` - Get demo scenarios
- `GET /api/health` - Health check

---

## 🔌 WebSocket Events

### Client → Server
- `userConnected(userId)` - Register user connection
- `transactionAlert(data)` - Send transaction alert

### Server → Client
- `fraudDetected(data)` - Broadcast fraud detection
- `trustScoreUpdated(score)` - Update trust score
- `alertGenerated(alert)` - New alert notification

---

## 📊 Core Features

### 1. Trust Score (0-100)
- Real-time calculation based on transaction history
- Explainable breakdown with contributing factors
- Visual radial progress indicator

### 2. Explainable Transactions
- Plain-English explanations for every decision
- Breakdown of confidence scores
- Risk factors highlighted

### 3. Privacy Dashboard
- Shows which data is used for trust calculation
- User data controls and permissions
- Privacy score

### 4. Fraud Simulator
- Input custom transaction parameters
- Real-time fraud detection response
- See how different inputs affect trust score

### 5. Real-time Alerts
- WebSocket-based alert delivery
- Alert center with filtering
- Audit trail of all alerts

---

## ✅ File Checklist

### Required Files Present
- ✅ `package.json` (root, client, server)
- ✅ `.env.example`
- ✅ `server.js` - Express + Socket.io + MongoDB setup
- ✅ `client/src/App.jsx` - React Router with all pages
- ✅ `client/src/styles/globals.css` - Tailwind + CSS variables
- ✅ All models: User, Transaction, FraudLog, AuditLog
- ✅ All routes: transactions, data, audit, demo
- ✅ All services: trustScore, fraud, anomaly, decision, explainability
- ✅ Recharts dependency added

---

## 🎯 Next Steps

1. **Develop Page Components** - Use responsive design with Tailwind breakpoints
2. **Implement Chart Visualizations** - Use Recharts for all data visualization
3. **Write Business Logic** - Fraud detection, trust score algorithms
4. **Database Seeding** - Generate realistic demo data
5. **Testing** - Unit tests + integration tests
6. **Deployment** - Ready for Vercel (frontend) + Railway/Render (backend)

---

## 📚 Documentation

- [Data Generation Guide](./docs/DATA_GENERATION_QUICKSTART.md)
- [Server Data Generation Docs](./server/docs/DATA_GENERATION.md)
- [Production Deployment](./IMPLEMENTATION_COMPLETE.md)

---

**Status**: ✅ Production-Ready Scaffolding Complete
**Last Updated**: April 2026
