# DigiSewa Application Flow Chart

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIGISEWA APPLICATION                        │
│              Blockchain-Based Digital License System           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                        │
│                         Port: 8080                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js)                       │
│                         Port: 5000                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN + SUPABASE                       │
│              Smart Contracts + Database                        │
└─────────────────────────────────────────────────────────────────┘
```

## 👥 User Role Flow Chart

```
                    ┌─────────────────┐
                    │   USER ENTRY    │
                    │   (Homepage)    │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   AUTHENTICATE  │
                    │  Login/Register │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  ROLE DETECTION │
                    └─────────┬───────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   CITIZEN   │ │   OFFICER   │ │    ADMIN    │
            └─────────────┘ └─────────────┘ └─────────────┘
```

## 🏠 Citizen User Flow

```
┌─────────────────┐
│   CITIZEN FLOW  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   DASHBOARD     │
│  View Apps      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   SERVICES      │
│  Browse & Apply │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ APPLICATION     │
│   FORM          │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   DOCUMENT      │
│   UPLOAD        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│    PAYMENT      │
│  (Blockchain)   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   SUBMISSION    │
│  & Tracking     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   NOTIFICATION  │
│  Status Updates │
└─────────────────┘
```

## 👮 Officer Flow

```
┌─────────────────┐
│   OFFICER FLOW  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ OFFICER LOGIN   │
│  (Department)   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   DASHBOARD     │
│  Pending Apps   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ REVIEW          │
│ APPLICATION     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ VERIFY          │
│ DOCUMENTS       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ APPROVE/REJECT  │
│  Decision       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ UPDATE          │
│  Blockchain     │
└─────────────────┘
```

## 👑 Admin Flow

```
┌─────────────────┐
│    ADMIN FLOW   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  ADMIN LOGIN    │
│  (Super User)   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ ADMIN DASHBOARD │
│  System Overview│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   MANAGE USERS  │
│  Add/Edit/Delete│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ REVIEW          │
│ APPLICATIONS    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ SYSTEM SETTINGS │
│  Configuration  │
└─────────────────┘
```

## 🔄 Application Processing Flow

```
┌─────────────────┐
│ APPLICATION     │
│   SUBMITTED     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   VALIDATION    │
│  Auto Check     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   QUEUE         │
│  Officer Review │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   REVIEW        │
│  Manual Check   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   DECISION      │
│ Approve/Reject  │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   BLOCKCHAIN    │
│  Smart Contract │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   NOTIFICATION  │
│  User Update    │
└─────────────────┘
```

## 🔗 API Endpoints Flow

```
┌─────────────────┐
│   FRONTEND      │
│   (React)       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   API ROUTES    │
│   (Express)     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   MIDDLEWARE    │
│  Auth + CORS    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   SERVICES      │
│  Business Logic │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   DATABASE      │
│  (Supabase)     │
└─────────────────┘
```

## 🚀 Service Application Flow

```
┌─────────────────┐
│   SERVICE       │
│   SELECTION     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   FORM FILL     │
│  Step 1-5       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   DOCUMENT      │
│   UPLOAD        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   VALIDATION    │
│  Form Check     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   PAYMENT       │
│  Processing     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   SUBMIT        │
│  Application    │
└─────────────────┘
```

## 🔐 Authentication Flow

```
┌─────────────────┐
│   USER INPUT    │
│  Email/Password │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   VALIDATION    │
│  Input Check    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   SUPABASE      │
│  Auth Service   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   JWT TOKEN     │
│  Generation     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│   SESSION       │
│  Management     │
└─────────────────┘
```

## 📊 Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │   BACKEND       │    │   BLOCKCHAIN    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Smart       │
│                 │    │                 │    │    Contracts)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   LOCAL STATE   │    │   DATABASE      │    │   WALLET       │
│   (Context)     │    │   (Supabase)    │    │   (MetaMask)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Key Features Flow

### Document Management
```
UPLOAD → VALIDATE → ENCRYPT → STORE → RETRIEVE → DECRYPT → DISPLAY
```

### Payment Processing
```
SELECT SERVICE → CALCULATE FEES → CONNECT WALLET → TRANSACTION → CONFIRMATION
```

### Application Tracking
```
SUBMIT → PROCESS → REVIEW → DECIDE → UPDATE → NOTIFY → COMPLETE
```

## 🔄 System States

```
DRAFT → SUBMITTED → PROCESSING → UNDER_REVIEW → APPROVED/REJECTED → COMPLETED
```

## 📱 Responsive Flow

```
DESKTOP → TABLET → MOBILE → RESPONSIVE_LAYOUT → OPTIMIZED_UI
```

---

## 📋 Summary

**Total Pages:** 16
**User Roles:** 3 (Citizen, Officer, Admin)
**Main Flows:** 8
**API Endpoints:** 6 main routes
**Database:** Supabase (PostgreSQL)
**Blockchain:** Ethereum Smart Contracts
**Frontend:** React + TypeScript + Tailwind CSS
**Backend:** Node.js + Express

This flow chart represents the complete architecture and user journey through the DigiSewa blockchain-based digital government license system.
