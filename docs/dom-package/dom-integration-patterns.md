# Memberstack DOM Package - Integration Patterns

**PACKAGE:** @memberstack/dom  
**PURPOSE:** Real-world implementation patterns for common scenarios

## Table of Contents
- [React Integration Patterns](#react-integration-patterns)
- [Vue Integration Patterns](#vue-integration-patterns)
- [Next.js Integration Patterns](#nextjs-integration-patterns)
- [SvelteKit Integration Patterns](#sveltekit-integration-patterns)
- [Authentication Flow Patterns](#authentication-flow-patterns)
- [State Management Patterns](#state-management-patterns)
- [Testing Patterns](#testing-patterns)
- [Performance Optimization Patterns](#performance-optimization-patterns)
- [Security Best Practices](#security-best-practices)

## React Integration Patterns

### React Context Provider Pattern

```javascript
// MemberstackProvider.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import memberstackDOM from '@memberstack/dom';

const MemberstackContext = createContext(null);

export const MemberstackProvider = ({ children, publicKey }) => {
  const [memberstack, setMemberstack] = useState(null);
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Memberstack
    const ms = memberstackDOM.init({
      publicKey,
      useCookies: true,
      sessionDurationDays: 30
    });
    setMemberstack(ms);

    // Get current member
    ms.getCurrentMember()
      .then(({ data }) => {
        setMember(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });

    // Listen for auth changes
    const listener = ms.onAuthChange((newMember) => {
      setMember(newMember);
    });

    // Cleanup
    return () => {
      listener.unsubscribe();
    };
  }, [publicKey]);

  const value = {
    memberstack,
    member,
    isLoading,
    isAuthenticated: !!member,
    // Helper methods
    login: async (email, password) => {
      try {
        const result = await memberstack.loginMemberEmailPassword({
          email,
          password
        });
        return { success: true, data: result.data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
    logout: async () => {
      await memberstack.logout();
    },
    updateProfile: async (customFields) => {
      const result = await memberstack.updateMember({ customFields });
      return result.data;
    }
  };

  return (
    <MemberstackContext.Provider value={value}>
      {children}
    </MemberstackContext.Provider>
  );
};

// Custom hook
export const useMemberstack = () => {
  const context = useContext(MemberstackContext);
  if (!context) {
    throw new Error('useMemberstack must be used within MemberstackProvider');
  }
  return context;
};

// Usage in App.jsx
import { MemberstackProvider } from './MemberstackProvider';

function App() {
  return (
    <MemberstackProvider publicKey={process.env.REACT_APP_MEMBERSTACK_KEY}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </Router>
    </MemberstackProvider>
  );
}
```

### Protected Route Component

```javascript
// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useMemberstack } from './MemberstackProvider';

export const ProtectedRoute = ({ children, requiredPlanId }) => {
  const { isAuthenticated, member, isLoading } = useMemberstack();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for specific plan access
  if (requiredPlanId) {
    const hasPlan = member.planConnections?.some(
      conn => conn.planId === requiredPlanId && conn.active
    );
    
    if (!hasPlan) {
      return <Navigate to="/upgrade" replace />;
    }
  }

  return children;
};
```

### React Hook Form Integration

```javascript
// LoginForm.jsx
import { useForm } from 'react-hook-form';
import { useMemberstack } from './MemberstackProvider';
import { useNavigate } from 'react-router-dom';

export const LoginForm = () => {
  const { login } = useMemberstack();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      // Handle specific errors
      if (result.error.includes('Invalid credentials')) {
        setError('password', { message: 'Invalid email or password' });
      } else if (result.error.includes('not verified')) {
        setError('email', { message: 'Please verify your email first' });
      } else {
        setError('root', { message: result.error });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', { 
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email address'
          }
        })}
        type="email"
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}

      <input
        {...register('password', { required: 'Password is required' })}
        type="password"
        placeholder="Password"
      />
      {errors.password && <span>{errors.password.message}</span>}

      {errors.root && <div>{errors.root.message}</div>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

## Vue Integration Patterns

### Vue 3 Composition API

```javascript
// useMemberstack.js
import { ref, computed, onMounted, onUnmounted } from 'vue';
import memberstackDOM from '@memberstack/dom';

let memberstack = null;
const member = ref(null);
const isLoading = ref(true);
let authListener = null;

export const useMemberstack = () => {
  const isAuthenticated = computed(() => !!member.value);

  const init = (publicKey) => {
    if (!memberstack) {
      memberstack = memberstackDOM.init({
        publicKey,
        useCookies: true
      });

      // Get initial member
      memberstack.getCurrentMember()
        .then(({ data }) => {
          member.value = data;
          isLoading.value = false;
        })
        .catch(() => {
          isLoading.value = false;
        });

      // Listen for auth changes
      authListener = memberstack.onAuthChange((newMember) => {
        member.value = newMember;
      });
    }
  };

  const login = async (email, password) => {
    try {
      const result = await memberstack.loginMemberEmailPassword({
        email,
        password
      });
      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error };
    }
  };

  const logout = async () => {
    await memberstack.logout();
  };

  const signup = async (email, password, customFields = {}) => {
    try {
      const result = await memberstack.signupMemberEmailPassword({
        email,
        password,
        customFields,
        plans: [{ planId: 'pln_free' }]
      });
      return { success: true, data: result.data };
    } catch (error) {
      return { success: false, error };
    }
  };

  onUnmounted(() => {
    if (authListener) {
      authListener.unsubscribe();
    }
  });

  return {
    init,
    member,
    isLoading,
    isAuthenticated,
    login,
    logout,
    signup
  };
};

// App.vue
<template>
  <div id="app">
    <router-view v-if="!isLoading" />
    <div v-else>Loading...</div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useMemberstack } from './composables/useMemberstack';

const { init, isLoading } = useMemberstack();

onMounted(() => {
  init(import.meta.env.VITE_MEMBERSTACK_KEY);
});
</script>
```

### Vue Router Guards

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import memberstackDOM from '@memberstack/dom';

const memberstack = memberstackDOM.init({
  publicKey: import.meta.env.VITE_MEMBERSTACK_KEY
});

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/premium',
    name: 'Premium',
    component: () => import('../views/Premium.vue'),
    meta: { requiresAuth: true, requiredPlan: 'pln_premium' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      const { data: member } = await memberstack.getCurrentMember();
      
      if (!member) {
        return next('/login');
      }

      // Check for required plan
      if (to.meta.requiredPlan) {
        const hasPlan = member.planConnections?.some(
          conn => conn.planId === to.meta.requiredPlan && conn.active
        );
        
        if (!hasPlan) {
          return next('/upgrade');
        }
      }

      next();
    } catch (error) {
      console.error('Auth check failed:', error);
      next('/login');
    }
  } else {
    next();
  }
});

export default router;
```

## Next.js Integration Patterns

### Next.js 13+ App Router with Server Components

```javascript
// app/providers/MemberstackProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import memberstackDOM from '@memberstack/dom';

const MemberstackContext = createContext(null);

export function MemberstackProvider({ children }) {
  const [memberstack, setMemberstack] = useState(null);
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ms = memberstackDOM.init({
      publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_KEY,
      useCookies: true
    });
    
    setMemberstack(ms);

    ms.getCurrentMember()
      .then(({ data }) => {
        setMember(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });

    const listener = ms.onAuthChange(setMember);

    return () => listener.unsubscribe();
  }, []);

  return (
    <MemberstackContext.Provider value={{ memberstack, member, isLoading }}>
      {children}
    </MemberstackContext.Provider>
  );
}

export const useMemberstack = () => {
  const context = useContext(MemberstackContext);
  if (!context) {
    throw new Error('useMemberstack must be used within MemberstackProvider');
  }
  return context;
};

// app/layout.tsx
import { MemberstackProvider } from './providers/MemberstackProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MemberstackProvider>
          {children}
        </MemberstackProvider>
      </body>
    </html>
  );
}
```

### Next.js API Route Integration

```javascript
// pages/api/verify-member.js (Pages Router)
// or app/api/verify-member/route.js (App Router)

import memberstackAdmin from '@memberstack/admin';

const memberstack = memberstackAdmin.init({
  secretKey: process.env.MEMBERSTACK_SECRET_KEY
});

export async function POST(request) {
  try {
    const { token } = await request.json();
    
    // Verify the member token
    const member = await memberstack.verifyToken({ token });
    
    if (!member) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Perform server-side operations
    // e.g., create database records, send emails, etc.

    return Response.json({ 
      success: true, 
      memberId: member.id 
    });
  } catch (error) {
    return Response.json({ 
      error: 'Verification failed' 
    }, { status: 500 });
  }
}
```

## SvelteKit Integration Patterns

### SvelteKit Stores Pattern

```javascript
// src/lib/stores/memberstack.js
import { writable, derived } from 'svelte/store';
import memberstackDOM from '@memberstack/dom';
import { browser } from '$app/environment';

function createMemberstackStore() {
  const { subscribe, set, update } = writable({
    memberstack: null,
    member: null,
    isLoading: true
  });

  let authListener = null;

  return {
    subscribe,
    init: async (publicKey) => {
      if (!browser) return;

      const ms = memberstackDOM.init({
        publicKey,
        useCookies: true
      });

      try {
        const { data: member } = await ms.getCurrentMember();
        set({ memberstack: ms, member, isLoading: false });
      } catch (error) {
        set({ memberstack: ms, member: null, isLoading: false });
      }

      authListener = ms.onAuthChange((member) => {
        update(state => ({ ...state, member }));
      });
    },
    login: async (email, password) => {
      const state = get(memberstackStore);
      if (!state.memberstack) throw new Error('Memberstack not initialized');

      const result = await state.memberstack.loginMemberEmailPassword({
        email,
        password
      });
      return result.data;
    },
    logout: async () => {
      const state = get(memberstackStore);
      if (!state.memberstack) return;

      await state.memberstack.logout();
    },
    cleanup: () => {
      if (authListener) {
        authListener.unsubscribe();
      }
    }
  };
}

export const memberstackStore = createMemberstackStore();
export const isAuthenticated = derived(
  memberstackStore,
  $memberstackStore => !!$memberstackStore.member
);

// src/routes/+layout.svelte
<script>
  import { onMount } from 'svelte';
  import { memberstackStore } from '$lib/stores/memberstack';
  import { PUBLIC_MEMBERSTACK_KEY } from '$env/static/public';

  onMount(() => {
    memberstackStore.init(PUBLIC_MEMBERSTACK_KEY);
    
    return () => {
      memberstackStore.cleanup();
    };
  });
</script>

<slot />
```

### SvelteKit Load Function Pattern

```javascript
// src/routes/dashboard/+page.js
import { redirect } from '@sveltejs/kit';
import memberstackDOM from '@memberstack/dom';

export async function load({ parent }) {
  const { memberstack } = await parent();
  
  try {
    const { data: member } = await memberstack.getCurrentMember();
    
    if (!member) {
      throw redirect(302, '/login');
    }

    return {
      member
    };
  } catch (error) {
    throw redirect(302, '/login');
  }
}
```

## Authentication Flow Patterns

### Complete Signup Flow with Verification

```javascript
class AuthenticationFlow {
  constructor(memberstack) {
    this.memberstack = memberstack;
  }

  async completeSignup({ email, password, customFields, planId }) {
    try {
      // Step 1: Create account
      const { data } = await this.memberstack.signupMemberEmailPassword({
        email,
        password,
        customFields,
        plans: planId ? [{ planId }] : []
      });

      // Step 2: Send verification email
      await this.sendVerificationEmail();

      return {
        success: true,
        member: data.member,
        needsVerification: !data.member.verified
      };
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  async sendVerificationEmail() {
    try {
      await this.memberstack.sendMemberVerificationEmail();
      return { success: true };
    } catch (error) {
      console.error('Verification email failed:', error);
      // Don't fail the whole flow
      return { success: false, error };
    }
  }

  async loginWithRetry({ email, password }, maxAttempts = 3) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const result = await this.memberstack.loginMemberEmailPassword({
          email,
          password
        });
        return { success: true, data: result.data };
      } catch (error) {
        attempts++;
        
        if (error.code === 'too_many_requests') {
          // Wait before retry
          await this.delay(Math.pow(2, attempts) * 1000);
        } else {
          return this.handleAuthError(error);
        }
      }
    }
    
    return {
      success: false,
      error: 'Maximum login attempts exceeded'
    };
  }

  handleAuthError(error) {
    const errorMap = {
      'invalid_credentials': 'Invalid email or password',
      'email_not_verified': 'Please verify your email first',
      'member_not_found': 'No account found with this email',
      'email_already_exists': 'An account already exists with this email',
      'weak_password': 'Password is too weak',
      'invalid_email': 'Invalid email format'
    };

    return {
      success: false,
      error: errorMap[error.code] || error.message,
      code: error.code,
      requiresAction: error.code === 'email_not_verified' ? 'verify' : null
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Social Authentication Flow

```javascript
class SocialAuthFlow {
  constructor(memberstack) {
    this.memberstack = memberstack;
  }

  async handleSocialAuth(provider, isSignup = false) {
    try {
      // Store return URL in session storage
      sessionStorage.setItem('authReturnUrl', window.location.href);

      if (isSignup) {
        await this.memberstack.signupWithProvider({
          provider,
          allowLogin: true,
          plans: [{ planId: 'pln_free' }]
        });
      } else {
        await this.memberstack.loginWithProvider({
          provider,
          allowSignup: true
        });
      }
      // This code won't execute due to redirect
    } catch (error) {
      console.error(`${provider} auth failed:`, error);
      this.showError(`Failed to authenticate with ${provider}`);
    }
  }

  // Handle return from social auth
  async handleAuthReturn() {
    const { data: member } = await this.memberstack.getCurrentMember();
    
    if (member) {
      const returnUrl = sessionStorage.getItem('authReturnUrl') || '/dashboard';
      sessionStorage.removeItem('authReturnUrl');
      window.location.href = returnUrl;
    }
  }
}
```

### Passwordless Authentication Flow

```javascript
class PasswordlessFlow {
  constructor(memberstack) {
    this.memberstack = memberstack;
  }

  async initPasswordlessLogin(email) {
    try {
      await this.memberstack.sendMemberLoginPasswordlessEmail({ email });
      
      // Store email for later use
      localStorage.setItem('pendingPasswordlessEmail', email);
      
      return {
        success: true,
        message: 'Check your email for the magic link'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async completePasswordlessLogin(token) {
    const email = localStorage.getItem('pendingPasswordlessEmail');
    
    if (!email) {
      return {
        success: false,
        error: 'Email not found. Please start the login process again.'
      };
    }

    try {
      const result = await this.memberstack.loginMemberPasswordless({
        email,
        passwordlessToken: token
      });

      localStorage.removeItem('pendingPasswordlessEmail');
      
      return {
        success: true,
        member: result.data.member
      };
    } catch (error) {
      if (error.code === 'invalid_token') {
        return {
          success: false,
          error: 'Invalid or expired link. Please request a new one.'
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

## State Management Patterns

### Redux Integration

```javascript
// store/memberstackSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import memberstackDOM from '@memberstack/dom';

let memberstack = null;

// Initialize Memberstack
export const initMemberstack = createAsyncThunk(
  'memberstack/init',
  async (publicKey) => {
    memberstack = memberstackDOM.init({ publicKey, useCookies: true });
    const { data } = await memberstack.getCurrentMember();
    return data;
  }
);

// Login action
export const login = createAsyncThunk(
  'memberstack/login',
  async ({ email, password }) => {
    const result = await memberstack.loginMemberEmailPassword({
      email,
      password
    });
    return result.data.member;
  }
);

// Logout action
export const logout = createAsyncThunk(
  'memberstack/logout',
  async () => {
    await memberstack.logout();
    return null;
  }
);

const memberstackSlice = createSlice({
  name: 'memberstack',
  initialState: {
    member: null,
    isLoading: true,
    error: null
  },
  reducers: {
    setMember: (state, action) => {
      state.member = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Init
      .addCase(initMemberstack.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initMemberstack.fulfilled, (state, action) => {
        state.isLoading = false;
        state.member = action.payload;
      })
      .addCase(initMemberstack.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Login
      .addCase(login.fulfilled, (state, action) => {
        state.member = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.error = action.error.message;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.member = null;
      });
  }
});

export const { setMember } = memberstackSlice.actions;
export default memberstackSlice.reducer;
```

### Zustand Integration

```javascript
// stores/memberstackStore.js
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import memberstackDOM from '@memberstack/dom';

const useMemberstackStore = create(
  devtools(
    persist(
      (set, get) => ({
        memberstack: null,
        member: null,
        isLoading: true,
        
        init: async (publicKey) => {
          const ms = memberstackDOM.init({
            publicKey,
            useCookies: true
          });
          
          set({ memberstack: ms });
          
          try {
            const { data } = await ms.getCurrentMember();
            set({ member: data, isLoading: false });
          } catch (error) {
            set({ isLoading: false });
          }
          
          // Listen for auth changes
          const listener = ms.onAuthChange((member) => {
            set({ member });
          });
          
          // Store cleanup function
          set({ cleanup: () => listener.unsubscribe() });
        },
        
        login: async (email, password) => {
          const { memberstack } = get();
          if (!memberstack) throw new Error('Memberstack not initialized');
          
          try {
            const result = await memberstack.loginMemberEmailPassword({
              email,
              password
            });
            set({ member: result.data.member });
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
        
        logout: async () => {
          const { memberstack } = get();
          if (!memberstack) return;
          
          await memberstack.logout();
          set({ member: null });
        },
        
        updateProfile: async (customFields) => {
          const { memberstack } = get();
          if (!memberstack) throw new Error('Memberstack not initialized');
          
          const result = await memberstack.updateMember({ customFields });
          set({ member: result.data });
          return result.data;
        }
      }),
      {
        name: 'memberstack-storage',
        partialize: (state) => ({ member: state.member })
      }
    )
  )
);

export default useMemberstackStore;
```

## Testing Patterns

### Unit Testing with Jest

```javascript
// __tests__/memberstack.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useMemberstack } from '../hooks/useMemberstack';

// Mock Memberstack
vi.mock('@memberstack/dom', () => ({
  default: {
    init: vi.fn(() => ({
      getCurrentMember: vi.fn(),
      loginMemberEmailPassword: vi.fn(),
      logout: vi.fn(),
      onAuthChange: vi.fn(() => ({ unsubscribe: vi.fn() }))
    }))
  }
}));

describe('useMemberstack', () => {
  it('should initialize and get current member', async () => {
    const mockMember = {
      id: '123',
      auth: { email: 'test@example.com' }
    };

    const mockInit = vi.fn(() => ({
      getCurrentMember: vi.fn(() => 
        Promise.resolve({ data: mockMember })
      ),
      onAuthChange: vi.fn(() => ({ unsubscribe: vi.fn() }))
    }));

    vi.mocked(memberstackDOM.init).mockImplementation(mockInit);

    const { result } = renderHook(() => useMemberstack());

    await waitFor(() => {
      expect(result.current.member).toEqual(mockMember);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle login errors', async () => {
    const mockInit = vi.fn(() => ({
      loginMemberEmailPassword: vi.fn(() => 
        Promise.reject(new Error('Invalid credentials'))
      ),
      getCurrentMember: vi.fn(() => 
        Promise.resolve({ data: null })
      ),
      onAuthChange: vi.fn(() => ({ unsubscribe: vi.fn() }))
    }));

    vi.mocked(memberstackDOM.init).mockImplementation(mockInit);

    const { result } = renderHook(() => useMemberstack());

    const loginResult = await result.current.login('test@example.com', 'wrong');
    
    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe('Invalid credentials');
  });
});
```

### E2E Testing with Cypress

```javascript
// cypress/e2e/auth.cy.js
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should complete signup flow', () => {
    cy.visit('/signup');
    
    // Fill form
    cy.get('[data-cy=email]').type('newuser@example.com');
    cy.get('[data-cy=password]').type('SecurePass123!');
    cy.get('[data-cy=firstName]').type('John');
    cy.get('[data-cy=lastName]').type('Doe');
    
    // Submit
    cy.get('[data-cy=signup-button]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Should show verification banner
    cy.contains('Please verify your email').should('be.visible');
  });

  it('should handle login with wrong credentials', () => {
    cy.visit('/login');
    
    cy.get('[data-cy=email]').type('user@example.com');
    cy.get('[data-cy=password]').type('wrongpassword');
    cy.get('[data-cy=login-button]').click();
    
    // Should show error
    cy.contains('Invalid email or password').should('be.visible');
    
    // Should not redirect
    cy.url().should('include', '/login');
  });

  it('should protect authenticated routes', () => {
    // Try to visit protected route
    cy.visit('/dashboard');
    
    // Should redirect to login
    cy.url().should('include', '/login');
    
    // Login
    cy.get('[data-cy=email]').type('user@example.com');
    cy.get('[data-cy=password]').type('correctpassword');
    cy.get('[data-cy=login-button]').click();
    
    // Should now be on dashboard
    cy.url().should('include', '/dashboard');
  });
});
```

### Integration Testing with Playwright

```javascript
// tests/memberstack.spec.js
import { test, expect } from '@playwright/test';

test.describe('Memberstack Integration', () => {
  test('should handle complete authentication flow', async ({ page }) => {
    // Navigate to signup
    await page.goto('/signup');
    
    // Fill signup form
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'SecurePass123!');
    await page.fill('[name=firstName]', 'Test');
    await page.fill('[name=lastName]', 'User');
    
    // Submit form
    await page.click('button[type=submit]');
    
    // Wait for redirect
    await page.waitForURL('**/dashboard');
    
    // Check for user info
    await expect(page.locator('[data-testid=user-email]')).toContainText('test@example.com');
    
    // Test logout
    await page.click('[data-testid=logout-button]');
    
    // Should redirect to home
    await page.waitForURL('**/');
    
    // Should not show user info
    await expect(page.locator('[data-testid=user-email]')).not.toBeVisible();
  });

  test('should handle plan-based access', async ({ page }) => {
    // Login as free user
    await page.goto('/login');
    await page.fill('[name=email]', 'freeuser@example.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');
    
    // Try to access premium content
    await page.goto('/premium-content');
    
    // Should show upgrade prompt
    await expect(page.locator('[data-testid=upgrade-prompt]')).toBeVisible();
    
    // Click upgrade
    await page.click('[data-testid=upgrade-button]');
    
    // Should redirect to checkout
    await page.waitForURL('**/checkout');
  });
});
```

## Performance Optimization Patterns

### Lazy Loading Memberstack

```javascript
// utils/lazyMemberstack.js
let memberstackPromise = null;

export const getMemberstack = async () => {
  if (!memberstackPromise) {
    memberstackPromise = import('@memberstack/dom').then(module => {
      return module.default.init({
        publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_KEY,
        useCookies: true
      });
    });
  }
  
  return memberstackPromise;
};

// Usage
const LoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      const memberstack = await getMemberstack();
      await memberstack.openModal('LOGIN');
    } catch (error) {
      console.error('Failed to load Memberstack:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Login'}
    </button>
  );
};
```

### Caching Member Data

```javascript
class MemberstackCache {
  constructor(memberstack, cacheTime = 5 * 60 * 1000) { // 5 minutes
    this.memberstack = memberstack;
    this.cacheTime = cacheTime;
    this.cache = new Map();
  }

  async getCurrentMember(forceRefresh = false) {
    const cacheKey = 'currentMember';
    const cached = this.cache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTime) {
      return { data: cached.data };
    }
    
    const result = await this.memberstack.getCurrentMember();
    
    this.cache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now()
    });
    
    return result;
  }

  async getPlans(forceRefresh = false) {
    const cacheKey = 'plans';
    const cached = this.cache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTime) {
      return { data: cached.data };
    }
    
    const result = await this.memberstack.getPlans();
    
    this.cache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now()
    });
    
    return result;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

## Security Best Practices

### Secure Token Handling

```javascript
class SecureAuthManager {
  constructor(memberstack) {
    this.memberstack = memberstack;
  }

  // Never store sensitive tokens in localStorage
  async getSecureToken() {
    // Get token only when needed
    const token = this.memberstack.getMemberToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return token;
  }

  // Secure API request wrapper
  async makeAuthenticatedRequest(url, options = {}) {
    const token = await this.getSecureToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      await this.handleTokenExpiry();
      throw new Error('Authentication required');
    }
    
    return response;
  }

  async handleTokenExpiry() {
    // Clear any cached data
    // Redirect to login
    await this.memberstack.logout();
    window.location.href = '/login';
  }
}
```

### Input Validation and Sanitization

```javascript
class MemberstackValidator {
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    return email.toLowerCase().trim();
  }

  static validatePassword(password) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
    
    return password;
  }

  static sanitizeCustomFields(fields) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string') {
        // Remove any potential XSS
        sanitized[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .trim();
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

// Usage
async function secureSignup(email, password, customFields) {
  try {
    const validatedEmail = MemberstackValidator.validateEmail(email);
    const validatedPassword = MemberstackValidator.validatePassword(password);
    const sanitizedFields = MemberstackValidator.sanitizeCustomFields(customFields);
    
    const result = await memberstack.signupMemberEmailPassword({
      email: validatedEmail,
      password: validatedPassword,
      customFields: sanitizedFields
    });
    
    return result;
  } catch (error) {
    console.error('Validation error:', error.message);
    throw error;
  }
}
```

These integration patterns provide comprehensive examples for implementing Memberstack across different frameworks and scenarios. Each pattern is optimized for real-world use and follows best practices for security, performance, and user experience.