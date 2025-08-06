# Memberstack REST API - AI Assistant Reference Guide

**BASE URL:** https://api.memberstack.com/v1  
**AUTHENTICATION:** Bearer token in Authorization header  
**CONTENT TYPE:** application/json  
**CRITICAL:** All requests require proper authentication and rate limiting

## Quick Reference Index
- [Endpoint Quick Lookup](#endpoint-quick-lookup)
- [Authentication](#authentication)
- [Rate Limits](#rate-limits)
- [Member Endpoints](#member-endpoints)
- [Plan Endpoints](#plan-endpoints)
- [Webhook Endpoints](#webhook-endpoints)
- [Error Handling](#error-handling)
- [Common Patterns](#common-patterns)

## Endpoint Quick Lookup

### Member Management
| Endpoint | Method | Purpose | Rate Limit | Auth Required |
|----------|--------|---------|------------|---------------|
| `/members` | GET | List members | 100/min | Secret Key |
| `/members/{id}` | GET | Get member | 1000/min | Secret Key |
| `/members` | POST | Create member | 60/min | Secret Key |
| `/members/{id}` | PATCH | Update member | 300/min | Secret Key |
| `/members/{id}` | DELETE | Delete member | 60/min | Secret Key |
| `/members/search` | POST | Search members | 100/min | Secret Key |

### Plan Management
| Endpoint | Method | Purpose | Rate Limit | Auth Required |
|----------|--------|---------|------------|---------------|
| `/plans` | GET | List plans | 1000/min | Public/Secret |
| `/plans/{id}` | GET | Get plan | 1000/min | Public/Secret |
| `/members/{id}/plans` | POST | Add plan | 300/min | Secret Key |
| `/members/{id}/plans/{planId}` | DELETE | Remove plan | 300/min | Secret Key |

### Authentication & Verification
| Endpoint | Method | Purpose | Rate Limit | Auth Required |
|----------|--------|---------|------------|---------------|
| `/auth/verify` | POST | Verify token | 1000/min | Secret Key |
| `/auth/login-link` | POST | Generate login link | 100/min | Secret Key |
| `/auth/revoke` | POST | Revoke sessions | 100/min | Secret Key |

## Authentication

### API Key Types

```javascript
// Secret Key (Server-side only)
// - Full access to all endpoints
// - Never expose in client code
// Format: sk_sb_... (test) or sk_... (live)

// Public Key (Client-side safe)
// - Limited read-only access to public data
// Format: pk_sb_... (test) or pk_... (live)
```

### Request Headers

```javascript
// REQUIRED headers for all requests:
const headers = {
  'Authorization': `Bearer ${secretKey}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// OPTIONAL headers:
{
  'X-Request-ID': 'unique-request-id', // For request tracking
  'User-Agent': 'YourApp/1.0'         // Identify your application
}
```

### Authentication Examples

```javascript
// Using fetch
const response = await fetch('https://api.memberstack.com/v1/members', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Using axios
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.memberstack.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Using curl
curl -X GET 'https://api.memberstack.com/v1/members' \
  -H 'Authorization: Bearer sk_your_secret_key' \
  -H 'Content-Type: application/json'
```

## Rate Limits

### Rate Limit Information

```javascript
// Rate limits are included in response headers:
{
  'X-RateLimit-Limit': '1000',      // Requests per window
  'X-RateLimit-Remaining': '999',   // Requests remaining
  'X-RateLimit-Reset': '1640995200' // Unix timestamp when limit resets
}

// When rate limited (429 status):
{
  'Retry-After': '60' // Seconds to wait before retry
}
```

### Rate Limit Handling

```javascript
async function makeAPIRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    // Check rate limit headers
    const remaining = response.headers.get('X-RateLimit-Remaining');
    if (remaining && parseInt(remaining) < 10) {
      console.warn(`Rate limit warning: ${remaining} requests remaining`);
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      console.log(`Rate limited. Retry after ${retryAfter} seconds`);
      
      // Implement exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, parseInt(retryAfter) * 1000)
      );
      
      // Retry request
      return makeAPIRequest(url, options);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

## Member Endpoints

### GET /members - List Members

```javascript
// LIST members
// GET https://api.memberstack.com/v1/members

// QUERY PARAMETERS:
{
  limit?: number,          // Max results per page (1-100, default: 25)
  offset?: number,         // Pagination offset (default: 0)
  plan_id?: string,        // Filter by plan ID
  verified?: boolean,      // Filter by verification status
  created_after?: string,  // ISO 8601 date
  created_before?: string, // ISO 8601 date
  sort?: string,          // Sort field: created_at, email (default: created_at)
  order?: string          // Sort order: asc, desc (default: desc)
}

// RESPONSE:
{
  data: {
    members: Member[],
    pagination: {
      total: number,
      limit: number,
      offset: number,
      has_more: boolean
    }
  }
}

// COMPLETE EXAMPLE:
async function getMembers(filters = {}) {
  const params = new URLSearchParams({
    limit: '50',
    sort: 'created_at',
    order: 'desc',
    ...filters
  });

  const response = await fetch(
    `https://api.memberstack.com/v1/members?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get members: ${response.statusText}`);
  }

  const { data } = await response.json();
  
  console.log(`Retrieved ${data.members.length} of ${data.pagination.total} members`);
  
  return data;
}

// Usage examples:
// All members: await getMembers()
// Premium members: await getMembers({ plan_id: 'pln_premium' })
// Verified only: await getMembers({ verified: true })
// Recent members: await getMembers({ created_after: '2024-01-01T00:00:00Z' })
```

### GET /members/{id} - Get Single Member

```javascript
// GET single member
// GET https://api.memberstack.com/v1/members/{memberId}

// PATH PARAMETERS:
{
  memberId: string         // REQUIRED - Member ID
}

// RESPONSE:
{
  data: {
    member: Member
  }
}

// COMPLETE EXAMPLE:
async function getMember(memberId) {
  const response = await fetch(
    `https://api.memberstack.com/v1/members/${memberId}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.status === 404) {
    throw new Error('Member not found');
  }

  if (!response.ok) {
    throw new Error(`Failed to get member: ${response.statusText}`);
  }

  const { data } = await response.json();
  
  console.log('Member:', data.member.auth.email);
  console.log('Plans:', data.member.plan_connections);
  
  return data.member;
}
```

### POST /members - Create Member

```javascript
// CREATE member
// POST https://api.memberstack.com/v1/members

// REQUEST BODY:
{
  email: string,           // REQUIRED
  password: string,        // REQUIRED
  custom_fields?: object,  // Optional custom fields
  metadata?: object,       // Optional admin metadata
  plans?: string[],        // Array of plan IDs
  verified?: boolean,      // Set verification status
  send_welcome_email?: boolean // Send welcome email (default: true)
}

// RESPONSE:
{
  data: {
    member: Member
  }
}

// COMPLETE EXAMPLE:
async function createMember(memberData) {
  const response = await fetch('https://api.memberstack.com/v1/members', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: memberData.email,
      password: memberData.password,
      custom_fields: {
        first_name: memberData.firstName,
        last_name: memberData.lastName,
        company: memberData.company
      },
      plans: ['pln_free'],
      verified: true,
      send_welcome_email: true
    })
  });

  if (response.status === 409) {
    throw new Error('Email already exists');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create member: ${error.message}`);
  }

  const { data } = await response.json();
  
  console.log('Member created:', data.member.id);
  
  return data.member;
}
```

### PATCH /members/{id} - Update Member

```javascript
// UPDATE member
// PATCH https://api.memberstack.com/v1/members/{memberId}

// PATH PARAMETERS:
{
  memberId: string         // REQUIRED
}

// REQUEST BODY (at least one field required):
{
  email?: string,          // New email
  password?: string,       // New password
  custom_fields?: object,  // Update custom fields
  metadata?: object,       // Update metadata
  verified?: boolean       // Update verification status
}

// RESPONSE:
{
  data: {
    member: Member
  }
}

// COMPLETE EXAMPLE:
async function updateMember(memberId, updates) {
  const response = await fetch(
    `https://api.memberstack.com/v1/members/${memberId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    }
  );

  if (response.status === 404) {
    throw new Error('Member not found');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update member: ${error.message}`);
  }

  const { data } = await response.json();
  
  console.log('Member updated:', data.member.id);
  
  return data.member;
}

// Usage examples:
// Update email: await updateMember('mem_123', { email: 'new@example.com' })
// Update custom fields: await updateMember('mem_123', { 
//   custom_fields: { first_name: 'John', last_name: 'Doe' } 
// })
// Verify member: await updateMember('mem_123', { verified: true })
```

### DELETE /members/{id} - Delete Member

```javascript
// DELETE member
// DELETE https://api.memberstack.com/v1/members/{memberId}

// PATH PARAMETERS:
{
  memberId: string         // REQUIRED
}

// RESPONSE:
// 204 No Content (success)
// 404 Not Found (member doesn't exist)

// COMPLETE EXAMPLE:
async function deleteMember(memberId) {
  const response = await fetch(
    `https://api.memberstack.com/v1/members/${memberId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.status === 404) {
    throw new Error('Member not found');
  }

  if (response.status !== 204) {
    throw new Error(`Failed to delete member: ${response.statusText}`);
  }

  console.log('Member deleted successfully');
}
```

### POST /members/search - Search Members

```javascript
// SEARCH members
// POST https://api.memberstack.com/v1/members/search

// REQUEST BODY:
{
  query: string,           // REQUIRED - Search term
  search_by?: string,      // Field to search: email, custom_fields (default: email)
  limit?: number,          // Max results (default: 25)
  offset?: number          // Pagination offset
}

// RESPONSE:
{
  data: {
    members: Member[],
    total: number
  }
}

// COMPLETE EXAMPLE:
async function searchMembers(query, searchBy = 'email') {
  const response = await fetch('https://api.memberstack.com/v1/members/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: query,
      search_by: searchBy,
      limit: 50
    })
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const { data } = await response.json();
  
  console.log(`Found ${data.members.length} members matching "${query}"`);
  
  return data.members;
}

// Usage examples:
// By email: await searchMembers('john@example.com')
// By name: await searchMembers('John Doe', 'custom_fields')
```

## Plan Endpoints

### GET /plans - List Plans

```javascript
// LIST plans
// GET https://api.memberstack.com/v1/plans

// QUERY PARAMETERS:
{
  limit?: number,          // Max results (default: 100)
  status?: string,         // Filter by status: active, inactive
  type?: string           // Filter by type: free, paid
}

// RESPONSE:
{
  data: {
    plans: Plan[]
  }
}

// COMPLETE EXAMPLE:
async function getPlans() {
  const response = await fetch('https://api.memberstack.com/v1/plans', {
    headers: {
      'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get plans: ${response.statusText}`);
  }

  const { data } = await response.json();
  
  console.log(`Retrieved ${data.plans.length} plans`);
  
  return data.plans;
}
```

### GET /plans/{id} - Get Plan

```javascript
// GET single plan
// GET https://api.memberstack.com/v1/plans/{planId}

// PATH PARAMETERS:
{
  planId: string           // REQUIRED
}

// RESPONSE:
{
  data: {
    plan: Plan
  }
}

// COMPLETE EXAMPLE:
async function getPlan(planId) {
  const response = await fetch(
    `https://api.memberstack.com/v1/plans/${planId}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.status === 404) {
    throw new Error('Plan not found');
  }

  if (!response.ok) {
    throw new Error(`Failed to get plan: ${response.statusText}`);
  }

  const { data } = await response.json();
  
  return data.plan;
}
```

### POST /members/{id}/plans - Add Plan to Member

```javascript
// ADD plan to member
// POST https://api.memberstack.com/v1/members/{memberId}/plans

// PATH PARAMETERS:
{
  memberId: string         // REQUIRED
}

// REQUEST BODY:
{
  plan_id: string          // REQUIRED
}

// RESPONSE:
{
  data: {
    member: Member
  }
}

// COMPLETE EXAMPLE:
async function addPlanToMember(memberId, planId) {
  const response = await fetch(
    `https://api.memberstack.com/v1/members/${memberId}/plans`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan_id: planId
      })
    }
  );

  if (response.status === 404) {
    throw new Error('Member or plan not found');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to add plan: ${error.message}`);
  }

  const { data } = await response.json();
  
  console.log('Plan added successfully');
  
  return data.member;
}
```

### DELETE /members/{id}/plans/{planId} - Remove Plan from Member

```javascript
// REMOVE plan from member
// DELETE https://api.memberstack.com/v1/members/{memberId}/plans/{planId}

// PATH PARAMETERS:
{
  memberId: string,        // REQUIRED
  planId: string          // REQUIRED
}

// RESPONSE:
// 204 No Content (success)

// COMPLETE EXAMPLE:
async function removePlanFromMember(memberId, planId) {
  const response = await fetch(
    `https://api.memberstack.com/v1/members/${memberId}/plans/${planId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.status === 404) {
    throw new Error('Member or plan not found');
  }

  if (response.status !== 204) {
    throw new Error(`Failed to remove plan: ${response.statusText}`);
  }

  console.log('Plan removed successfully');
}
```

## Authentication Endpoints

### POST /auth/verify - Verify Token

```javascript
// VERIFY member token
// POST https://api.memberstack.com/v1/auth/verify

// REQUEST BODY:
{
  token: string            // REQUIRED - JWT token from client
}

// RESPONSE:
{
  data: {
    member: Member,
    valid: boolean
  }
}

// COMPLETE EXAMPLE:
async function verifyMemberToken(token) {
  const response = await fetch('https://api.memberstack.com/v1/auth/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      token: token
    })
  });

  if (response.status === 401) {
    return { valid: false, member: null };
  }

  if (!response.ok) {
    throw new Error(`Token verification failed: ${response.statusText}`);
  }

  const { data } = await response.json();
  
  return {
    valid: data.valid,
    member: data.member
  };
}
```

### POST /auth/login-link - Generate Login Link

```javascript
// GENERATE login link
// POST https://api.memberstack.com/v1/auth/login-link

// REQUEST BODY:
{
  member_id: string,       // REQUIRED
  redirect_url?: string,   // URL to redirect after login
  expires_in?: number     // Link expiry in seconds (default: 3600)
}

// RESPONSE:
{
  data: {
    url: string,
    expires_at: string
  }
}

// COMPLETE EXAMPLE:
async function generateLoginLink(memberId, redirectUrl = '/dashboard') {
  const response = await fetch('https://api.memberstack.com/v1/auth/login-link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      member_id: memberId,
      redirect_url: redirectUrl,
      expires_in: 7200 // 2 hours
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate login link: ${response.statusText}`);
  }

  const { data } = await response.json();
  
  console.log('Login link generated:', data.url);
  console.log('Expires at:', data.expires_at);
  
  return data;
}
```

## Webhook Endpoints

### Webhook Event Types

```javascript
// WEBHOOK event types:
const WEBHOOK_EVENTS = {
  MEMBER_CREATED: 'member.created',
  MEMBER_UPDATED: 'member.updated',
  MEMBER_DELETED: 'member.deleted',
  MEMBER_PLAN_ADDED: 'member.plan.added',
  MEMBER_PLAN_REMOVED: 'member.plan.removed',
  PAYMENT_SUCCEEDED: 'member.payment.succeeded',
  PAYMENT_FAILED: 'member.payment.failed',
  SUBSCRIPTION_CANCELLED: 'member.subscription.cancelled'
};
```

### Webhook Payload Structure

```javascript
// WEBHOOK payload structure:
{
  id: string,              // Event ID
  type: string,            // Event type (see above)
  created: number,         // Unix timestamp
  data: {
    member: Member,        // Member object
    previous?: object,     // Previous state (for updates)
    plan?: object,         // Plan object (for plan events)
    payment?: object       // Payment object (for payment events)
  }
}
```

### Webhook Verification

```javascript
// VERIFY webhook signature
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  const expectedHeader = `sha256=${expectedSignature}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedHeader)
  );
}

// EXPRESS.JS webhook endpoint example:
app.post('/webhook/memberstack', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['memberstack-signature'];
  const secret = process.env.MEMBERSTACK_WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = JSON.parse(req.body.toString());
  
  try {
    switch (event.type) {
      case 'member.created':
        handleMemberCreated(event.data.member);
        break;
        
      case 'member.plan.added':
        handlePlanAdded(event.data.member, event.data.plan);
        break;
        
      case 'member.payment.succeeded':
        handlePaymentSucceeded(event.data.member, event.data.payment);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});
```

## Error Handling

### Error Response Structure

```javascript
// ERROR response structure:
{
  error: {
    message: string,       // Human-readable error message
    code: string,         // Error code for programmatic handling
    details?: object,     // Additional error details
    request_id?: string   // Request ID for support
  }
}
```

### HTTP Status Codes

```javascript
// COMMON status codes:
const STATUS_CODES = {
  200: 'OK - Request successful',
  201: 'Created - Resource created successfully',
  204: 'No Content - Request successful, no response body',
  400: 'Bad Request - Invalid request parameters',
  401: 'Unauthorized - Invalid or missing API key',
  403: 'Forbidden - Insufficient permissions',
  404: 'Not Found - Resource not found',
  409: 'Conflict - Resource already exists',
  422: 'Unprocessable Entity - Validation errors',
  429: 'Too Many Requests - Rate limit exceeded',
  500: 'Internal Server Error - Server error',
  502: 'Bad Gateway - Upstream server error',
  503: 'Service Unavailable - Temporary server issue'
};
```

### Error Handling Pattern

```javascript
async function handleAPIRequest(url, options) {
  try {
    const response = await fetch(url, options);
    
    // Handle different status codes
    switch (response.status) {
      case 200:
      case 201:
      case 204:
        return response.status === 204 ? null : await response.json();
        
      case 400:
        const badRequestError = await response.json();
        throw new Error(`Bad Request: ${badRequestError.error.message}`);
        
      case 401:
        throw new Error('Unauthorized: Check your API key');
        
      case 403:
        throw new Error('Forbidden: Insufficient permissions');
        
      case 404:
        throw new Error('Not Found: Resource does not exist');
        
      case 409:
        const conflictError = await response.json();
        throw new Error(`Conflict: ${conflictError.error.message}`);
        
      case 422:
        const validationError = await response.json();
        throw new Error(`Validation Error: ${validationError.error.message}`);
        
      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate Limited: Retry after ${retryAfter} seconds`);
        
      case 500:
      case 502:
      case 503:
        throw new Error(`Server Error: ${response.status} ${response.statusText}`);
        
      default:
        throw new Error(`Unexpected Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network Error: Unable to connect to API');
    }
    throw error;
  }
}
```

## Common Patterns

### Pagination Pattern

```javascript
// PAGINATION helper
async function getAllMembers() {
  const allMembers = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `https://api.memberstack.com/v1/members?limit=${limit}&offset=${offset}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const { data } = await response.json();
    
    allMembers.push(...data.members);
    
    hasMore = data.pagination.has_more;
    offset += limit;
    
    // Rate limit protection
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return allMembers;
}
```

### Bulk Operations Pattern

```javascript
// BULK operations with rate limiting
async function bulkUpdateMembers(updates) {
  const results = {
    successful: [],
    failed: []
  };
  
  const batchSize = 5; // Small batch to respect rate limits
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    const promises = batch.map(async ({ memberId, data }) => {
      try {
        const response = await fetch(
          `https://api.memberstack.com/v1/members/${memberId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        results.successful.push({ memberId, result });
      } catch (error) {
        results.failed.push({ memberId, error: error.message });
      }
    });
    
    await Promise.all(promises);
    
    // Rate limit protection between batches
    if (i + batchSize < updates.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

### Retry Pattern with Exponential Backoff

```javascript
// RETRY pattern for transient failures
async function retryAPIRequest(url, options, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`Client Error: ${response.status}`);
      }
      
      // Retry server errors (5xx) and rate limits (429)
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Server Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        throw new Error(`Request failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Type Definitions

```javascript
// MEMBER object structure
interface Member {
  id: string;
  auth: {
    email: string;
    has_password: boolean;
    providers: Array<{ provider: string }>;
  };
  verified: boolean;
  custom_fields: { [key: string]: any };
  metadata: { [key: string]: any };
  plan_connections: Array<{
    id: string;
    plan_id: string;
    active: boolean;
    status: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

// PLAN object structure
interface Plan {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  type: 'free' | 'paid';
  created_at: string;
  updated_at: string;
}

// API RESPONSE structure
interface APIResponse<T> {
  data: T;
}

// PAGINATION structure
interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}
```

## Critical Notes for AI Assistants

1. **ALWAYS use HTTPS** - Never use HTTP for API requests
2. **NEVER expose secret keys** - Keep API keys secure and server-side only
3. **ALWAYS handle rate limits** - Implement proper backoff strategies
4. **ALWAYS verify webhooks** - Use signature verification for security
5. **USE proper HTTP methods** - GET for reading, POST for creating, PATCH for updating, DELETE for removing
6. **HANDLE all error scenarios** - 400, 401, 403, 404, 429, 500 status codes
7. **IMPLEMENT pagination** - Don't assume all data fits in one request
8. **RESPECT rate limits** - Different endpoints have different limits
9. **USE request IDs** - For tracking and debugging
10. **TEST in sandbox first** - Use test mode before going live

### Common Mistakes to Avoid

- ❌ Using secret keys in client-side code
- ✅ Keep secret keys server-side only
- ❌ Not handling rate limits
- ✅ Implement exponential backoff
- ❌ Ignoring webhook signature verification
- ✅ Always verify webhook signatures
- ❌ Not implementing pagination
- ✅ Handle paginated responses properly
- ❌ Using wrong HTTP methods
- ✅ Use appropriate HTTP verbs
- ❌ Not handling all error status codes
- ✅ Handle 4xx and 5xx responses appropriately

This REST API reference provides a comprehensive guide for integrating with Memberstack's HTTP API. Always refer to the official API documentation for the most up-to-date endpoint specifications and any additional features.