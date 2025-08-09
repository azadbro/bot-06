# 🚀 Vercel Deployment Guide for TRX Earn Bot

## Step-by-Step Deployment Instructions

### 1. **Prepare Your Repository**
```bash
# Make sure all files are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. **Vercel Project Setup**

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Click "New Project"**
3. **Import your GitHub repository**

### 3. **Configure Project Settings**

**Framework Preset:**
- Select: `Other`

**Root Directory:**
- Leave as: `.` (root directory)

**Build Command:**
```bash
npm run vercel-build
```

**Output Directory:**
```bash
client/build
```

**Install Command:**
```bash
npm run install-all
```

**Node.js Version:**
- Select: `18.x`

### 4. **Environment Variables**

In your Vercel project settings, add these environment variables:

#### **Required Environment Variables:**

```env
# Telegram Bot Token
TELEGRAM_BOT_TOKEN=7096589006:AAGPcnt_EpsT-ljb0pIURDEBc3iNpUqxQlc

# Firebase Configuration (already hardcoded in config)
FIREBASE_PROJECT_ID=trx-earn-bott
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@trx-earn-bott.iam.gserviceaccount.com

# Monetag Configuration
MONETAG_ZONE_ID=9682261

# App Settings
MINIMUM_WITHDRAWAL=3.5
WITHDRAWAL_COMMISSION=0.10
AD_REWARD=0.005
REFERRAL_REWARD=0.05
REFERRAL_VERIFICATION_ADS=5
AD_COOLDOWN_SECONDS=15

# Admin Panel
ADMIN_PASSWORD=your_secure_admin_password_here
```

#### **Optional (Firebase Private Key - if not hardcoded):**
```env
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD5CEBqrXmDgInJ\no+dwjUpDc8zBPt/pNsb9FVOf0GE0A6wCTgDdRrS1t4BQSpI/Bp5jHWSZYMNA9N2z\nTAAJqrqYAPNLcpjxL0S5KtxRtkmCAi0wFMWlRvYvCrVdQFIB7l9PLst6IaJCKlmb\ng7AqepUf4KZseMZEj/c4oePrSxzh1+2NfvK+eJan36Ke9EH9CY0qVRCZFYNbWxdb\n7OfPlqxIHTUs9/ZltWVNL7D7PcgucGM0bRn2xbH+jqXqOugivnsi+A6O5t+fWa5U\ncefvZmEwcfiMeHS8DqWoUMDMJ4UaOecgBEG/LzrWlJ7qxsn1BOgFxz2u9Q3yz/yH\nTs58bVeFAgMBAAECggEACPrkccRYJ6cMsO39ZEhgB28nUMee5ObCBbHNbmuh+bFx\nNDMSYmhQj2Xy1VJfFDE9qGbQsBw2ZkL+NJ82uCKFMIKGQ2/6NmZFNOUoBTVM0MiZ\nzwxMtUFKEtewwxBU9LdfDfiqwzhvxLGIwiwdP+bkNj5QWgR/58yGNm9WC+/NNpKT\ny2CaPaf2eVkHJ+kBuYUWecwq2hskXxH0sLvQM/XVkL7RJ5/Vn/LWzlj8k7yfKiTE\niU5kIR7hjvceRbiWqp355cKlgfMVW51qZDuK4ctWbcdCGuG9BK3frQASve/lqW8S\n68pjOFQH10twBLLH8mkDhxQefv2cEQOrr/s0TkNKeQKBgQD9KnT26c/DGT+f/iy9\nPL943encvyy+uqfomVCTBb5XN2ZkTVuMRNBa0M0JcjZpB1xYvh4RHUKDIKf14Nof\n8QHOyBmQsNlecVyDKGfpjVxdlOf4fBpNxauCRQ3gVrzskDKP3uvv9eO8kotkthxg\n3vVs1p6PlvYRB46wNq30YAlefQKBgQD70fLDHxWET3+KEY46FcBYEYdFC5qq/Fyo\nF1kKeYSKMLW+VEBkaSbSMMv0cv14eNgeD5/FY4SSaEt1bERix4kb2a+xcmvuWaQ7\nmCeplPSRjjHc84sJbPYLDiUIs08txpWInHYMAFnoxMAnscax3DEfegzOJWq9DDbn\ncpKvN7SDqQKBgBAZyyaI6DW4PVunhqDiZCsDsgPgBLB8noEkfwNasihJ1bE7Wj8p\ngTbFYMThBqTXWwAp1y+vdLNyODxi+Hxfj4XfJAEXvjtLal7NCw7HdsBc4APloKah\nk67NRXynB4zj/tM3kjnIoZs0lrjo/BUNGP67B4qKR0v99w0t7RJFqVLhAoGBAPih\ng0J592GqqG9nA/l/rmiF7fwTCAQYpVdlrgl0j5NtopQoVWeOlsDjYwyZWIBROHj9\nzi8zIhr4FMD8Q80P2+T+msTmB4DPSyN4CHkcVBk+vya746RLy+aAcbpUaDH3J385\nlCgnVJ5JXLwUf+zuTiYY+Hm1Yd0EKVV9vyx3IKj5AoGBAMuoZT65HSrv+M2PSgCG\nfhx7OqL0gUVL0+PGELGHwjKkFsDsLcbE9M+BwFUUsg+YNSMNyE9c2iB1Hzs16fct\n2UVnPDb+glwsnE0GCxdAM6qb8QEo7/vTPQG3GIYBUwsVj1WnLfiUdI7tbKT015N8\neoG2Efy27P+9orJJbyfOlhaa\n-----END PRIVATE KEY-----\n
```

### 5. **Deploy**

1. **Click "Deploy"**
2. **Wait for build to complete**
3. **Your app will be available at: `https://your-project-name.vercel.app`**

### 6. **Access Points After Deployment**

- **Main App:** `https://your-project-name.vercel.app`
- **Admin Panel:** `https://your-project-name.vercel.app/admin/`
- **API Endpoints:** `https://your-project-name.vercel.app/api/*`

### 7. **Test Your Deployment**

1. **Test Frontend:**
   - Visit your Vercel URL
   - Check if the loading screen appears
   - Verify Telegram Web App integration

2. **Test API:**
   - Visit: `https://your-project-name.vercel.app/api/health`
   - Should return: `{"status":"OK",...}`

3. **Test Admin Panel:**
   - Visit: `https://your-project-name.vercel.app/admin/`
   - Login with your admin password

### 8. **Configure Telegram Bot**

After successful deployment:

1. **Message @BotFather on Telegram**
2. **Use `/setmenubutton` command**
3. **Set Web App URL:** `https://your-project-name.vercel.app`
4. **Set button text:** "💎 Earn TRX"

### 9. **Firebase Setup**

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project: `trx-earn-bott`**
3. **Enable Firestore Database**
4. **Set Firestore Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 10. **Troubleshooting**

#### **Common Issues:**

1. **Build Fails:**
   - Check if all dependencies are installed
   - Verify environment variables are set
   - Check build logs in Vercel dashboard

2. **API Not Working:**
   - Check serverless function logs
   - Verify Firebase connection
   - Test with local development first

3. **Frontend Loads but API Fails:**
   - Check CORS settings
   - Verify API base URL is correct
   - Check network tab in browser

#### **Debug Commands:**
```bash
# Test locally first
npm run dev

# Build locally to test
npm run build

# Check if all files are included
git status
```

### 11. **Post-Deployment Checklist**

- [ ] App loads successfully
- [ ] Telegram Web App integration works
- [ ] User registration/login works
- [ ] Firebase database connection works
- [ ] Admin panel accessible
- [ ] All 4 sections (Wallet, Earn, Tasks, Referral) work
- [ ] Monetag ads load (test in production)
- [ ] Withdrawal system works
- [ ] Referral system functions

### 12. **Performance Optimization**

After deployment, consider:

1. **Enable Analytics:**
   - Add Vercel Analytics
   - Monitor page load times
   - Track user engagement

2. **Optimize Images:**
   - Add image optimization
   - Use WebP format where possible

3. **Monitor Usage:**
   - Check Vercel function usage
   - Monitor Firebase reads/writes
   - Track API response times

### 13. **Security Notes**

- ✅ Firebase credentials are configured
- ✅ Admin password is set
- ✅ Rate limiting is enabled
- ✅ CORS is properly configured
- ✅ Input validation is implemented

### 14. **Monetag Integration**

After deployment:
1. **Test ad loading in production**
2. **Verify ad rewards are credited**
3. **Check ad cooldown system**
4. **Monitor ad performance**

---

## 🎉 Your TRX Earn Bot is now live on Vercel!

**Next Steps:**
1. Share your bot with users
2. Monitor usage and performance
3. Add more tasks as needed
4. Process withdrawal requests via admin panel

**Support:**
- Check Vercel deployment logs for issues
- Use browser console for frontend debugging
- Monitor Firebase usage and costs