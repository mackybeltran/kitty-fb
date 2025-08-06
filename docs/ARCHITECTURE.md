# Architecture

Complete system architecture documentation for the Kitty FB project.

## System Overview

Kitty FB is a Firebase Cloud Functions API that manages shared inventory systems for groups. It follows a **Controller-Service Pattern** with layered architecture, providing a RESTful API for bucket management, consumption tracking, and group administration.

## High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Cloud Function │    │   Firestore     │
│   (Future)      │◄──►│   (API Gateway)  │◄──►│   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Middleware     │
                       │   (Validation,   │
                       │    Error Hand.)  │
                       └──────────────────┘
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18 (Firebase Cloud Functions)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Firestore (NoSQL)
- **Validation**: Joi
- **Architecture**: Controller-Service Pattern

### Infrastructure
- **Platform**: Firebase Cloud Functions
- **Database**: Firestore
- **Authentication**: Firebase Auth (planned)
- **Hosting**: Firebase Hosting (for future frontend)

## Application Architecture

### Layered Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Controllers   │  │   Middleware    │  │   Routes     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    Services     │  │   Validators    │  │   Utilities  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Firestore     │  │   Collections   │  │   Indexes    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### Controllers
- **UserController**: User creation and profile management
- **GroupController**: Group operations and membership management
- **BucketController**: Bucket purchases and consumption tracking
- **BalanceController**: User balance management (admin operations)
- **TransactionController**: Kitty transaction tracking
- **QRCodeController**: QR code generation and processing
- **NFCController**: NFC-based consumption and user identification
- **DevController**: Development utilities and testing tools

All controllers:
- Handle HTTP requests and responses
- Validate input data
- Call appropriate services
- Format responses
- Handle errors

#### Services
- Implement business logic
- Manage data operations
- Handle complex workflows
- Maintain data consistency

#### Middleware
- Cross-cutting concerns
- Request validation
- Error handling
- Authentication (future)
- Logging

#### Utils
- Shared validation functions
- Database utilities
- Development tools
- Helper functions

## Data Model

### Firestore Collections

#### Users Collection
```typescript
interface User {
  displayName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Groups Collection
```typescript
interface Group {
  name: string;
  kittyBalance: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Group Members Subcollection
```typescript
interface GroupMember {
  userId: string;
  activeBucketId: string | null;
  balance: number; // Always negative or zero
  isAdmin: boolean;
  joinedAt: Date;
  updatedAt: Date;
}
```

#### User Groups Subcollection
```typescript
interface UserGroup {
  groupId: string;
  activeBucketId: string | null;
  balance: number; // Always negative or zero
  isAdmin: boolean;
  joinedAt: Date;
  updatedAt: Date;
}
```

#### Buckets Subcollection
```typescript
interface Bucket {
  userId: string;
  unitsInBucket: number;
  remainingUnits: number;
  status: 'active' | 'completed';
  purchasedAt: Date;
  purchaseBatchId: string;
  updatedAt: Date;
}
```

#### Consumption Subcollection
```typescript
interface Consumption {
  userId: string;
  units: number;
  bucketId: string;
  consumedAt: Date;
}
```

#### Transactions Subcollection
```typescript
interface Transaction {
  userId: string;
  amount: number;
  type: 'contribution';
  comment: string;
  createdAt: Date;
}
```

#### Join Requests Subcollection
```typescript
interface JoinRequest {
  userId: string;
  message: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: Date;
  adminUserId?: string;
  processedAt?: Date;
  reason?: string;
}
```

### Data Relationships

```
Users (1) ←→ (N) Groups (Many-to-Many)
  │                    │
  │                    │
  ▼                    ▼
UserGroups         GroupMembers
  │                    │
  │                    │
  ▼                    ▼
Buckets (1) ←→ (N) Consumption
  │
  │
  ▼
Transactions
```

### Denormalization Strategy

The system uses strategic denormalization for performance:

1. **Bidirectional Relationships**: User-Group memberships stored in both directions
2. **Active Bucket Tracking**: Current active bucket ID stored in membership records
3. **Balance Synchronization**: Balance kept in sync across both directions
4. **Audit Trails**: Consumption and transaction records for history

## Business Logic

### Core Concepts

#### Bucket System
- **Unit Agnostic**: Works with any consumable (beers, snacks, etc.)
- **Flexible Sizing**: Buckets can be any size
- **Active Bucket**: Users have one active bucket at a time
- **Auto-Switching**: When active bucket is empty, switches to next available
- **Batch Purchases**: All buckets in one purchase must be same size

#### Balance System
- **Debt Tracking**: Balances can only be negative (representing debt)
- **Admin Control**: Only admins can update balances
- **Independent**: Balance separate from bucket purchases
- **Credit System**: Tracks money owed for buckets purchased on credit

#### Admin System
- **First User Rule**: First user added becomes admin automatically
- **Single Admin**: Only one admin per group
- **Required Admin**: Every group must have an admin
- **Cross-Group**: Users can be admin of one group, member of others

#### Join Request System
- **Request-Based**: Users must request to join (no direct access)
- **Admin Approval**: Admins review and approve/deny requests
- **Duplicate Prevention**: Prevents multiple pending requests
- **Audit Trail**: Maintains history of all requests and decisions

#### QR Code System
- **Multi-Purpose**: QR codes for onboarding, consumption, or dual-purpose
- **Platform Support**: iOS, Android, and web platform detection
- **Context-Aware**: Processing determines appropriate action based on user state
- **Version Tracking**: Includes version and device information for compatibility
- **Dynamic URLs**: Platform-specific URLs for app store or web access

#### NFC System
- **Phone-Based Identification**: Uses phone numbers for user identification
- **Multiple Scenarios**: Handles direct consumption, onboarding, and join requests
- **Seamless Flow**: Automatic user lookup and profile updates
- **International Format**: Phone numbers in E.164 format (+1234567890)
- **Fallback Handling**: Graceful degradation when users not found

### Workflows

#### User Onboarding
1. User creates account
2. User requests to join group
3. Admin reviews and approves request
4. User is added to group with initial balance of 0
5. User can purchase buckets and start consuming

#### Consumption Workflow
1. User consumes unit (honor system)
2. System deducts from active bucket
3. If bucket becomes empty, mark as completed
4. Switch to next available bucket
5. If no more buckets, set activeBucketId to null

#### Balance Management
1. Admin updates user balance (adds debt or payment)
2. System validates balance stays negative
3. Updates balance in both directions of relationship
4. Records transaction for audit trail

## Security Model

### Current State (Development)
- **No Authentication**: Open access for development
- **Permissive Rules**: Firestore rules allow all operations
- **Dev Utilities**: Development endpoints enabled

### Future State (Production)
- **Firebase Auth**: User authentication required
- **Role-Based Access**: Admin vs regular user permissions
- **Restrictive Rules**: Proper Firestore security rules
- **Input Validation**: All inputs validated and sanitized

### Security Considerations

#### Data Protection
- **User Privacy**: User data isolated by group membership
- **Admin Controls**: Sensitive operations require admin privileges
- **Audit Trails**: All changes tracked for accountability

#### API Security
- **Input Validation**: All inputs validated with Joi schemas
- **Error Handling**: Secure error messages (no sensitive data)
- **Rate Limiting**: Prevent abuse (future implementation)

## Performance Considerations

### Firestore Optimization

#### Indexing Strategy
- **Composite Indexes**: For complex queries (user + status + date)
- **Single Field Indexes**: For simple lookups
- **Automatic Indexes**: Let Firestore suggest indexes

#### Query Optimization
- **Efficient Queries**: Use indexed fields in where clauses
- **Pagination**: Implement for large datasets
- **Batch Operations**: Use batch writes for multiple operations

### Function Optimization

#### Cold Start Mitigation
- **Minimal Dependencies**: Keep function size small
- **Warm Functions**: Consider keeping functions warm
- **Efficient Code**: Optimize business logic

#### Memory Management
- **Proper Cleanup**: Clean up resources after operations
- **Memory Monitoring**: Monitor function memory usage
- **Timeout Configuration**: Set appropriate timeouts

## Scalability

### Horizontal Scaling
- **Firebase Auto-Scaling**: Functions scale automatically
- **Firestore Scaling**: Database scales with usage
- **Load Distribution**: Requests distributed across instances

### Vertical Scaling
- **Memory Allocation**: Adjust function memory as needed
- **Timeout Configuration**: Set appropriate timeouts
- **Concurrency Limits**: Configure concurrent execution limits

## Monitoring and Observability

### Logging Strategy
- **Structured Logging**: JSON format for easy parsing
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Track function execution times

### Metrics to Monitor
- **Function Invocations**: Number of API calls
- **Error Rates**: Percentage of failed requests
- **Response Times**: Average and p95 response times
- **Database Operations**: Firestore read/write counts

### Alerting
- **Error Thresholds**: Alert on high error rates
- **Performance Degradation**: Alert on slow response times
- **Cost Monitoring**: Alert on unexpected costs

## Future Enhancements

### Planned Features
1. **Authentication**: Firebase Auth integration
2. **Real-time Updates**: Firestore listeners for live data
3. **Mobile App**: React Native frontend
4. **Analytics**: Usage analytics and reporting
5. **Advanced NFC Features**: Enhanced NFC capabilities and integrations

### Technical Improvements
1. **Caching**: Redis or Firestore caching layer
2. **Rate Limiting**: API rate limiting implementation
3. **Webhooks**: Event-driven architecture
4. **Microservices**: Break into smaller services
5. **GraphQL**: Alternative to REST API

## Decision Records

### ADR-001: Controller-Service Pattern
**Context**: Need for clean separation of concerns
**Decision**: Use Controller-Service pattern with layered architecture
**Consequences**: Clear separation, testable code, maintainable structure

### ADR-002: Firestore as Database
**Context**: Need for scalable, real-time database
**Decision**: Use Firestore for data storage
**Consequences**: NoSQL flexibility, real-time capabilities, Firebase integration

### ADR-003: Denormalization Strategy
**Context**: Need for fast queries and data consistency
**Decision**: Use strategic denormalization with bidirectional relationships
**Consequences**: Better performance, more complex updates, larger data size

### ADR-004: Unit Agnostic Design
**Context**: Need for flexibility in use cases
**Decision**: Design system to be unit-agnostic
**Consequences**: More flexible, requires careful UI language choices

## Conclusion

The Kitty FB architecture provides a solid foundation for a scalable, maintainable shared inventory management system. The Controller-Service pattern ensures clean separation of concerns, while the Firestore database provides the flexibility and real-time capabilities needed for the application.

The system is designed to be:
- **Scalable**: Can handle growth in users and groups
- **Maintainable**: Clear architecture and documentation
- **Flexible**: Unit-agnostic design for various use cases
- **Secure**: Proper validation and future authentication ready
- **Performant**: Optimized queries and efficient data structures 