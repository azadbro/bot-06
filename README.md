# TRX Earn Bot - Telegram Mini App

A comprehensive Telegram Mini App that allows users to earn TRX cryptocurrency by watching ads, completing tasks, and referring other users. Built with modern web technologies and featuring a clean, mobile-optimized UI.

## 🌟 Features

### Core Functionality
- **💎 Wallet Management**: TRX balance tracking, wallet address setup, and withdrawal requests
- **📺 Ad Watching**: Earn TRX by watching Monetag interstitial ads with cooldown system
- **📋 Task System**: Complete Telegram channel/bot tasks for TRX rewards
- **👥 Referral Program**: Refer friends and earn commissions on their withdrawals
- **🔒 Admin Panel**: Comprehensive management interface for administrators

### Technical Features
- **🚀 Modern UI**: Smooth animations, mobile-responsive design, haptic feedback
- **🔥 Firebase Integration**: Secure data storage with Firestore
- **⚡ Real-time Updates**: Live balance updates and instant notifications
- **🛡️ Security**: Rate limiting, input validation, and secure API endpoints
- **📱 Mobile Optimized**: Perfect for Telegram's mobile-first environment

## 🏗️ Architecture

### Frontend (React)
- **Framework**: React 18 with functional components and hooks
- **Styling**: Modern CSS with Tailwind-inspired utilities
- **Animations**: Framer Motion for smooth transitions
- **State Management**: React hooks with axios for API calls
- **UI Components**: 4 main sections (Wallet, Earn, Tasks, Referral)

### Backend (Node.js/Express)
- **API**: RESTful endpoints with Express.js
- **Database**: Firebase Firestore for real-time data
- **Authentication**: Telegram Web App data validation
- **Security**: Helmet, CORS, rate limiting
- **Models**: User, Task, Withdrawal with comprehensive business logic

### Admin Panel
- **Interface**: Vanilla HTML/JS with Tailwind CSS
- **Features**: User management, withdrawal approval, task management
- **Security**: Password-protected with admin-only access

## 💰 Earning System

### Ad Rewards
- **Amount**: 0.005 TRX per ad
- **Cooldown**: 15 seconds between ads
- **Integration**: Monetag SDK for interstitial ads
- **Verification**: Server-side reward validation

### Task System
- **Types**: Telegram channels, bots, external links
- **Rewards**: Fixed TRX amounts per task
- **Verification**: Manual approval system
- **One-time**: Each task can only be completed once

### Referral Program
- **Verification**: 5 ads watched requirement
- **Bonus**: 0.05 TRX when referral gets verified
- **Commission**: 10% of all future withdrawals
- **Tracking**: Real-time referral statistics

### Withdrawals
- **Minimum**: 3.5 TRX
- **Commission**: 10% (goes to referrer if verified)
- **Process**: Admin approval required
- **Wallet**: TRX address validation

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase project with Firestore enabled
- Telegram Bot Token
- Monetag account and zone ID

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd trx-earn-telegram-mini-app
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up Firebase**
- Create a Firebase project
- Enable Firestore database
- Download service account key
- Update `.env` with Firebase credentials

5. **Start development servers**
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- React frontend on `http://localhost:3000`

### Environment Variables

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY=your_private_key

# Monetag Configuration
MONETAG_ZONE_ID=9682261

# App Settings
PORT=3001
FRONTEND_URL=http://localhost:3000
MINIMUM_WITHDRAWAL=3.5
WITHDRAWAL_COMMISSION=0.10
AD_REWARD=0.005
REFERRAL_REWARD=0.05
REFERRAL_VERIFICATION_ADS=5
AD_COOLDOWN_SECONDS=15

# Admin Panel
ADMIN_PASSWORD=your_secure_admin_password
```

## 📱 Telegram Bot Setup

1. **Create your bot**
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Get your bot token

2. **Configure Web App**
   - Use `/setmenubutton` command
   - Set button text: "💎 Earn TRX"
   - Set Web App URL: `https://yourdomain.com`

3. **Set bot commands**
```
start - 🚀 Start earning TRX
help - ❓ Get help and support
wallet - 💳 Manage your wallet
stats - 📊 View your statistics
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Login/register user
- `GET /api/auth/profile/:telegramId` - Get user profile
- `POST /api/auth/wallet/:telegramId` - Update wallet address

### Ads
- `POST /api/ads/watch/:telegramId` - Watch ad and get reward
- `GET /api/ads/status/:telegramId` - Get ad watching status
- `GET /api/ads/stats/:telegramId` - Get ad statistics

### Tasks
- `GET /api/tasks/:telegramId` - Get available tasks
- `POST /api/tasks/:telegramId/complete/:taskId` - Complete task
- `GET /api/tasks/:telegramId/stats` - Get task statistics

### Referrals
- `GET /api/referrals/:telegramId` - Get referral data
- `GET /api/referrals/:telegramId/stats` - Get referral statistics
- `GET /api/referrals/validate/:referralCode` - Validate referral code

### Withdrawals
- `POST /api/withdrawals/:telegramId/request` - Request withdrawal
- `GET /api/withdrawals/:telegramId/history` - Get withdrawal history
- `GET /api/withdrawals/:telegramId/stats` - Get withdrawal statistics

### Admin (Password Protected)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/withdrawals/pending` - Pending withdrawals
- `POST /api/admin/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/admin/users/:id/block` - Block/unblock user

## 🎨 UI/UX Features

### Design System
- **Colors**: Purple-blue gradient theme
- **Typography**: System fonts with clear hierarchy
- **Spacing**: Consistent 8px grid system
- **Shadows**: Subtle depth with blur effects

### Mobile Optimization
- **Touch Targets**: Minimum 44px for accessibility
- **Gestures**: Swipe navigation and pull-to-refresh
- **Performance**: Optimized images and lazy loading
- **Offline**: Service worker for basic offline functionality

### Animations
- **Page Transitions**: Smooth slide animations
- **Micro-interactions**: Button press feedback
- **Loading States**: Skeleton screens and spinners
- **Success States**: Celebration animations

## 🛡️ Security Features

### Frontend Security
- Input validation and sanitization
- XSS protection
- CSRF token implementation
- Secure localStorage usage

### Backend Security
- Rate limiting (100 requests/15 minutes)
- Helmet.js security headers
- CORS configuration
- Input validation with sanitization
- SQL injection prevention

### Data Protection
- Encrypted sensitive data
- Secure session management
- Privacy-compliant data handling
- Regular security audits

## 📊 Database Schema

### Users Collection
```javascript
{
  telegramId: String (document ID),
  username: String,
  firstName: String,
  lastName: String,
  trxBalance: Number,
  trxWallet: String,
  totalEarned: Number,
  totalWithdrawn: Number,
  adsWatched: Number,
  tasksCompleted: Array,
  referralCode: String,
  referredBy: String,
  referrals: Array,
  isVerifiedReferral: Boolean,
  lastAdWatch: Date,
  isBlocked: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Tasks Collection
```javascript
{
  title: String,
  description: String,
  type: String, // 'telegram_channel', 'telegram_bot', 'external_link'
  url: String,
  reward: Number,
  isActive: Boolean,
  requiredAction: String, // 'join', 'start', 'visit'
  verificationMethod: String, // 'manual', 'automatic'
  completedBy: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### Withdrawals Collection
```javascript
{
  telegramId: String,
  amount: Number,
  commission: Number,
  netAmount: Number,
  toAddress: String,
  status: String, // 'pending', 'approved', 'rejected', 'completed'
  txHash: String,
  adminNotes: String,
  createdAt: Date,
  processedAt: Date,
  processedBy: String
}
```

## 🚀 Deployment

### Production Build
```bash
# Build the frontend
cd client && npm run build

# Start production server
NODE_ENV=production npm start
```

### Deploy to Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set TELEGRAM_BOT_TOKEN=your_token
heroku config:set FIREBASE_PROJECT_ID=your_project_id
# ... set all other environment variables

# Deploy
git push heroku main
```

### Deploy to VPS
```bash
# Install PM2 for process management
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Set up nginx reverse proxy
# Configure SSL with Let's Encrypt
```

## 📈 Analytics & Monitoring

### Built-in Analytics
- User engagement metrics
- Ad viewing statistics
- Task completion rates
- Referral conversion tracking
- Revenue analytics

### Monitoring
- Error logging with detailed stack traces
- Performance monitoring
- API response time tracking
- Database query optimization
- Real-time alerts for critical issues

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Important Notes

1. **Compliance**: Ensure compliance with local regulations regarding cryptocurrency and advertising
2. **Testing**: Thoroughly test all features before production deployment
3. **Security**: Regularly update dependencies and conduct security audits
4. **Monetag**: Configure your Monetag account and verify ad integration
5. **Firebase**: Set up proper security rules for your Firestore database
6. **TRX Wallet**: Implement proper TRX wallet integration for actual withdrawals

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

---

**Built with ❤️ for the Telegram and TRX community**