# Localism

Localism is a mobile travel platform that connects tourists with trusted local people and local guides. The platform helps travelers discover authentic experiences, receive local support, communicate directly with guides, and access AI-powered travel recommendations.

The backend is built with NestJS and follows a modular monolith architecture. It is designed to support secure authentication, location-based guide discovery, connection requests, real-time messaging, reviews, notifications, and Gemini AI integration.

## Project Vision

Traditional travel platforms often focus on popular attractions and commercial tours. Localism aims to create a more personal and community-driven travel experience by connecting visitors directly with people who understand the destination, culture, food, transportation, and local lifestyle.

The platform serves three main user groups:

- **Tourists**, who want to find local guides and receive personalized support.
- **Local guides**, who want to share local knowledge and connect with travelers.
- **Administrators**, who manage users, destinations, guide verification, reports, and platform safety.

## Main User Flows

### Tourist Flow

1. Open the Localism mobile application.
2. Register or log in.
3. Allow location access or manually select a destination.
4. Browse nearby local guides.
5. Filter guides by destination, language, specialty, availability, distance, or rating.
6. View a guide's public profile.
7. Send a connection request.
8. Wait for the guide to accept or reject the request.
9. Start a conversation after the request is accepted.
10. Meet or communicate with the guide.
11. Complete the experience.
12. Submit a rating and review.

### Local Guide Flow

1. Register or log in as a local guide.
2. Create a guide profile.
3. Add supported destinations, languages, specialties, availability, and service information.
4. Receive connection requests from tourists.
5. View the tourist's permitted profile information.
6. Accept or reject a request.
7. Start a conversation after accepting the request.
8. Assist the tourist during the experience.
9. Mark the request as completed.
10. Receive a review from the tourist.

### AI Travel Assistant Flow

1. The user creates or opens an AI conversation.
2. The user asks a travel-related question.
3. The Localism backend validates the request and applies rate limits.
4. The backend builds a safe travel context.
5. The request is sent to Gemini AI.
6. The response is stored in the conversation history.
7. The mobile application displays the AI response, optionally using streaming.

## Core Features

### Authentication and Account Management

- User registration and login
- JWT access tokens
- Refresh-token rotation
- Logout from one or all devices
- Password reset
- Email or phone verification
- Tourist, guide, and administrator roles
- Account suspension and soft deletion

### Tourist Profiles

- Full name and avatar
- Nationality
- Biography
- Spoken languages
- Travel interests
- Public profile visibility controls

### Local Guide Profiles

- Biography and introduction
- Spoken languages
- Local specialties
- Supported destinations
- Years of experience
- Availability status
- Optional pricing information
- Verification status
- Average rating and review count

### Guide Discovery

Tourists can discover guides by:

- Current GPS location
- Manually selected destination
- Distance
- Language
- Specialty
- Availability
- Minimum rating
- Response rate
- Number of completed experiences

The ranking system should combine multiple signals instead of relying only on distance or ratings. This gives new guides a fair opportunity to appear in search results.

### Connection Requests

A tourist can send a request to a selected guide. Each request follows a controlled state machine:

```text
PENDING
├── ACCEPTED
├── REJECTED
├── CANCELLED
└── EXPIRED

ACCEPTED
├── IN_PROGRESS
└── CANCELLED

IN_PROGRESS
├── COMPLETED
└── CANCELLED
```

The mobile client cannot update the request status freely. Each transition is handled through a dedicated business endpoint such as:

```http
PATCH /api/v1/guide-requests/:id/accept
PATCH /api/v1/guide-requests/:id/reject
PATCH /api/v1/guide-requests/:id/cancel
PATCH /api/v1/guide-requests/:id/start
PATCH /api/v1/guide-requests/:id/complete
```

Database transactions and conditional updates are used to prevent duplicate acceptance and race conditions.

### Real-Time Messaging

A private conversation is created only after a guide accepts a request.

Messaging features include:

- WebSocket authentication
- Private conversation rooms
- Text messages
- Images and attachments
- Location messages
- Typing indicators
- Delivery acknowledgements
- Read receipts
- Online presence
- Cursor-based message pagination
- Push notifications for offline users

Messages are stored in the database before they are emitted through WebSocket to avoid temporary messages disappearing after a reload.

### Ratings and Reviews

Tourists can review guides after a completed experience.

Review rules include:

- The request must have the `COMPLETED` status.
- The reviewer must belong to the request.
- A user cannot review themselves.
- A reviewer can submit only one review per request.
- Ratings must be between 1 and 5.
- Guide rating summaries may be updated asynchronously.

The data model can later support two-way reviews between tourists and guides.

### Location and Destination Management

Localism supports both automatic GPS location and manual destination selection.

#### Default Location Behavior

- The application may request the user's location when the home screen opens.
- The user can refuse permission and select a destination manually.
- Location updates should be infrequent during guide discovery to protect battery life and privacy.
- A new search location may be sent when the user moves a significant distance or manually refreshes the screen.

#### Optional Real-Time Location Sharing

Real-time tracking is not enabled for all users by default.

It may be enabled only when:

- A guide request has been accepted.
- The experience is active.
- Both users consent to location sharing.
- The location-sharing session has not expired.

Temporary real-time location data should be stored in Redis with a short expiration time instead of being permanently written to PostgreSQL.

Before a request is accepted, the application should show only approximate information such as:

```text
Approximately 2 km away
Available in Hai Chau District
Usually responds within 5 minutes
```

Exact coordinates, home addresses, and real-time positions must remain private.

### Notifications

The platform can send notifications for:

- New guide requests
- Accepted or rejected requests
- New messages
- Upcoming experiences
- Completed experiences
- New reviews
- Verification updates
- Account or safety notices

Notifications should be processed asynchronously through a queue so that failures from external notification providers do not block the main API request.

### Gemini AI Travel Assistant

The Gemini-powered assistant can help users with:

- Destination suggestions
- Travel itinerary ideas
- Local culture and etiquette
- Food recommendations
- Transportation guidance
- Packing suggestions
- Travel planning
- Budget-based recommendations
- Family, nature, history, or adventure activities

The backend acts as an orchestration layer between the user and Gemini. It is responsible for:

- Authentication
- Rate limiting
- Prompt construction
- Conversation context
- Destination context
- Input validation
- Privacy protection
- Response storage
- Error handling
- Streaming support

Sensitive data such as passwords, access tokens, exact private locations, personal phone numbers, and private guide information must never be sent to the AI provider.

## System Architecture

Localism starts as a modular monolith because this architecture is suitable for an MVP and a small development team.

```text
Mobile Application
        |
        | REST API / WebSocket / SSE
        v
Load Balancer or Reverse Proxy
        |
        v
NestJS Modular Monolith
        |
        ├── PostgreSQL
        ├── Redis
        ├── Object Storage
        ├── Background Workers
        ├── Firebase Cloud Messaging
        └── Gemini API
```

The application remains logically divided into independent business modules so that selected components can later be extracted into microservices.

Recommended extraction order when the platform grows:

1. Notification worker
2. AI service
3. Chat service
4. Matching service

## Technology Stack

### Backend

- Node.js
- TypeScript
- NestJS
- Express adapter initially
- PostgreSQL
- TypeORM
- Redis
- Socket.IO
- BullMQ or another Redis-based queue
- JWT and Passport
- class-validator
- Swagger/OpenAPI
- Gemini API
- Firebase Cloud Messaging
- Docker
- Jest and Supertest

### Mobile Application

The backend can support either:

- Flutter
- React Native

### Storage

User-uploaded files should be stored in an object storage service such as:

- Amazon S3
- Cloudinary
- Supabase Storage
- Another S3-compatible service

File binaries should not be stored directly in PostgreSQL.

## Backend Modules

```text
src/
├── main.ts
├── app.module.ts
│
├── config/
│   ├── app.config.ts
│   ├── auth.config.ts
│   ├── database.config.ts
│   ├── redis.config.ts
│   ├── storage.config.ts
│   └── gemini.config.ts
│
├── common/
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── events/
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
│
├── infrastructure/
│   ├── database/
│   ├── redis/
│   ├── queue/
│   ├── storage/
│   ├── firebase/
│   └── gemini/
│
└── modules/
    ├── auth/
    ├── users/
    ├── tourist-profiles/
    ├── guide-profiles/
    ├── destinations/
    ├── guide-search/
    ├── guide-requests/
    ├── conversations/
    ├── messages/
    ├── reviews/
    ├── locations/
    ├── notifications/
    ├── devices/
    ├── ai-assistant/
    ├── reports/
    ├── admin/
    └── health/
```

## Main Data Entities

The initial database includes the following entities:

- `users`
- `user_roles`
- `tourist_profiles`
- `guide_profiles`
- `destinations`
- `guide_service_areas`
- `guide_requests`
- `conversations`
- `messages`
- `reviews`
- `device_tokens`
- `notifications`
- `ai_sessions`
- `ai_messages`
- `location_sharing_sessions`

PostgreSQL with PostGIS can be introduced for radius-based and distance-based guide searches.

## API Overview

All APIs use the following base prefix:

```text
/api/v1
```

### Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me
```

### User Profiles

```http
GET   /api/v1/users/me
PATCH /api/v1/users/me
GET   /api/v1/users/:id/public
```

### Guide Discovery

```http
GET /api/v1/guides
GET /api/v1/guides/:guideId
GET /api/v1/guides/:guideId/reviews
GET /api/v1/guides/nearby
```

### Guide Requests

```http
POST  /api/v1/guide-requests
GET   /api/v1/guide-requests
GET   /api/v1/guide-requests/:requestId
PATCH /api/v1/guide-requests/:requestId/accept
PATCH /api/v1/guide-requests/:requestId/reject
PATCH /api/v1/guide-requests/:requestId/cancel
PATCH /api/v1/guide-requests/:requestId/start
PATCH /api/v1/guide-requests/:requestId/complete
```

### Conversations and Messages

```http
GET   /api/v1/conversations
GET   /api/v1/conversations/:conversationId
GET   /api/v1/conversations/:conversationId/messages
POST  /api/v1/conversations/:conversationId/messages
PATCH /api/v1/conversations/:conversationId/read
```

### Reviews

```http
POST   /api/v1/guide-requests/:requestId/reviews
GET    /api/v1/guide-requests/:requestId/review
PATCH  /api/v1/reviews/:reviewId
DELETE /api/v1/reviews/:reviewId
```

### AI Assistant

```http
POST   /api/v1/ai/sessions
GET    /api/v1/ai/sessions
GET    /api/v1/ai/sessions/:sessionId
DELETE /api/v1/ai/sessions/:sessionId
POST   /api/v1/ai/sessions/:sessionId/messages
GET    /api/v1/ai/sessions/:sessionId/messages
POST   /api/v1/ai/sessions/:sessionId/messages/stream
```

## Security Principles

Localism follows these security principles:

- Passwords are hashed using a secure password-hashing algorithm.
- Refresh tokens are hashed before being stored.
- Access tokens have short expiration times.
- Refresh tokens are rotated and can be revoked per device.
- DTO validation is applied globally.
- Authorization checks include both roles and resource ownership.
- Exact private locations are never publicly exposed.
- File uploads are validated by type and size.
- Rate limits are applied to sensitive endpoints.
- SQL queries are parameterized.
- Secrets are stored in environment variables.
- Sensitive fields are excluded from API responses.
- Audit logs are recorded for important administrative actions.

## Reliability and Scalability

The MVP is designed to remain simple while supporting future growth.

Important design decisions include:

- PostgreSQL transactions for request acceptance
- Unique database constraints for conversations and reviews
- Redis for caching, rate limiting, online presence, and temporary locations
- Queue-based notifications and background processing
- Cursor pagination for chat messages
- Stateless API containers
- Redis adapter for Socket.IO when multiple backend instances are deployed
- Object storage for uploaded files
- Health checks, structured logs, metrics, and error monitoring

## Development Roadmap

### Phase 1 — Core Backend

- NestJS project setup
- Configuration management
- PostgreSQL and migrations
- Swagger documentation
- User accounts
- Authentication
- Refresh-token rotation
- Tourist and guide profiles

### Phase 2 — Guide Discovery and Matching

- Destinations
- Guide service areas
- Availability
- Guide search
- GPS and manual destination selection
- Connection-request state machine
- Transaction-safe request acceptance

### Phase 3 — Communication

- Conversations
- WebSocket authentication
- Real-time messaging
- Message history
- Read receipts
- Typing indicators
- Online presence
- Push notifications

### Phase 4 — Trust and Safety

- Ratings and reviews
- Guide verification
- User reporting
- Blocking
- Moderation tools
- Administrative dashboard APIs

### Phase 5 — AI Assistant

- Gemini integration
- AI sessions
- Conversation history
- Prompt safety
- Rate limiting
- Destination-aware context
- Streaming responses
- Local travel knowledge retrieval

### Phase 6 — Production Readiness

- Redis
- Queue workers
- File uploads
- Centralized logging
- Monitoring
- Automated tests
- Docker
- CI/CD
- Backup and recovery
- Load testing
- Security review

## Testing Strategy

The project should include:

- Unit tests for business services
- Integration tests for repositories and database transactions
- End-to-end tests for authentication
- End-to-end tests for request transitions
- WebSocket tests for chat authorization
- Review eligibility tests
- AI service error-handling tests
- Load tests for guide search and messaging

## Project Goals

Localism is designed to demonstrate practical backend engineering skills, including:

- NestJS module architecture
- Dependency Injection
- REST API design
- Authentication and authorization
- Database modeling
- Transactions and concurrency control
- Location-based search
- WebSocket communication
- Redis and queues
- Third-party AI integration
- Privacy and security
- Testing
- Docker and deployment
- Scalable system design

## License

This project is currently intended for educational, portfolio, and product-development purposes. Add the appropriate license before public distribution.
