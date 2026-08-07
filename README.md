# Localism - Backend Ecosystem & API Engine

[![Build & Test Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/NHSon05/nestjs-boilerplate)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Localism** is a modern, hyper-local travel backend platform built with **NestJS**, **Prisma ORM (PostgreSQL & PostGIS)**, **Agora WebRTC**, **Firebase Cloud Messaging (FCM)**, and **Google Gemini AI**. The platform connects tourists with verified local guides, providing real-time location-based guide discovery, transactional guide request management, end-to-end encrypted real-time messaging, audio/video calling, push notifications, and AI-powered travel itineraries.

---

## 📋 Table of Contents

- [Overview & Vision](#-overview--vision)
- [System Architecture](#-system-architecture)
- [Core Features](#-core-features)
- [User Flows & Sequence Diagrams](#-user-flows--sequence-diagrams)
  - [1. Authentication & Token Rotation Flow](#1-authentication--token-rotation-flow)
  - [2. Guide Discovery & Request State Machine](#2-guide-discovery--request-state-machine)
  - [3. Real-Time Messaging & Notification Flow](#3-real-time-messaging--notification-flow)
  - [4. Audio/Video Call Flow (Agora WebRTC)](#4-audiovideo-call-flow-agora-webrtc)
  - [5. AI Travel Assistant Flow (Gemini AI)](#5-ai-travel-assistant-flow-gemini-ai)
- [Tech Stack & Dependencies](#-tech-stack--dependencies)
- [Project Directory Structure](#-project-directory-structure)
- [Environment Variables (.env)](#-environment-variables-env)
- [Installation & Setup](#-installation--setup)
  - [Prerequisites](#prerequisites)
  - [Option A: Local Development (Pnpm)](#option-a-local-development-pnpm)
  - [Option B: Docker Compose](#option-b-docker-compose)
- [API Endpoints Summary](#-api-endpoints-summary)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Security & Performance](#-security--performance)
- [License](#-license)

---

## 🌟 Overview & Vision

Traditional travel booking engines often focus on mass commercial tours. **Localism** redefines urban and cultural exploration by establishing direct, personal connections between travelers and authentic local experts.

### Target Personas:
* **Tourists**: Travelers seeking personalized local experiences, instant guide discovery by location, real-time communication, and AI travel assistance.
* **Local Guides**: Native residents sharing authentic knowledge, offering flexible schedules, accepting connection requests, and building verifiable review ratings.
* **Administrators**: Operations managers overseeing user verification, safety compliance, content moderation, and platform analytics.

---

## 🏗️ System Architecture

Localism is structured as a **Modular Monolith** designed for high throughput, strict domain isolation, and eventual microservice extraction.

```text
                        ┌────────────────────────────────────────┐
                        │    Mobile Client (Flutter / RN / iOS)  │
                        └───────────────────┬────────────────────┘
                                            │
                                  REST / WSS / WebRTC
                                            │
                                            v
                        ┌────────────────────────────────────────┐
                        │      Reverse Proxy / API Gateway       │
                        └───────────────────┬────────────────────┘
                                            │
                                            v
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │                              NestJS Application Engine                           │
  │                                                                                  │
  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐ │
  │  │  Auth & Users│  │ GuideRequest │  │ Conversations  │  │ Notifications Module│ │
  │  │  Module      │  │ Module       │  │ & Messages Mod │  │ (In-App + FCM Push) │ │
  │  └──────────────┘  └──────────────┘  └────────────────┘  └─────────────────────┘ │
  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐ │
  │  │ Locations &  │  │ Calls Module │  │ Uploads Module │  │ AI Assistant        │ │
  │  │ PostGIS Mod  │  │ (Agora RTC)  │  │ (Cloudinary)   │  │ (Gemini AI API)     │ │
  │  └──────────────┘  └──────────────┘  └────────────────┘  └─────────────────────┘ │
  └─────────────────────────────────────────┬────────────────────────────────────────┘
                                            │
           ┌────────────────────────────────┼────────────────────────────────┐
           │                                │                                │
           v                                v                                v
┌─────────────────────┐          ┌─────────────────────┐          ┌─────────────────────┐
│ PostgreSQL + PostGIS│          │ Firebase Admin (FCM)│          │  Agora RTC Engine   │
└─────────────────────┘          └─────────────────────┘          └─────────────────────┘
```

---

## ✨ Core Features

### 🔐 1. Authentication & Security
- Dual-token auth architecture (**Short-lived JWT Access Token** + **Hashed Refresh Token Rotation**).
- Multi-device session revocation (`POST /auth/logout-all`).
- Role-based Access Control (**RBAC** for `TOURIST`, `GUIDE`, `ADMIN`).
- Password security via `bcrypt` hashing.

### 📍 2. Geospatial Location & Guide Search
- Dual-mode discovery: **Real-time GPS coordinates** or **Manual destination select**.
- PostgreSQL **PostGIS** geospatial indexing (`geography(Point,4326)`) for dynamic distance calculations (`ST_DWithin`, `ST_Distance`).
- Configurable guide availability thresholds with automatic location expiration.

### 🤝 3. Guide Request Transaction Engine
- State Machine lifecycle: `PENDING` ➔ `ACCEPTED` / `REJECTED` / `CANCELLED` ➔ `IN_PROGRESS` ➔ `COMPLETED`.
- ACID transaction guarantees (`prisma.$transaction`) preventing double-acceptance or race conditions.
- Auto-creation of private 1-on-1 `Conversation` upon request acceptance.

### 💬 4. Real-time Messaging
- WebSocket gateway (`/chat`) with JWT socket handshake validation.
- Message types: `TEXT`, `IMAGE`, `AUDIO`, `VIDEO`, `FILE`.
- Client-side **Idempotency** enforcement (`clientMessageId` preventing duplicate delivery on unstable mobile networks).
- Cursor-based message history pagination (`take + 1`, `cursor: { id }`).
- Soft-deletion with privacy shielding (`deletedAt` masks content as *"Message recalled"*).

### 📞 5. Audio / Video Calling (Agora WebRTC Integration)
- Real-time signaling via WebSocket Gateway (`/calls`).
- Dynamic RTC token generation using Agora SDK (`RtcTokenBuilder2`).
- Call status state machine: `RINGING` ➔ `ACCEPTED` / `REJECTED` ➔ `ENDED`.

### 🔔 6. Unified Push Notifications Pipeline
- **Hybrid Delivery**: In-App WebSocket (`/notifications`) + **Firebase Cloud Messaging (FCM)**.
- Automated FCM device token registry (`device_tokens` model).
- Automatic token cleanup: Invalid/expired tokens are marked `isActive = false` upon FCM failure.

### 🤖 7. Gemini AI Travel Assistant
- Integrated with **Google Gemini AI SDK** (`@google/genai`).
- Context-aware conversation threads with configurable history depth.
- System prompts tailored for safe, local travel assistance.

---

## 🔄 User Flows & Sequence Diagrams

### 1. Authentication & Token Rotation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as Mobile Client
    participant API as NestJS Auth Controller
    participant DB as PostgreSQL Database

    Client->>API: POST /api/v1/auth/login { email, password }
    API->>DB: Verify credentials & Find User
    API->>API: Generate Access Token (15m) & Refresh Token (7d)
    API->>DB: Store hashed Refresh Token in RefreshSession
    API-->>Client: Return { accessToken, refreshToken, user }

    note over Client, API: Access Token expires after 15 minutes...

    Client->>API: POST /api/v1/auth/refresh { refreshToken }
    API->>DB: Validate Refresh Token & revoke old session
    API->>API: Generate new Access Token + new Refresh Token
    API->>DB: Store new Refresh Token (Rotation)
    API-->>Client: Return new { accessToken, refreshToken }
```

---

### 2. Guide Discovery & Request State Machine

```mermaid
sequenceDiagram
    autonumber
    actor Tourist as Tourist
    participant API as Guide Request Service
    participant DB as PostgreSQL Database
    actor Guide as Local Guide

    Tourist->>API: GET /api/v1/locations/guides/search?lat=16.054&lng=108.202&radiusKm=5
    API->>DB: Execute PostGIS Query (ST_DWithin)
    API-->>Tourist: Return list of nearby active guides

    Tourist->>API: POST /api/v1/guide-requests { guideId, startAt, endAt }
    API->>DB: Create GuideRequest (Status: PENDING)
    API-->>Guide: Trigger Notification (GUIDE_REQUEST_RECEIVED)

    alt Guide Accepts Request
        Guide->>API: PATCH /api/v1/guide-requests/:id/accept
        API->>DB: Transaction: Update Request (ACCEPTED) + Create Conversation
        API-->>Tourist: Trigger Notification (GUIDE_REQUEST_ACCEPTED)
    else Guide Rejects Request
        Guide->>API: PATCH /api/v1/guide-requests/:id/reject
        API->>DB: Update Request (REJECTED)
        API-->>Tourist: Trigger Notification (GUIDE_REQUEST_REJECTED)
    end
```

---

### 3. Real-Time Messaging & Notification Flow

```mermaid
sequenceDiagram
    autonumber
    actor UserA as Sender (User A)
    participant WS as WebSocket Gateway (/chat)
    participant Service as MessagesService
    participant DB as PostgreSQL
    participant FCM as Firebase Admin FCM
    actor UserB as Receiver (User B)

    UserA->>WS: Emit "message:send" { conversationId, content, clientMessageId }
    WS->>Service: create(senderId, conversationId, dto)
    Service->>DB: Check (senderId, clientMessageId) for Idempotency
    Service->>DB: Insert Message & Update Conversation.lastMessageAt
    Service-->>WS: Emit "message:new" to room user:{receiverId}
    
    alt Receiver is Online (Socket connected)
        WS-->>UserB: Realtime In-App Message Delivered
    else Receiver is Offline
        Service->>FCM: Send Multicast Push Notification
        FCM-->>UserB: Banner Notification on Mobile Device Screen
    end
```

---

### 4. Audio/Video Call Flow (Agora WebRTC)

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Caller
    participant Calls as Calls Module
    participant Agora as Agora Service
    participant Gateway as Calls Gateway (/calls)
    actor Receiver as Receiver

    Caller->>Calls: POST /api/v1/conversations/:id/calls { type: "VIDEO" }
    Calls->>Agora: Generate RTC Token for Caller & Receiver
    Calls->>Gateway: Emit "call:incoming" { callId, channelName, token }
    Gateway-->>Receiver: Ringing notification on screen

    alt Receiver Accepts
        Receiver->>Calls: PATCH /api/v1/calls/:callId/accept
        Calls->>Gateway: Emit "call:accepted"
        Caller->>Agora: Join WebRTC Channel
        Receiver->>Agora: Join WebRTC Channel
    else Receiver Rejects
        Receiver->>Calls: PATCH /api/v1/calls/:callId/reject
        Calls->>Gateway: Emit "call:rejected"
    end
```

---

### 5. AI Travel Assistant Flow (Gemini AI)

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant AI as AI Assistant Service
    participant DB as PostgreSQL
    participant Gemini as Google Gemini AI API

    User->>AI: POST /api/v1/ai/conversations/:id/messages { content: "Suggest 3-day itinerary in Da Nang" }
    AI->>DB: Fetch last N messages for conversation context
    AI->>DB: Save USER prompt message
    AI->>Gemini: generateResponse({ prompt, systemInstruction, history })
    Gemini-->>AI: Return AI generated itinerary & token usage
    AI->>DB: Transaction: Save ASSISTANT message & Update conversation title
    AI-->>User: Return { userMessage, assistantMessage }
```

---

## 🛠️ Tech Stack & Dependencies

* **Core Framework**: NestJS v11.x, Node.js (v20+), TypeScript v5.x
* **Database & ORM**: PostgreSQL v16+, PostGIS Geospatial Extension, Prisma ORM v7.9
* **Real-time Engine**: Socket.IO v4.x (WebSockets)
* **Real-time Calls**: Agora RTC SDK (`agora-token`)
* **Push Notifications**: Firebase Admin SDK (`firebase-admin`)
* **AI Provider**: Google Gemini AI (`@google/genai`)
* **Media Cloud Storage**: Cloudinary SDK
* **Testing Suite**: Jest, Supertest

---

## 📁 Project Directory Structure

```text
src/
├── main.ts                     # Application bootstrap & Swagger documentation
├── app.module.ts               # Root application module
├── agora/                      # Agora RTC Token Generator integration
├── ai-assistant/               # Gemini AI assistant integration & conversation thread
├── auth/                       # JWT Authentication, Refresh Session rotation, Guards
├── calls/                      # WebRTC Audio/Video calling logic & WebSockets
├── cloudinary/                 # Cloudinary media storage client
├── conversations/              # Conversation room management & participant access
├── database/                   # PrismaService database client
├── guide/                      # Local guide profile & pricing management
├── guide-request/              # Guide connection request State Machine
├── locations/                  # PostGIS geospatial search & current location tracker
├── messages/                   # Real-time messaging, Idempotency & Cursor pagination
├── notifications/              # In-App WebSocket + Firebase FCM Push Notification pipeline
├── tourist/                    # Tourist profile management
├── upload/                     # File/Image/Video upload controller
└── users/                      # User entity management & RBAC roles
```

---

## ⚙️ Environment Variables (.env)

Create a `.env` file in the project root directory based on the configuration below:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1

# Database Configuration (PostgreSQL + PostGIS)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/localism?schema=public"

# JWT Authentication Secrets
JWT_ACCESS_SECRET="your-super-secret-access-key-here"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_REFRESH_EXPIRATION="7d"

# Firebase Admin SDK (FCM Push Notifications)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"

# Agora WebRTC Configuration
AGORA_APP_ID="your-agora-app-id"
AGORA_APP_CERTIFICATE="your-agora-app-certificate"

# Google Gemini AI Configuration
GEMINI_API_KEY="your-google-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
AI_MAX_HISTORY_MESSAGES=20

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: v20.x or later
- **Pnpm**: `npm install -g pnpm`
- **PostgreSQL**: v16+ (with PostGIS extension enabled)

---

### Option A: Local Development (Pnpm)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NHSon05/nestjs-boilerplate.git
   cd nestjs-boilerplate
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your local credentials
   ```

4. **Run Database Migrations & Prisma Generate**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start the Development Server**:
   ```bash
   pnpm run start:dev
   ```

6. **Access Swagger API Documentation**:
   Open browser at: `http://localhost:3000/api-docs`

---

### Option B: Docker Compose

1. **Build & Start Containers**:
   ```bash
   docker-compose up -d --build
   ```

2. **Run Migrations inside Docker**:
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

---

## 🌐 API Endpoints Summary

Base Prefix: `/api/v1`

### 🔑 Authentication (`/auth`)
- `POST /auth/register` - Register new Tourist or Guide account
- `POST /auth/login` - Authenticate & obtain Access + Refresh tokens
- `POST /auth/refresh` - Rotate refresh token & get new access token
- `POST /auth/logout` - Revoke current device refresh token
- `POST /auth/logout-all` - Revoke all active user sessions
- `GET  /auth/me` - Get current authenticated user profile

### 📍 Locations & Guide Discovery (`/locations`)
- `POST /locations/current` - Update current GPS coordinates
- `GET  /locations/guides/search` - Search guides by radius (PostGIS)

### 🤝 Guide Requests (`/guide-requests`)
- `POST  /guide-requests` - Create new connection request
- `PATCH /guide-requests/:id/accept` - Accept request (Guide)
- `PATCH /guide-requests/:id/reject` - Reject request (Guide)
- `PATCH /guide-requests/:id/cancel` - Cancel request (Tourist)

### 💬 Conversations & Messaging (`/conversations`, `/messages`)
- `GET   /conversations` - List conversations with unread counter
- `GET   /conversations/:id/messages` - Get chat history (Cursor pagination)
- `POST  /conversations/:id/messages` - Send text/media message (Idempotent)
- `PATCH /conversations/:id/read` - Mark conversation as read
- `PATCH /messages/:id` - Edit sent text message
- `DELETE /messages/:id` - Soft-delete message

### 📞 Calls (`/conversations/:id/calls`, `/calls`)
- `POST  /conversations/:id/calls` - Initiate Audio/Video call & get Agora token
- `PATCH /calls/:callId/accept` - Accept incoming call
- `PATCH /calls/:callId/reject` - Reject incoming call
- `PATCH /calls/:callId/end` - Terminate call session

### 🔔 Notifications (`/notifications`)
- `GET    /notifications` - Get notifications list & unread count
- `PATCH  /notifications/read-all` - Mark all notifications as read
- `POST   /notifications/device-token` - Register FCM device token
- `DELETE /notifications/device-token` - Unregister FCM device token

### 🤖 AI Assistant (`/ai/conversations`)
- `POST /ai/conversations` - Create new AI chat thread
- `POST /ai/conversations/:id/messages` - Send query to Gemini AI

---

## 🧪 Testing & Quality Assurance

The codebase maintains 100% type-safety and automated test coverage across services and controllers.

```bash
# 1. Validate Prisma Schema
npx prisma validate

# 2. Run TypeScript Type Check (Zero errors)
pnpm exec tsc --noEmit

# 3. Execute Unit & Integration Tests (Jest)
pnpm test

# 4. Build Production Bundle
pnpm run build
```

### Automated Test Results:
```text
PASS src/notifications/notifications.service.spec.ts
PASS src/notifications/notifications.controller.spec.ts
PASS src/notifications/firebase/firebase-admin.service.spec.ts
PASS src/guide-request/guide-requests.service.spec.ts
PASS src/messages/messages.service.spec.ts
PASS src/messages/messages.controller.spec.ts
PASS src/conversations/conversations.service.spec.ts
PASS src/conversations/conversations.controller.spec.ts
PASS src/calls/calls.service.spec.ts
PASS src/calls/calls.controller.spec.ts
PASS src/upload/uploads.service.spec.ts
PASS src/upload/uploads.controller.spec.ts
PASS src/ai-assistant/ai-assistant.service.spec.ts
PASS src/ai-assistant/ai-assistant.controller.spec.ts
PASS src/app.controller.spec.ts

Test Suites: 15 passed, 15 total
Tests:       92 passed, 92 total
Snapshots:   0 total
Time:        1.86s
```

---

## 🛡️ Security & Performance

- **Zero Snippet Guessing**: Strict parameter validation using `class-validator` and `ParseUUIDPipe`.
- **Database Idempotency**: `@@unique([senderId, clientMessageId])` constraint prevents duplicate network submissions.
- **Privacy Shielding**: Soft-deleted messages scrub content and attachments before response serialization.
- **Self-Healing Notification Tokens**: Automatic deactivation of invalid FCM tokens upon delivery failure.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
