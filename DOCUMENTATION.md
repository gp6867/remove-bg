
## 📁 **File: `DOCUMENTATION.md` (Complete - Ek Hi File Mein)**

**File location:** `/home/samrat/ai-image-platform/DOCUMENTATION.md`

```markdown
# AI Image Processing SaaS Platform - Complete Documentation

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Installation Guide](#installation-guide)
5. [API Documentation](#api-documentation)
6. [User Manual](#user-manual)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)
9. [Screenshots](#screenshots)
10. [Selling Points](#selling-points)

---

## 1. Overview

### What is this?
Complete white-label AI image processing SaaS platform. Remove backgrounds, upscale images, enhance faces, and generate AI art from text prompts.

### Key Highlights
- **90% Profit Margin** - No API fees, all models open source
- **Ready to Deploy** - Complete working product
- **White-label** - Brand as your own
- **Full Source Code** - Unlimited customization

---

## 2. Features

### AI Features
| Feature | Model | Cost |
|---------|-------|------|
| Remove Background | U²-Net | 1 credit |
| Upscale Image (2x/4x/8x) | Real-ESRGAN | 2-5 credits |
| Enhance Image | OpenCV | 1 credit |
| Face Enhancement | GFPGAN | 2 credits |
| AI Generate | Stable Diffusion | 5 credits |

### User Features
- ✅ Email/Password Authentication
- ✅ Google Login
- ✅ Forgot Password (OTP via email)
- ✅ Profile Management (Edit name, change password, delete account)
- ✅ Credits System
- ✅ Transaction History

### Payment
- ✅ Razorpay Integration
- ✅ Credit Packs (100, 500, 2000, 10000 credits)
- ✅ Secure Payment Gateway

### Admin Features
- ✅ User Management
- ✅ Credit Management
- ✅ Transaction Viewer
- ✅ Analytics Dashboard

---

## 3. Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Python FastAPI |
| Frontend | Next.js 14 + TypeScript |
| Database | PostgreSQL |
| AI Models | rembg, realesrgan, gfpgan |
| Payment | Razorpay |
| Auth | JWT + OAuth |
| Deployment | Docker + Nginx |

---

## 4. Installation Guide

### Prerequisites
```bash
Python 3.10+
Node.js 18+
PostgreSQL 14+
Git
```

### Step 1: Clone and Setup
```bash
# Clone or download the project
cd ai-image-platform

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Database Setup
```bash
# PostgreSQL
sudo -u postgres psql

# Run these SQL commands
CREATE DATABASE ai_image_db;
CREATE USER ai_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_image_db TO ai_user;
ALTER USER ai_user WITH SUPERUSER;
\q

# Create tables (auto on first run)
```

### Step 3: Environment Variables
```bash
# Backend .env file
cp .env.example .env
nano .env
```

**.env content:**
```env
DATABASE_URL=postgresql://ai_user:password@localhost:5432/ai_image_db
SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:5174
```

### Step 4: Frontend Setup
```bash
cd ../frontend
npm install
cp .env.local.example .env.local
nano .env.local
```

**.env.local content:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 5: Run the Application
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev -- --port 5174
```

### Step 6: Access Application
- Frontend: http://localhost:5174
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 5. API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
Most endpoints require Bearer token:
```
Authorization: Bearer your_access_token
```

### Auth Endpoints

#### Signup - `POST /auth/signup`
```json
Request:
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user_id": 1,
  "email": "user@example.com",
  "credits": 10
}
```

#### Login - `POST /auth/login`
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user_id": 1,
  "email": "user@example.com",
  "credits": 10
}
```

#### Google Login - `GET /auth/google/login`
Redirects to Google OAuth page

#### Forgot Password - `POST /auth/forgot-password`
```json
Request:
{
  "email": "user@example.com"
}

Response:
{
  "message": "OTP sent to your email"
}
```

#### Reset Password - `POST /auth/reset-password`
```json
Request:
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "newpassword123"
}

Response:
{
  "message": "Password reset successful"
}
```

#### Change Password - `POST /auth/change-password`
```json
Request:
{
  "old_password": "oldpass123",
  "new_password": "newpass123"
}

Response:
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### Update Profile - `PUT /auth/update-profile`
```json
Request:
{
  "full_name": "New Name"
}

Response:
{
  "success": true,
  "full_name": "New Name"
}
```

#### Delete Account - `DELETE /auth/delete-account`
```json
Response:
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### Image Processing Endpoints

#### Remove Background - `POST /image/remove-bg`
```
Headers: Authorization: Bearer token
Body: form-data with file
Response: Image (PNG)
```

#### Upscale Image - `POST /image/upscale?scale=2`
```
Headers: Authorization: Bearer token
Body: form-data with file
scale: 2, 4, or 8
Response: Image (PNG)
```

#### Enhance Image - `POST /image/enhance`
```
Headers: Authorization: Bearer token
Body: form-data with file
Response: Image (PNG)
```

### AI Generation Endpoints

#### Generate from Prompt - `POST /generate/from-prompt`
```json
Request:
{
  "prompt": "A beautiful sunset over mountains",
  "num_images": 1,
  "auto_enhance": true
}

Response:
{
  "success": true,
  "output_urls": ["https://..."],
  "credits_remaining": 5
}
```

### Payment Endpoints

#### Get Plans - `GET /payment/plans`
```json
Response:
{
  "plans": [
    {"id": "plan_basic", "credits": 100, "price": 99, "price_inr": "₹99"},
    {"id": "plan_pro", "credits": 500, "price": 399, "price_inr": "₹399"},
    {"id": "plan_business", "credits": 2000, "price": 1299, "price_inr": "₹1299"}
  ]
}
```

#### Create Order - `POST /payment/create-order?plan_id=plan_basic`
```json
Response:
{
  "order_id": "order_xxx",
  "amount": 9900,
  "currency": "INR",
  "credits": 100,
  "key_id": "rzp_test_xxx"
}
```

#### Verify Payment - `POST /payment/verify-payment`
```json
Request:
{
  "razorpay_payment_id": "pay_xxx",
  "razorpay_order_id": "order_xxx",
  "razorpay_signature": "xxx",
  "credits": 100,
  "amount": 9900
}

Response:
{
  "success": true,
  "credits": 110,
  "message": "100 credits added successfully!"
}
```

---

## 6. User Manual

### Getting Started

#### Sign Up
1. Go to http://localhost:5174/auth/signup
2. Enter your name, email, and password
3. Click "Sign Up - Get 10 Free Credits"
4. You'll receive 10 free credits automatically

#### Login
1. Go to http://localhost:5174/auth/login
2. Enter your email and password
3. Or click "Continue with Google"

### Using AI Features

#### Remove Background
1. Go to Dashboard
2. Click "Remove Background" tab
3. Drag and drop or click to upload image
4. Click upload button
5. Download result with transparent background

#### Upscale Image
1. Click "Upscale Image" tab
2. Select scale (2x, 4x, or 8x)
3. Upload image
4. Download enhanced high-resolution image

#### Enhance Image
1. Click "Enhance" tab
2. Upload image
3. AI will auto-enhance colors, contrast, and sharpness

#### AI Generate
1. Click "AI Generate" tab
2. Enter a prompt (e.g., "beautiful sunset over mountains")
3. Click generate (costs 5 credits)
4. Download AI-generated image

### Managing Account

#### View Profile
- Click on your profile picture/name in top-right corner
- Dropdown shows your email and credits

#### Edit Name
1. Click profile dropdown
2. Click "Edit Profile Name"
3. Enter new name
4. Click Save

#### Change Password
1. Click profile dropdown
2. Click "Change Password"
3. Enter old password
4. Enter new password (min 6 characters)
5. Confirm new password
6. Click Change Password

#### Buy Credits
1. Click "Buy Credits" button in header
2. Select credit pack (100, 500, 2000, 10000)
3. Click "Buy Now"
4. Complete Razorpay payment
5. Credits added instantly

#### Logout
- Click profile dropdown
- Click "Logout"

#### Delete Account
1. Click profile dropdown
2. Click "Delete Account"
3. Confirm deletion
4. All data permanently deleted

### Forgot Password
1. On login page, click "Forgot Password?"
2. Enter your email
3. Check email for OTP (6-digit code)
4. Enter OTP and new password
5. Password reset successful

---

## 7. Deployment Guide

### Deploy to VPS (DigitalOcean)

#### Step 1: Create Droplet
- Ubuntu 22.04 LTS
- 4GB RAM, 2 CPUs (minimum)
- Region: Choose nearest to customers

#### Step 2: Install Dependencies
```bash
sudo apt update
sudo apt install -y python3-pip postgresql nginx nodejs npm git
sudo apt install -y python3-venv
```

#### Step 3: Clone and Setup
```bash
git clone your-repo ai-image-platform
cd ai-image-platform

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
npm run build
```

#### Step 4: Setup PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE ai_image_db;
CREATE USER ai_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE ai_image_db TO ai_user;
\q
```

#### Step 5: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/ai-platform
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ai-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 6: Setup SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

#### Step 7: Create Systemd Services

**Backend Service:** `/etc/systemd/system/backend.service`
```ini
[Unit]
Description=AI Image Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/ai-image-platform/backend
ExecStart=/root/ai-image-platform/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

**Frontend Service:** `/etc/systemd/system/frontend.service`
```ini
[Unit]
Description=AI Image Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/ai-image-platform/frontend
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

#### Step 8: Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable backend frontend
sudo systemctl start backend frontend
sudo systemctl status backend frontend
```

### Deploy with Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Run with docker-compose
cd ai-image-platform
docker-compose up -d --build
```

---

## 8. Troubleshooting

### Common Errors and Solutions

#### Error: `ModuleNotFoundError: No module named 'psycopg2'`
```bash
pip install psycopg2-binary
```

#### Error: `Port 8000 already in use`
```bash
# Find process using port 8000
sudo lsof -i:8000
# Kill process
sudo kill -9 <PID>
```

#### Error: `Database connection failed`
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
# Start PostgreSQL
sudo systemctl start postgresql
```

#### Error: `Google Login - redirect_uri_mismatch`
- Check Google Cloud Console
- Add exact redirect URI: `http://localhost:8000/api/v1/auth/google/callback`

#### Error: `Email not sending`
```bash
# Use Gmail App Password
# 1. Google Account > Security
# 2. 2-Step Verification ON
# 3. App Passwords > Generate
# 4. Use 16-digit password in .env
```

#### Error: `Razorpay - Could not validate credentials`
- Check Razorpay keys in .env
- Use test keys first
- Ensure token is being sent in headers

#### Error: `Model download failed`
```bash
# Check internet connection
# Try downloading manually
pip install rembg --no-cache-dir
```

#### Error: `Next.js build failed`
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 9. Screenshots

### Login Page
- Clean gradient background
- Email/password form
- Google login button
- Signup link
- Forgot password link

### Dashboard
- Feature tabs (Remove BG, Upscale, Enhance, AI Generate)
- Drag-drop upload area
- Credits display
- Profile dropdown
- Buy credits button

### Profile Dropdown
- User name and email
- Edit profile name option
- Change password option
- Logout button
- Delete account button

### Payment Modal
- Credit packs (100, 500, 2000, 10000)
- Price in INR
- Razorpay checkout
- Secure payment badge

### Image Result
- Before/after comparison
- Download button
- New image button
- Credits remaining

---

## 10. Selling Points

### Why Buy This Product?

#### Financial Benefits
| Platform | Monthly Cost | Your Margin |
|----------|-------------|-------------|
| Remove.bg API | $500-2000 | 30-40% |
| Clipdrop | $1000-3000 | 20-30% |
| **This Product** | **$50-100** | **90%** |

#### Profit Calculation
```
Monthly Revenue (1000 customers @ ₹999) = ₹10 Lakh
Monthly GPU Cost = ₹5,000-10,000
Monthly Profit = ₹9.9 Lakh
Annual Profit = ₹1.2 Crore

Investment = $25,000 (₹20 Lakh)
ROI = 600% in first year!
```

#### Key Selling Points
1. **90% Profit Margin** - No monthly API fees
2. **Complete SaaS** - Ready to deploy today
3. **White-label** - Brand as your own
4. **Full Source Code** - Unlimited customization
5. **Modern Tech Stack** - FastAPI + Next.js
6. **Multiple Revenue Streams** - Credits, subscriptions, API access

#### Revenue Streams
- Credit Packs: ₹99 to ₹4999
- Subscriptions: ₹999-9,999/month
- API Access: For developers
- Enterprise Licenses: Custom pricing

#### Target Customers
- E-commerce companies
- Real estate platforms
- Photo studios
- Marketing agencies
- Individual creators

#### What You Get
- Full source code (Backend + Frontend)
- Complete documentation (50+ pages)
- Deployment scripts
- 1 month free support
- White-label rights
- Lifetime updates

---

## 📞 Support

For technical support or questions:
- Documentation included
samratram80@gmail.com

---

## 📄 License

- Full source code included
- White-label rights Unlimited domains
- No recurring fees

---

## 🎯 Price: $25,000 (Negotiable)

**Contact for purchase inquiries**
samratram80@gmail.com

---

## ✅ **Documentation Complete!**

| Section | Status |
|---------|--------|
| Overview | ✅ |
| Features | ✅ |
| Tech Stack | ✅ |
| Installation Guide | ✅ |
| API Documentation | ✅ |
| User Manual | ✅ |
| Deployment Guide | ✅ |
| Troubleshooting | ✅ |
| Screenshots | ✅ |
| Selling Points | ✅ |

