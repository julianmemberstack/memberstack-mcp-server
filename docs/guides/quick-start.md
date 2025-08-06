# Memberstack Quick Start Guide

**PURPOSE:** Get up and running with Memberstack in minutes  
**AUDIENCE:** Developers new to Memberstack or Claude Code  
**SCOPE:** Essential setup steps and basic implementation

## Table of Contents
- [Choose Your Memberstack API](#choose-your-memberstack-api)
- [Frontend Setup (DOM Package)](#frontend-setup-dom-package)
- [Backend Setup (Admin API)](#backend-setup-admin-api)
- [REST API Setup](#rest-api-setup)
- [First Implementation](#first-implementation)
- [Testing Your Setup](#testing-your-setup)
- [Next Steps](#next-steps)

## Choose Your Memberstack API

Before you start, determine which Memberstack API(s) you need:

```javascript
// DECISION TREE: Which API should I use?

/*
Frontend user authentication & management?
├─ YES → Use DOM Package (@memberstack/dom)
│  ├─ User login/signup forms
│  ├─ Profile management
│  ├─ Plan purchases
│  └─ Session management
│
Server-side member management?
├─ YES → Use Admin Package (@memberstack/admin) OR REST API
│  ├─ Admin dashboards
│  ├─ Bulk operations
│  ├─ Webhook processing
│  └─ Backend integrations
│
Non-Node.js backend?
├─ YES → Use REST API (HTTP requests)
│  ├─ Python/PHP/Ruby backends
│  ├─ Mobile app backends
│  └─ Microservices
│
All of the above?
└─ Use combination of DOM + Admin/REST
*/
```

**Most Common Setup:** DOM Package for frontend + Admin Package for backend

## Frontend Setup (DOM Package)

### Step 1: Install the Package

```bash
# Install via npm
npm install @memberstack/dom

# OR install via yarn
yarn add @memberstack/dom
```

### Step 2: Get Your Public Key

1. Go to your [Memberstack Dashboard](https://app.memberstack.com)
2. Navigate to Settings → API Keys
3. Copy your **Public Key** (starts with `pk_sb_` for test mode)

### Step 3: Initialize Memberstack

```javascript
// src/memberstack.js
import memberstackDOM from '@memberstack/dom';

// Initialize Memberstack
const memberstack = memberstackDOM.init({
  publicKey: 'pk_sb_your_public_key_here', // REQUIRED
  useCookies: true,                         // Recommended for cross-tab sync
  sessionDurationDays: 7                    // Session length (default: 7 days)
});

export default memberstack;
```

### Step 4: Create Your First Auth Component

#### React Example

```javascript
// components/LoginForm.jsx
import { useState } from 'react';
import memberstack from '../memberstack';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await memberstack.loginMemberEmailPassword({
        email,
        password
      });
      
      console.log('Login successful:', result.data.member);
      // Redirect to dashboard
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Login failed:', error);
      
      // Handle specific errors
      if (error.code === 'invalid_credentials') {
        setError('Invalid email or password');
      } else if (error.code === 'email_not_verified') {
        setError('Please verify your email first');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="login-form">
      <h2>Sign In</h2>
      
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      
      <p>
        Don't have an account? <a href="/signup">Sign up</a>
      </p>
    </form>
  );
}
```

#### Vanilla JavaScript Example

```javascript
// login.js
import memberstack from './memberstack.js';

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error');
  const submitBtn = document.getElementById('submit-btn');
  
  // Clear previous errors
  errorDiv.textContent = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';
  
  try {
    const result = await memberstack.loginMemberEmailPassword({
      email,
      password
    });
    
    console.log('Login successful:', result.data.member);
    window.location.href = '/dashboard';
    
  } catch (error) {
    console.error('Login failed:', error);
    
    if (error.code === 'invalid_credentials') {
      errorDiv.textContent = 'Invalid email or password';
    } else {
      errorDiv.textContent = 'Login failed. Please try again.';
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
});
```

### Step 5: Add Authentication State Management

```javascript
// hooks/useAuth.js (React)
import { useState, useEffect } from 'react';
import memberstack from '../memberstack';

export function useAuth() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current member
    memberstack.getCurrentMember()
      .then(({ data }) => {
        setMember(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Listen for auth changes
    const listener = memberstack.onAuthChange((newMember) => {
      setMember(newMember);
    });

    // Cleanup
    return () => listener.unsubscribe();
  }, []);

  const logout = async () => {
    await memberstack.logout();
  };

  return {
    member,
    loading,
    isAuthenticated: !!member,
    logout
  };
}

// Usage in component:
function Dashboard() {
  const { member, loading, isAuthenticated, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      <h1>Welcome, {member.customFields?.firstName || member.auth.email}!</h1>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

## Backend Setup (Admin API)

### Step 1: Install the Admin Package

```bash
npm install @memberstack/admin
```

### Step 2: Get Your Secret Key

1. Go to your Memberstack Dashboard
2. Navigate to Settings → API Keys
3. Copy your **Secret Key** (starts with `sk_sb_` for test mode)
4. **NEVER expose this in client-side code**

### Step 3: Initialize Admin Client

```javascript
// lib/memberstack-admin.js
import MemberstackAdmin from '@memberstack/admin';

// Initialize admin client (server-side only!)
const memberstackAdmin = MemberstackAdmin.init({
  secretKey: process.env.MEMBERSTACK_SECRET_KEY // REQUIRED
});

export default memberstackAdmin;
```

### Step 4: Environment Variables

```bash
# .env.local (Next.js) or .env (Node.js)
MEMBERSTACK_SECRET_KEY=sk_sb_your_secret_key_here

# For webhooks (optional)
MEMBERSTACK_WEBHOOK_SECRET=your_webhook_secret_here
```

### Step 5: Create Admin Operations

```javascript
// api/members.js (Next.js API route example)
import memberstackAdmin from '../../lib/memberstack-admin';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get list of members
      const { data } = await memberstackAdmin.getMembers({
        limit: 25,
        offset: 0
      });
      
      res.status(200).json({
        members: data.members,
        total: data.total,
        hasMore: data.hasMore
      });
      
    } catch (error) {
      console.error('Failed to get members:', error);
      res.status(500).json({ error: 'Failed to get members' });
    }
  } else if (req.method === 'POST') {
    try {
      // Create new member
      const { email, password, customFields } = req.body;
      
      const { data } = await memberstackAdmin.createMember({
        email,
        password,
        customFields,
        verified: true // Skip email verification
      });
      
      res.status(201).json({ member: data });
      
    } catch (error) {
      console.error('Failed to create member:', error);
      
      if (error.code === 'email_already_exists') {
        res.status(409).json({ error: 'Email already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create member' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  }
}
```

## REST API Setup

### Step 1: Create API Client

```javascript
// lib/memberstack-rest.js
class MemberstackREST {
  constructor(secretKey) {
    this.baseURL = 'https://api.memberstack.com/v1';
    this.secretKey = secretKey;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || response.statusText);
    }

    return response.status === 204 ? null : response.json();
  }

  async getMembers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/members${query ? `?${query}` : ''}`;
    return this.request(endpoint);
  }

  async createMember(memberData) {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(memberData)
    });
  }

  async updateMember(memberId, updates) {
    return this.request(`/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }
}

export default new MemberstackREST(process.env.MEMBERSTACK_SECRET_KEY);
```

### Step 2: Use REST Client

```javascript
// Example usage
import memberstackREST from './lib/memberstack-rest';

async function manageMember() {
  try {
    // Get all members
    const { data } = await memberstackREST.getMembers({
      limit: 50,
      verified: true
    });
    
    console.log(`Found ${data.members.length} verified members`);
    
    // Create new member
    const newMember = await memberstackREST.createMember({
      email: 'user@example.com',
      password: 'securePassword123',
      custom_fields: {
        first_name: 'John',
        last_name: 'Doe'
      }
    });
    
    console.log('Member created:', newMember.data);
    
  } catch (error) {
    console.error('API error:', error.message);
  }
}
```

## First Implementation

Let's build a complete authentication flow in 10 minutes:

### Step 1: Create Basic Pages

```javascript
// pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import memberstack from '../lib/memberstack';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await memberstack.loginMemberEmailPassword(formData);
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Sign In</h1>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### Step 2: Create Protected Route

```javascript
// components/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import memberstack from '../lib/memberstack';

export default function ProtectedRoute({ children }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await memberstack.getCurrentMember();
      if (data) {
        setMember(data);
      } else {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!member) return null;

  return children;
}
```

### Step 3: Create Dashboard

```javascript
// pages/dashboard.js
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { member, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div>
        <h1>Dashboard</h1>
        <p>Welcome, {member?.auth.email}!</p>
        
        <div>
          <h2>Your Plans</h2>
          {member?.planConnections?.length > 0 ? (
            <ul>
              {member.planConnections.map(plan => (
                <li key={plan.id}>
                  Plan: {plan.planId} (Status: {plan.active ? 'Active' : 'Inactive'})
                </li>
              ))}
            </ul>
          ) : (
            <p>No plans assigned</p>
          )}
        </div>
        
        <button onClick={logout}>Sign Out</button>
      </div>
    </ProtectedRoute>
  );
}
```

## Testing Your Setup

### Step 1: Test Authentication

```javascript
// test-auth.js
import memberstack from './lib/memberstack';

async function testAuth() {
  try {
    console.log('Testing Memberstack authentication...');
    
    // Test signup
    const signupResult = await memberstack.signupMemberEmailPassword({
      email: 'test@example.com',
      password: 'TestPassword123!',
      customFields: {
        firstName: 'Test',
        lastName: 'User'
      }
    });
    
    console.log('✅ Signup successful:', signupResult.data.member.auth.email);
    
    // Test logout
    await memberstack.logout();
    console.log('✅ Logout successful');
    
    // Test login
    const loginResult = await memberstack.loginMemberEmailPassword({
      email: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    console.log('✅ Login successful:', loginResult.data.member.auth.email);
    
    // Test get current member
    const { data: currentMember } = await memberstack.getCurrentMember();
    console.log('✅ Current member:', currentMember.auth.email);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testAuth();
```

### Step 2: Test Admin Operations (Server-side)

```javascript
// test-admin.js
import memberstackAdmin from './lib/memberstack-admin';

async function testAdmin() {
  try {
    console.log('Testing Memberstack Admin API...');
    
    // Get members
    const { data } = await memberstackAdmin.getMembers({ limit: 5 });
    console.log(`✅ Found ${data.total} members`);
    
    // Create test member
    const newMember = await memberstackAdmin.createMember({
      email: 'admin-test@example.com',
      password: 'AdminTest123!',
      customFields: {
        firstName: 'Admin',
        lastName: 'Test'
      },
      verified: true
    });
    
    console.log('✅ Created member:', newMember.data.auth.email);
    
    // Update member
    const updatedMember = await memberstackAdmin.updateMember({
      memberId: newMember.data.id,
      customFields: {
        firstName: 'Updated',
        lastName: 'Name'
      }
    });
    
    console.log('✅ Updated member:', updatedMember.data.customFields);
    
  } catch (error) {
    console.error('❌ Admin test failed:', error.message);
  }
}

// Run test (server-side only)
testAdmin();
```

### Step 3: Check Your Setup

✅ **Frontend Checklist:**
- [ ] DOM package installed
- [ ] Public key configured
- [ ] Memberstack initialized
- [ ] Login form working
- [ ] Authentication state managed
- [ ] Protected routes implemented

✅ **Backend Checklist:**
- [ ] Admin package or REST client setup
- [ ] Secret key configured (environment variable)
- [ ] Admin operations working
- [ ] Error handling implemented

## Next Steps

### 1. Enhanced Authentication

```javascript
// Add social login
await memberstack.signupWithProvider({
  provider: 'google',
  plans: [{ planId: 'pln_free' }]
});

// Add passwordless login
await memberstack.sendMemberLoginPasswordlessEmail({
  email: 'user@example.com'
});
```

### 2. Plan Management

```javascript
// Add free plan
await memberstack.addPlan({
  planId: 'pln_free'
});

// Start paid subscription
await memberstack.purchasePlansWithCheckout({
  priceId: 'prc_premium_monthly',
  successUrl: '/success',
  cancelUrl: '/cancel'
});
```

### 3. User Profile Management

```javascript
// Update profile
await memberstack.updateMember({
  customFields: {
    firstName: 'Updated',
    company: 'New Company'
  }
});

// Store complex data
await memberstack.updateMemberJSON({
  json: {
    preferences: { theme: 'dark' },
    settings: { notifications: true }
  }
});
```

### 4. Error Handling

```javascript
// Comprehensive error handling
try {
  const result = await memberstack.loginMemberEmailPassword({
    email, password
  });
} catch (error) {
  switch (error.code) {
    case 'invalid_credentials':
      setError('Wrong email or password');
      break;
    case 'email_not_verified':
      setError('Please verify your email first');
      setShowResendButton(true);
      break;
    case 'too_many_requests':
      setError('Too many attempts. Please wait.');
      break;
    default:
      setError('Login failed. Please try again.');
  }
}
```

### 5. Advanced Features

- **Pre-built UI:** Use `memberstack.openModal('LOGIN')` for instant auth UI
- **Webhooks:** Handle member events for real-time updates
- **Custom Fields:** Store and manage user data
- **Plan-based Access:** Control feature access by subscription
- **Session Management:** Configure session duration and persistence

### 6. Production Checklist

- [ ] Switch to live mode keys (remove `_sb_` from keys)
- [ ] Set up proper error monitoring
- [ ] Implement rate limiting protection
- [ ] Add security headers
- [ ] Set up webhook endpoints
- [ ] Test all authentication flows
- [ ] Configure proper redirects
- [ ] Set up monitoring and analytics

## Resources

### Documentation Links
- [DOM Package Reference](./dom-package/dom-api-reference.md)
- [Admin API Reference](./admin-package/admin-api-reference.md)
- [REST API Reference](./rest-api/rest-api-reference.md)
- [Authentication Flows](./authentication-flows.md)
- [Error Handling Guide](./error-handling-guide.md)

### Example Projects
- [React + Memberstack Example](https://github.com/memberstack/examples/react)
- [Next.js + Memberstack Example](https://github.com/memberstack/examples/nextjs)
- [Vue + Memberstack Example](https://github.com/memberstack/examples/vue)

### Support
- [Memberstack Documentation](https://docs.memberstack.com)
- [Community Discord](https://discord.gg/memberstack)
- [Support Email](mailto:support@memberstack.com)

**Congratulations!** 🎉 You now have a complete Memberstack setup. Start building amazing authenticated experiences!