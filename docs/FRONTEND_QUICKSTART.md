# Frontend Quick Start Guide

A simple guide to get your frontend up and running with the Kitty FB backend.

## 🚀 Quick Setup

### 1. Prepare Your Backend
```bash
# Ensure your dev database is accessible
# Your backend should be deployed to your dev environment
```

### 2. Seed the Database
```bash
# In another terminal, seed with test data
cd functions
npm run seed
```

### 3. Create Your Frontend Project
```bash
# Create a new frontend directory (separate from backend)
mkdir ../your-frontend-project
cd ../your-frontend-project

# Initialize with your preferred framework
# For React + Vite:
npm create vite@latest . -- --template react-ts

# For Next.js:
npx create-next-app@latest . --typescript --tailwind --eslint

# For Vue:
npm create vue@latest .

# Install dependencies
npm install
```

### 4. Configure API Connection

First, create a `.env` file in your frontend project:
```bash
# .env
VITE_API_BASE_URL=https://api-yqyq3bmp3a-uc.a.run.app
```

**Important**: Make sure `.env` is in your `.gitignore` to avoid committing sensitive URLs.

Then create a simple API client:

```typescript
// src/services/api.ts
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'https://api-yqyq3bmp3a-uc.a.run.app';

export class KittyFBClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // User Management
  async createUser(displayName: string, email: string) {
    return this.request('/users/new', {
      method: 'POST',
      body: JSON.stringify({ displayName, email }),
    });
  }

  async getUser(userId: string) {
    return this.request(`/users/${userId}`);
  }

  // Group Management
  async createGroup(name: string) {
    return this.request('/groups/new', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getGroup(groupId: string) {
    return this.request(`/groups/${groupId}`);
  }

  async getGroupMembers(groupId: string) {
    return this.request(`/groups/${groupId}/members`);
  }

  // Bucket Management
  async purchaseBuckets(groupId: string, userId: string, bucketCount: number, unitsPerBucket: number) {
    return this.request(`/groups/${groupId}/buckets`, {
      method: 'POST',
      body: JSON.stringify({ userId, bucketCount, unitsPerBucket }),
    });
  }

  // Consumption Tracking
  async recordConsumption(groupId: string, userId: string, units: number) {
    return this.request(`/groups/${groupId}/consumption`, {
      method: 'POST',
      body: JSON.stringify({ userId, units }),
    });
  }
}

export const api = new KittyFBClient();
```

### 5. Create Basic Types
```typescript
// src/types/api.ts
export interface User {
  id: string;
  displayName: string;
  email: string;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  kittyBalance: number;
  memberCount: number;
  members: GroupMember[];
  buckets: Bucket[];
  createdAt: Date;
}

export interface GroupMember {
  userId: string;
  activeBucketId: string | null;
  balance: number;
  isAdmin: boolean;
  joinedAt: Date;
}

export interface Bucket {
  bucketId: string;
  userId: string;
  unitsInBucket: number;
  remainingUnits: number;
  status: 'active' | 'completed';
  purchasedAt: Date;
}
```

### 6. Test Your Connection
```typescript
// src/App.tsx (or your main component)
import { useState, useEffect } from 'react';
import { api } from './services/api';
import type { Group } from './types/api';

function App() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test with a group ID from your seeded data
    const testGroupId = 'your-group-id-from-seeding';
    
    api.getGroup(testGroupId)
      .then(group => {
        console.log('Group data:', group);
        setGroups([group]);
      })
      .catch(error => {
        console.error('API Error:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Kitty FB Frontend</h1>
      {groups.map(group => (
        <div key={group.id}>
          <h2>{group.name}</h2>
          <p>Members: {group.memberCount}</p>
          <p>Kitty Balance: ${group.kittyBalance}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
```

### 7. Start Development
```bash
npm run dev
```

## 🎯 Next Steps

1. **Get Group IDs**: After seeding, check the console output for group IDs to use in your tests
2. **Build Core Features**: Start with user management, then group management, then consumption tracking
3. **Add State Management**: Use React Context, Redux, or Zustand for app state
4. **Style Your App**: Add CSS framework like Tailwind, Material-UI, or styled-components

## 🔧 Troubleshooting

### API Connection Issues
- Verify your dev database is accessible
- Check the API URL matches your project ID
- Ensure the database is seeded with test data

### CORS Issues
- Your dev environment should handle CORS properly
- If you get CORS errors, check that you're using the correct API URL

### TypeScript Errors
- Make sure your types match the API responses
- Check the API documentation in `docs/API.md` for exact response formats

## 📚 Resources

- **API Documentation**: `docs/API.md` - Complete API reference
- **Frontend Guide**: `docs/FRONTEND_GUIDE.md` - Detailed integration guide
- **Database Seeding**: `scripts/README.md` - How to manage test data

## 🎉 You're Ready!

Your frontend is now connected to the Kitty FB backend with test data. Start building your UI and testing the API endpoints! 