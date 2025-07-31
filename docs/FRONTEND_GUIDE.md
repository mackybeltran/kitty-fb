# Frontend Integration Guide

Complete guide for building frontend applications that integrate with the Kitty FB API.

## Overview

This guide covers everything you need to know to build a frontend application (web, mobile, or desktop) that works with the Kitty FB API. The API is designed to be frontend-agnostic, supporting any client technology.

## API Integration Basics

### Base Configuration

```typescript
// API configuration
const API_CONFIG = {
  baseUrl: 'https://api-yqyq3bmp3a-uc.a.run.app', // Production
  // baseUrl: 'http://localhost:5001/{project-id}/us-central1/api', // Local
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};
```

### TypeScript Interfaces

```typescript
// Core data types
interface User {
  id: string;
  displayName: string;
  email: string;
  createdAt: Date;
}

interface Group {
  id: string;
  name: string;
  kittyBalance: number;
  memberCount: number;
  members: GroupMember[];
  buckets: Bucket[];
  createdAt: Date;
}

interface GroupMember {
  userId: string;
  activeBucketId: string | null;
  balance: number; // Always negative or zero
  isAdmin: boolean;
  joinedAt: Date;
}

interface Bucket {
  bucketId: string;
  userId: string;
  unitsInBucket: number;
  remainingUnits: number;
  status: 'active' | 'completed';
  purchasedAt: Date;
}

interface Consumption {
  consumptionId: string;
  userId: string;
  units: number;
  bucketId: string;
  consumedAt: Date;
}

interface Transaction {
  transactionId: string;
  userId: string;
  amount: number;
  type: 'contribution';
  comment: string;
  createdAt: Date;
}

interface JoinRequest {
  requestId: string;
  userId: string;
  message: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: Date;
  adminUserId?: string;
  processedAt?: Date;
  reason?: string;
}
```

## API Client Implementation

### Basic HTTP Client

```typescript
class KittyFBClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string, timeout: number = 10000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: this.timeout,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User Management
  async createUser(displayName: string, email: string): Promise<{ userId: string }> {
    return this.request('/users/new', {
      method: 'POST',
      body: JSON.stringify({ displayName, email }),
    });
  }

  async getUser(userId: string): Promise<User> {
    return this.request(`/users/${userId}`);
  }

  // Group Management
  async createGroup(name: string): Promise<{ groupId: string }> {
    return this.request('/groups/new', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getGroup(groupId: string): Promise<Group> {
    return this.request(`/groups/${groupId}`);
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.request(`/groups/${groupId}/members`);
  }

  // Bucket Management
  async purchaseBuckets(
    groupId: string,
    userId: string,
    bucketCount: number,
    unitsPerBucket: number
  ): Promise<{ bucketIds: string[] }> {
    return this.request(`/groups/${groupId}/buckets`, {
      method: 'POST',
      body: JSON.stringify({ userId, bucketCount, unitsPerBucket }),
    });
  }

  async getUserBuckets(groupId: string, userId: string): Promise<Bucket[]> {
    return this.request(`/groups/${groupId}/members/${userId}/buckets`);
  }

  // Consumption Tracking
  async recordConsumption(
    groupId: string,
    userId: string,
    units: number
  ): Promise<{ message: string }> {
    return this.request(`/groups/${groupId}/consumption`, {
      method: 'POST',
      body: JSON.stringify({ userId, units }),
    });
  }

  async getGroupConsumption(groupId: string): Promise<Consumption[]> {
    return this.request(`/groups/${groupId}/consumption`);
  }

  // Balance Management
  async updateUserBalance(
    groupId: string,
    userId: string,
    amount: number,
    adminUserId: string
  ): Promise<{ message: string }> {
    return this.request(`/groups/${groupId}/members/${userId}/balance`, {
      method: 'PATCH',
      body: JSON.stringify({ amount, adminUserId }),
    });
  }

  // Kitty Transactions
  async createKittyTransaction(
    groupId: string,
    userId: string,
    amount: number,
    comment?: string
  ): Promise<{ transactionId: string; message: string }> {
    return this.request(`/groups/${groupId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({ userId, amount, comment }),
    });
  }

  async getGroupTransactions(groupId: string): Promise<Transaction[]> {
    return this.request(`/groups/${groupId}/transactions`);
  }

  // Join Requests
  async createJoinRequest(
    groupId: string,
    userId: string,
    message?: string
  ): Promise<{ requestId: string; message: string }> {
    return this.request(`/groups/${groupId}/join-requests`, {
      method: 'POST',
      body: JSON.stringify({ userId, message }),
    });
  }

  async getJoinRequests(groupId: string): Promise<JoinRequest[]> {
    return this.request(`/groups/${groupId}/join-requests`);
  }

  async approveJoinRequest(
    groupId: string,
    requestId: string,
    adminUserId: string,
    reason?: string
  ): Promise<{ message: string }> {
    return this.request(`/groups/${groupId}/join-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ adminUserId, reason }),
    });
  }

  async denyJoinRequest(
    groupId: string,
    requestId: string,
    adminUserId: string,
    reason: string
  ): Promise<{ message: string }> {
    return this.request(`/groups/${groupId}/join-requests/${requestId}/deny`, {
      method: 'POST',
      body: JSON.stringify({ adminUserId, reason }),
    });
  }
}
```

## State Management

### React Context Example

```typescript
// Context for app state
interface AppState {
  currentUser: User | null;
  currentGroup: Group | null;
  userGroups: Group[];
  loading: boolean;
  error: string | null;
}

interface AppContextType extends AppState {
  login: (userId: string) => Promise<void>;
  logout: () => void;
  selectGroup: (groupId: string) => Promise<void>;
  refreshGroup: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    currentGroup: null,
    userGroups: [],
    loading: false,
    error: null,
  });

  const api = new KittyFBClient(API_CONFIG.baseUrl);

  const login = async (userId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const user = await api.getUser(userId);
      setState(prev => ({ 
        ...prev, 
        currentUser: user, 
        loading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
    }
  };

  const selectGroup = async (groupId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const group = await api.getGroup(groupId);
      setState(prev => ({ 
        ...prev, 
        currentGroup: group, 
        loading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
    }
  };

  const value = {
    ...state,
    login,
    logout: () => setState(prev => ({ ...prev, currentUser: null, currentGroup: null })),
    selectGroup,
    refreshGroup: () => state.currentGroup && selectGroup(state.currentGroup.id),
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
```

## User Experience Flows

### 1. User Onboarding Flow

```typescript
const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState<'create-user' | 'join-group' | 'complete'>('create-user');
  const [userData, setUserData] = useState({ displayName: '', email: '' });
  const [groupCode, setGroupCode] = useState('');
  const api = new KittyFBClient(API_CONFIG.baseUrl);

  const handleCreateUser = async () => {
    try {
      const { userId } = await api.createUser(userData.displayName, userData.email);
      // Store userId in local storage or state
      setStep('join-group');
    } catch (error) {
      // Handle error
    }
  };

  const handleJoinGroup = async () => {
    try {
      const { requestId } = await api.createJoinRequest(groupCode, userId, 'New user wants to join');
      setStep('complete');
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      {step === 'create-user' && (
        <UserCreationForm 
          data={userData} 
          onChange={setUserData} 
          onSubmit={handleCreateUser} 
        />
      )}
      
      {step === 'join-group' && (
        <GroupJoinForm 
          groupCode={groupCode} 
          onChange={setGroupCode} 
          onSubmit={handleJoinGroup} 
        />
      )}
      
      {step === 'complete' && (
        <OnboardingComplete />
      )}
    </div>
  );
};
```

### 2. Consumption Tracking Flow

```typescript
const ConsumptionTracker: React.FC = () => {
  const { currentGroup, currentUser } = useAppContext();
  const [consuming, setConsuming] = useState(false);
  const api = new KittyFBClient(API_CONFIG.baseUrl);

  const handleConsume = async (units: number = 1) => {
    if (!currentGroup || !currentUser) return;
    
    setConsuming(true);
    try {
      await api.recordConsumption(currentGroup.id, currentUser.id, units);
      // Refresh group data to show updated bucket status
      await refreshGroup();
    } catch (error) {
      // Handle error (e.g., no active bucket, insufficient units)
    } finally {
      setConsuming(false);
    }
  };

  const activeBucket = currentGroup?.members.find(
    m => m.userId === currentUser?.id
  )?.activeBucketId;

  return (
    <div>
      <h2>Consumption Tracker</h2>
      
      {activeBucket ? (
        <div>
          <p>Active Bucket: {activeBucket}</p>
          <button 
            onClick={() => handleConsume(1)} 
            disabled={consuming}
          >
            Consume 1 Unit
          </button>
        </div>
      ) : (
        <p>No active bucket. Purchase buckets to start consuming.</p>
      )}
    </div>
  );
};
```

### 3. Admin Management Flow

```typescript
const AdminDashboard: React.FC = () => {
  const { currentGroup, currentUser } = useAppContext();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const api = new KittyFBClient(API_CONFIG.baseUrl);

  const isAdmin = currentGroup?.members.find(
    m => m.userId === currentUser?.id
  )?.isAdmin;

  useEffect(() => {
    if (currentGroup && isAdmin) {
      loadJoinRequests();
    }
  }, [currentGroup]);

  const loadJoinRequests = async () => {
    if (!currentGroup) return;
    
    try {
      const requests = await api.getJoinRequests(currentGroup.id);
      setJoinRequests(requests);
    } catch (error) {
      // Handle error
    }
  };

  const handleApproveRequest = async (requestId: string, reason?: string) => {
    if (!currentGroup || !currentUser) return;
    
    try {
      await api.approveJoinRequest(currentGroup.id, requestId, currentUser.id, reason);
      await loadJoinRequests();
      await refreshGroup(); // Refresh to show new member
    } catch (error) {
      // Handle error
    }
  };

  if (!isAdmin) {
    return <p>Admin access required.</p>;
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      
      <section>
        <h3>Join Requests ({joinRequests.length})</h3>
        {joinRequests.map(request => (
          <JoinRequestCard
            key={request.requestId}
            request={request}
            onApprove={handleApproveRequest}
          />
        ))}
      </section>
      
      <section>
        <h3>Group Management</h3>
        <BalanceManager groupId={currentGroup.id} />
        <KittyTransactionManager groupId={currentGroup.id} />
      </section>
    </div>
  );
};
```

## Error Handling

### Error Types and Handling

```typescript
interface APIError {
  error: string;
  status: number;
  details?: any;
}

class APIErrorHandler {
  static handle(error: any): string {
    if (error.status === 400) {
      return this.handleValidationError(error);
    } else if (error.status === 404) {
      return this.handleNotFoundError(error);
    } else if (error.status === 409) {
      return this.handleConflictError(error);
    } else {
      return 'An unexpected error occurred. Please try again.';
    }
  }

  private static handleValidationError(error: APIError): string {
    const errorMessages: Record<string, string> = {
      'User has no active bucket': 'You need to purchase buckets before consuming units.',
      'Insufficient units in active bucket': 'Your current bucket is empty. Please purchase more buckets.',
      'User balance cannot be positive': 'Balance can only track debt. Use positive amounts for payments.',
      'Group already has an admin': 'This group already has an admin.',
    };

    return errorMessages[error.error] || error.error;
  }

  private static handleNotFoundError(error: APIError): string {
    return 'The requested resource was not found.';
  }

  private static handleConflictError(error: APIError): string {
    if (error.error.includes('already a member')) {
      return 'You are already a member of this group.';
    }
    return error.error;
  }
}
```

## Real-time Updates

### Polling Strategy

```typescript
const useRealtimeData = <T>(
  fetchFunction: () => Promise<T>,
  interval: number = 5000
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const result = await fetchFunction();
        if (mounted) {
          setData(result);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, interval);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [fetchFunction, interval]);

  return { data, loading };
};
```

## Mobile-Specific Considerations

### React Native Implementation

```typescript
// React Native API client
class ReactNativeKittyFBClient extends KittyFBClient {
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  // Override for React Native fetch
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      return await response.json();
    } catch (error) {
      // Handle network errors specifically for mobile
      if (error.message.includes('Network request failed')) {
        throw new Error('No internet connection. Please check your network.');
      }
      throw error;
    }
  }
}
```

### NFC Integration (Future)

```typescript
// NFC consumption tracking
const useNFCConsumption = () => {
  const { currentGroup, currentUser } = useAppContext();
  const api = new KittyFBClient(API_CONFIG.baseUrl);

  const handleNFCTap = async (nfcData: string) => {
    // Parse NFC data to get group ID and consumption endpoint
    const { groupId } = parseNFCData(nfcData);
    
    if (groupId === currentGroup?.id && currentUser) {
      try {
        await api.recordConsumption(groupId, currentUser.id, 1);
        // Show success feedback (haptic, sound, etc.)
      } catch (error) {
        // Show error feedback
      }
    }
  };

  return { handleNFCTap };
};
```

## Testing

### API Mocking

```typescript
// Mock API for testing
export const createMockAPI = () => ({
  createUser: jest.fn().mockResolvedValue({ userId: 'mock-user-id' }),
  getGroup: jest.fn().mockResolvedValue({
    id: 'mock-group-id',
    name: 'Mock Group',
    kittyBalance: 0,
    memberCount: 1,
    members: [],
    buckets: [],
  }),
  recordConsumption: jest.fn().mockResolvedValue({ message: 'Success' }),
  // ... other methods
});

// Test component
const renderWithMockAPI = (component: React.ReactElement) => {
  const mockAPI = createMockAPI();
  return render(
    <AppProvider api={mockAPI}>
      {component}
    </AppProvider>
  );
};
```

## Performance Optimization

### Caching Strategy

```typescript
class CachedKittyFBClient extends KittyFBClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getGroup(groupId: string): Promise<Group> {
    const cacheKey = `group:${groupId}`;
    const cached = this.getCached<Group>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const data = await super.getGroup(groupId);
    this.setCached(cacheKey, data);
    return data;
  }
}
```

## Deployment Considerations

### Environment Configuration

```typescript
// Environment-specific configuration
const getAPIConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      baseUrl: 'http://localhost:5001/{project-id}/us-central1/api',
      timeout: 30000, // Longer timeout for development
    };
  }
  
  return {
    baseUrl: 'https://api-yqyq3bmp3a-uc.a.run.app',
    timeout: 10000,
  };
};
```

### Build Configuration

```json
// package.json scripts
{
  "scripts": {
    "build:dev": "REACT_APP_API_URL=http://localhost:5001/{project-id}/us-central1/api npm run build",
    "build:prod": "REACT_APP_API_URL=https://api-yqyq3bmp3a-uc.a.run.app npm run build"
  }
}
```

## Conclusion

This guide provides a comprehensive foundation for building frontend applications that integrate with the Kitty FB API. The modular approach allows for easy adaptation to different frontend frameworks and requirements.

Key takeaways:
- **Type Safety**: Use TypeScript interfaces for all API interactions
- **Error Handling**: Implement comprehensive error handling for better UX
- **State Management**: Use appropriate state management for your framework
- **Real-time Updates**: Implement polling or real-time updates for live data
- **Testing**: Mock API calls for reliable testing
- **Performance**: Implement caching and optimization strategies

For specific framework implementations or additional guidance, refer to the framework-specific documentation or create an issue in the project repository. 