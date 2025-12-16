# 🚀 DigiSewa Admin System Setup Guide

## 🎯 What We've Built

A complete, secure admin system with:
- **Role-based access control** (Super Admin, Admin, Officer)
- **Secure authentication** with JWT tokens
- **Admin access codes** for additional security
- **Comprehensive admin dashboard**
- **Database-driven user management**

## 🔑 **ADMIN CREDENTIALS (READY TO USE)**

### 👑 **Super Administrator**
- **Email:** `admin@government.in`
- **Password:** `Admin@2024`
- **Access Code:** `ADMIN2024`
- **Role:** `super_admin`
- **Department:** IT Department
- **Permissions:** Full system access

### 🏢 **Municipal Officer**
- **Email:** `officer@municipal.gov.in`
- **Password:** `Admin@2024`
- **Access Code:** `MUNICIPAL2024`
- **Role:** `officer`
- **Department:** Municipal Corporation
- **Permissions:** Applications, Licenses, Verify, Issue

### 🚗 **RTO Officer**
- **Email:** `officer@rto.gov.in`
- **Password:** `Admin@2024`
- **Access Code:** `RTO2024`
- **Role:** `officer`
- **Department:** Regional Transport Office
- **Permissions:** Applications, Licenses, Verify, Issue

### 🍽️ **FSSAI Officer**
- **Email:** `officer@fssai.gov.in`
- **Password:** `Admin@2024`
- **Access Code:** `FSSAI2024`
- **Role:** `officer`
- **Department:** Food & Drug Administration
- **Permissions:** Applications, Licenses, Verify, Issue

## 🛠️ **Setup Instructions**

### **Step 1: Database Setup**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script: `backend/scripts/setup-admin.sql`

### **Step 2: Backend Setup**
```bash
cd backend
npm install
node scripts/setup-admin.js
```

### **Step 3: Frontend Setup**
The frontend is already updated with:
- Admin login form
- Admin dashboard component
- Proper routing

### **Step 4: Start Services**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd ../
npm run dev
```

## 🌐 **How to Access**

1. **Go to:** `http://localhost:8080/login`
2. **Click:** "Admin Portal" tab
3. **Enter credentials** from above
4. **Access Code:** Use the corresponding access code
5. **Login** and access the admin dashboard

## 🔐 **Security Features**

- **Password Hashing:** Bcrypt with salt rounds
- **JWT Tokens:** Secure session management
- **Access Codes:** Additional authentication layer
- **Role-based Permissions:** Granular access control
- **Session Management:** Secure logout and token invalidation

## 📊 **Admin Dashboard Features**

- **Statistics Overview:** Application counts and status
- **Quick Actions:** Review applications, manage users
- **Recent Applications:** Latest submissions requiring attention
- **Role-based UI:** Different features based on permissions
- **Secure Logout:** Proper session cleanup

## 🚨 **Important Notes**

1. **Default passwords** are set to `Admin@2024` - change them in production
2. **Access codes** expire on December 31, 2025
3. **Super admin** can create new admin users
4. **All passwords** are securely hashed using bcrypt
5. **JWT tokens** expire after 24 hours

## 🔧 **Troubleshooting**

### **If admin login fails:**
1. Check if backend is running on port 5000
2. Verify database tables are created
3. Check browser console for errors
4. Ensure .env file has correct Supabase credentials

### **If dashboard doesn't load:**
1. Check admin token in localStorage
2. Verify backend admin routes are working
3. Check network tab for API calls

## 📁 **Files Created/Modified**

### **Backend:**
- `scripts/setup-admin.sql` - Database schema
- `scripts/setup-admin.js` - Setup script
- `src/services/adminAuthService.js` - Authentication service
- `src/routes/admin.js` - Admin API routes
- `src/index.js` - Added admin routes

### **Frontend:**
- `src/pages/AdminDashboard.tsx` - Admin dashboard
- `src/pages/Login.tsx` - Updated admin login
- `src/App.tsx` - Added admin route

## 🎉 **You're Ready!**

The admin system is now fully functional with:
- ✅ Secure authentication
- ✅ Role-based access control
- ✅ Comprehensive dashboard
- ✅ User management capabilities
- ✅ Application review system

**Login now at:** `http://localhost:8080/login` (Admin Portal tab)

---

*For support or questions, check the backend logs and browser console for detailed error messages.*
