# Memberstack Admin API - AI Assistant Reference Guide

**PACKAGE:** @memberstack/admin  
**TYPE:** Server-side Node.js API  
**AUTHENTICATION:** Secret Key Required  
**LAST VERIFIED:** 2025-01-06  
**OFFICIAL DOCS:** https://docs.memberstack.com/  
**DEVELOPER PORTAL:** https://developers.memberstack.com/admin-node-package  
**CRITICAL:** This API is for server-side use only. Never expose secret keys in client-side code.

> **Note:** This documentation represents the Memberstack Admin Node.js SDK. Please verify against the latest official documentation for the most current information.

## Quick Reference Index
- [Method Signatures Quick Lookup](#method-signatures-quick-lookup)
- [Decision Trees](#decision-trees)
- [Installation & Setup](#installation--setup)
- [Member Management](#member-management)
- [Plan Management](#plan-management)
- [Authentication & Verification](#authentication--verification)
- [Webhook Management](#webhook-management)
- [Error Handling](#error-handling)
- [Common Patterns](#common-patterns)

## Method Signatures Quick Lookup

### Member Management
| Method | Purpose | Required Params | Returns | Notes |
|--------|---------|----------------|---------|-------|
| `getMembers()` | List all members | - | `Promise<{data: {members, total, hasMore}}>` | Paginated |
| `getMember()` | Get single member | memberId | `Promise<{data: Member}>` | - |
| `createMember()` | Create new member | email, password | `Promise<{data: Member}>` | Server-side only |
| `updateMember()` | Update member data | memberId, updates | `Promise<{data: Member}>` | - |
| `deleteMember()` | Delete member | memberId | `Promise<void>` | Permanent |
| `searchMembers()` | Search members | query | `Promise<{data: {members}}>` | - |

### Plan Management
| Method | Purpose | Required Params | Returns | Notes |
|--------|---------|----------------|---------|-------|
| `addPlanToMember()` | Add plan to member | memberId, planId | `Promise<{data: Member}>` | - |
| `removePlanFromMember()` | Remove plan | memberId, planId | `Promise<{data: Member}>` | - |
| `updateMemberPlans()` | Update all plans | memberId, planIds | `Promise<{data: Member}>` | Replaces all |

### Authentication & Verification
| Method | Purpose | Required Params | Returns | Notes |
|--------|---------|----------------|---------|-------|
| `verifyToken()` | Verify member token | token | `Promise<{data: Member}>` | JWT verification |
| `generateLoginLink()` | Create login link | memberId | `Promise<{data: {url}}>` | One-time use |
| `revokeAllSessions()` | Logout everywhere | memberId | `Promise<void>` | - |

## Decision Trees

### Member Management Decision Tree
```
Need to manage members server-side?
├─ Retrieving member data?
│  ├─ Single member?
│  │  └─ getMember({ memberId })
│  │
│  ├─ List of members?
│  │  └─ getMembers({ limit: 100, offset: 0 })
│  │
│  └─ Search for members?
│     └─ searchMembers({ 
│           query: "john@example.com",
│           searchBy: "email"
│         })
│
├─ Creating/Updating members?
│  ├─ New member?
│  │  └─ createMember({
│  │        email,
│  │        password,
│  │        customFields,
│  │        plans: [{ planId }]
│  │      })
│  │
│  ├─ Update existing member?
│  │  └─ updateMember({
│  │        memberId,
│  │        customFields: { ... },
│  │        metadata: { ... }
│  │      })
│  │
│  └─ Delete member?
│     └─ deleteMember({ memberId })
│
└─ Managing member plans?
   ├─ Add single plan?
   │  └─ addPlanToMember({ memberId, planId })
   │
   ├─ Remove plan?
   │  └─ removePlanFromMember({ memberId, planId })
   │
   └─ Replace all plans?
      └─ updateMemberPlans({ 
            memberId, 
            planIds: ["pln_1", "pln_2"] 
          })
```

### Authentication Decision Tree
```
Server-side authentication needs?
├─ Verify member token from client?
│  └─ verifyToken({ token })
│       Returns member if valid, throws if invalid
│
├─ Generate secure login link?
│  └─ generateLoginLink({ 
│        memberId,
│        redirectUrl: "/dashboard",
│        expiresIn: 3600 // seconds
│      })
│
├─ Revoke all sessions?
│  └─ revokeAllSessions({ memberId })
│
└─ Custom authentication flow?
   ├─ Create member → createMember()
   ├─ Verify credentials → Custom implementation
   └─ Generate tokens → Use JWT libraries
```

## Installation & Setup

### Installation

```bash
# Install via npm
npm install @memberstack/admin

# OR install via yarn
yarn add @memberstack/admin
```

### Basic Initialization

```javascript
// Import the package
import MemberstackAdmin from '@memberstack/admin';

// Initialize with secret key (REQUIRED)
const memberstackAdmin = MemberstackAdmin.init({
  secretKey: process.env.MEMBERSTACK_SECRET_KEY // REQUIRED - Never expose this
});

// CRITICAL: Only use in server-side code
// - Node.js backends
// - Serverless functions
// - API routes
// Never in client-side code
```

### Environment Configuration

```bash
# .env.local (Next.js)
MEMBERSTACK_SECRET_KEY=sk_sb_your_secret_key_here

# .env (Node.js)
MEMBERSTACK_SECRET_KEY=sk_sb_your_secret_key_here
```

## Member Management

### Get Members

```javascript
// GET list of members - EXACT METHOD SIGNATURE:
memberstackAdmin.getMembers(params?)

// OPTIONAL params:
{
  limit?: number,          // Max results per page (default: 25, max: 100)
  offset?: number,         // Pagination offset (default: 0)
  filter?: {
    planId?: string,       // Filter by plan
    status?: string,       // Filter by status
    verified?: boolean     // Filter by verification status
  },
  sort?: {
    field: string,         // Field to sort by
    order: 'asc' | 'desc'  // Sort order
  }
}

// RETURN VALUE:
// Promise<{
//   data: {
//     members: Member[],
//     total: number,
//     hasMore: boolean
//   }
// }>

// COMPLETE EXAMPLE:
try {
  const { data } = await memberstackAdmin.getMembers({
    limit: 50,
    offset: 0,
    filter: {
      planId: 'pln_premium',
      verified: true
    },
    sort: {
      field: 'createdAt',
      order: 'desc'
    }
  });

  console.log(`Total members: ${data.total}`);
  console.log(`Retrieved: ${data.members.length}`);
  console.log(`Has more: ${data.hasMore}`);

  data.members.forEach(member => {
    console.log(`${member.auth.email} - ${member.id}`);
  });
} catch (error) {
  console.error('Failed to get members:', error.message);
}
```

### Get Single Member

```javascript
// GET single member - EXACT METHOD SIGNATURE:
memberstackAdmin.getMember(params)

// REQUIRED params:
{
  memberId: string         // REQUIRED - Member ID
}

// RETURN VALUE:
// Promise<{ data: Member }>

// COMPLETE EXAMPLE:
try {
  const { data: member } = await memberstackAdmin.getMember({
    memberId: 'mem_sb_123456'
  });

  console.log('Member email:', member.auth.email);
  console.log('Plans:', member.planConnections);
  console.log('Custom fields:', member.customFields);
} catch (error) {
  if (error.statusCode === 404) {
    console.error('Member not found');
  } else {
    console.error('Failed to get member:', error.message);
  }
}
```

### Create Member

```javascript
// CREATE member - EXACT METHOD SIGNATURE:
memberstackAdmin.createMember(params)

// REQUIRED params:
{
  email: string,           // REQUIRED
  password: string         // REQUIRED
}

// OPTIONAL params (add to above object):
{
  customFields?: object,   // Custom field values
  metadata?: object,       // Admin metadata
  plans?: Array<{ planId: string }>, // Initial plans
  verified?: boolean,      // Set verification status
  sendWelcomeEmail?: boolean // Send welcome email (default: true)
}

// RETURN VALUE:
// Promise<{ data: Member }>

// COMPLETE EXAMPLE:
try {
  const { data: member } = await memberstackAdmin.createMember({
    email: 'newuser@example.com',
    password: 'SecurePassword123!',
    customFields: {
      firstName: 'John',
      lastName: 'Doe',
      company: 'Acme Corp'
    },
    plans: [{ planId: 'pln_free' }],
    verified: true, // Skip email verification
    sendWelcomeEmail: true
  });

  console.log('Member created:', member.id);
  console.log('Email:', member.auth.email);
} catch (error) {
  if (error.code === 'email_already_exists') {
    console.error('Email already registered');
  } else {
    console.error('Failed to create member:', error.message);
  }
}
```

### Update Member

```javascript
// UPDATE member - EXACT METHOD SIGNATURE:
memberstackAdmin.updateMember(params)

// REQUIRED params:
{
  memberId: string         // REQUIRED
}

// OPTIONAL params (at least one required):
{
  email?: string,          // New email
  password?: string,       // New password
  customFields?: object,   // Update custom fields
  metadata?: object,       // Update metadata
  verified?: boolean       // Update verification status
}

// RETURN VALUE:
// Promise<{ data: Member }>

// COMPLETE EXAMPLE:
try {
  const { data: member } = await memberstackAdmin.updateMember({
    memberId: 'mem_sb_123456',
    customFields: {
      firstName: 'Jane',
      lastName: 'Smith',
      lastUpdatedBy: 'admin'
    },
    metadata: {
      adminNotes: 'Updated via admin panel',
      updatedAt: new Date().toISOString()
    },
    verified: true
  });

  console.log('Member updated:', member);
} catch (error) {
  console.error('Failed to update member:', error.message);
}
```

### Delete Member

```javascript
// DELETE member - EXACT METHOD SIGNATURE:
memberstackAdmin.deleteMember(params)

// REQUIRED params:
{
  memberId: string         // REQUIRED
}

// RETURN VALUE:
// Promise<void>

// COMPLETE EXAMPLE:
try {
  await memberstackAdmin.deleteMember({
    memberId: 'mem_sb_123456'
  });

  console.log('Member deleted successfully');
} catch (error) {
  if (error.statusCode === 404) {
    console.error('Member not found');
  } else {
    console.error('Failed to delete member:', error.message);
  }
}
```

### Search Members

```javascript
// SEARCH members - EXACT METHOD SIGNATURE:
memberstackAdmin.searchMembers(params)

// REQUIRED params:
{
  query: string            // REQUIRED - Search query
}

// OPTIONAL params:
{
  searchBy?: 'email' | 'id' | 'customFields', // Search field (default: 'email')
  limit?: number,          // Max results (default: 25)
  offset?: number          // Pagination offset
}

// RETURN VALUE:
// Promise<{ data: { members: Member[] } }>

// COMPLETE EXAMPLE:
try {
  const { data } = await memberstackAdmin.searchMembers({
    query: 'john',
    searchBy: 'customFields',
    limit: 10
  });

  console.log(`Found ${data.members.length} members`);
  
  data.members.forEach(member => {
    console.log(`${member.auth.email} - ${member.customFields.firstName}`);
  });
} catch (error) {
  console.error('Search failed:', error.message);
}
```

## Plan Management

### Add Plan to Member

```javascript
// ADD plan - EXACT METHOD SIGNATURE:
memberstackAdmin.addPlanToMember(params)

// REQUIRED params:
{
  memberId: string,        // REQUIRED
  planId: string          // REQUIRED
}

// RETURN VALUE:
// Promise<{ data: Member }>

// COMPLETE EXAMPLE:
try {
  const { data: member } = await memberstackAdmin.addPlanToMember({
    memberId: 'mem_sb_123456',
    planId: 'pln_premium'
  });

  console.log('Plan added successfully');
  console.log('Current plans:', member.planConnections);
} catch (error) {
  console.error('Failed to add plan:', error.message);
}
```

### Remove Plan from Member

```javascript
// REMOVE plan - EXACT METHOD SIGNATURE:
memberstackAdmin.removePlanFromMember(params)

// REQUIRED params:
{
  memberId: string,        // REQUIRED
  planId: string          // REQUIRED
}

// RETURN VALUE:
// Promise<{ data: Member }>

// COMPLETE EXAMPLE:
try {
  const { data: member } = await memberstackAdmin.removePlanFromMember({
    memberId: 'mem_sb_123456',
    planId: 'pln_old_plan'
  });

  console.log('Plan removed successfully');
  console.log('Remaining plans:', member.planConnections);
} catch (error) {
  console.error('Failed to remove plan:', error.message);
}
```

### Update Member Plans

```javascript
// UPDATE all plans - EXACT METHOD SIGNATURE:
memberstackAdmin.updateMemberPlans(params)

// REQUIRED params:
{
  memberId: string,        // REQUIRED
  planIds: string[]       // REQUIRED - Replaces all existing plans
}

// RETURN VALUE:
// Promise<{ data: Member }>

// COMPLETE EXAMPLE:
try {
  const { data: member } = await memberstackAdmin.updateMemberPlans({
    memberId: 'mem_sb_123456',
    planIds: ['pln_premium', 'pln_addon'] // Replaces ALL existing plans
  });

  console.log('Plans updated successfully');
  console.log('New plans:', member.planConnections);
} catch (error) {
  console.error('Failed to update plans:', error.message);
}
```

## Authentication & Verification

### Verify Token

```javascript
// VERIFY member token - EXACT METHOD SIGNATURE:
memberstackAdmin.verifyToken(params)

// REQUIRED params:
{
  token: string            // REQUIRED - JWT token from client
}

// RETURN VALUE:
// Promise<{ data: Member }> if valid
// Throws error if invalid

// COMPLETE EXAMPLE:
try {
  const { data: member } = await memberstackAdmin.verifyToken({
    token: 'eyJhbGciOiJIUzI1NiIs...' // Token from client
  });

  console.log('Token valid for member:', member.auth.email);
  console.log('Member ID:', member.id);
  
  // Proceed with authenticated request
} catch (error) {
  if (error.code === 'invalid_token') {
    console.error('Invalid or expired token');
    // Return 401 Unauthorized
  } else {
    console.error('Token verification failed:', error.message);
  }
}
```

### Generate Login Link

```javascript
// GENERATE login link - EXACT METHOD SIGNATURE:
memberstackAdmin.generateLoginLink(params)

// REQUIRED params:
{
  memberId: string         // REQUIRED
}

// OPTIONAL params:
{
  redirectUrl?: string,    // URL to redirect after login
  expiresIn?: number      // Link expiry in seconds (default: 3600)
}

// RETURN VALUE:
// Promise<{ data: { url: string, expiresAt: string } }>

// COMPLETE EXAMPLE:
try {
  const { data } = await memberstackAdmin.generateLoginLink({
    memberId: 'mem_sb_123456',
    redirectUrl: '/dashboard',
    expiresIn: 7200 // 2 hours
  });

  console.log('Login link:', data.url);
  console.log('Expires at:', data.expiresAt);
  
  // Send link via email or other secure channel
} catch (error) {
  console.error('Failed to generate login link:', error.message);
}
```

### Revoke All Sessions

```javascript
// REVOKE all sessions - EXACT METHOD SIGNATURE:
memberstackAdmin.revokeAllSessions(params)

// REQUIRED params:
{
  memberId: string         // REQUIRED
}

// RETURN VALUE:
// Promise<void>

// COMPLETE EXAMPLE:
try {
  await memberstackAdmin.revokeAllSessions({
    memberId: 'mem_sb_123456'
  });

  console.log('All sessions revoked - member must login again');
} catch (error) {
  console.error('Failed to revoke sessions:', error.message);
}
```

## Webhook Management

### Webhook Event Structure

```javascript
// WEBHOOK payload structure
{
  id: string,              // Event ID
  type: string,            // Event type
  created: number,         // Unix timestamp
  data: {
    member?: Member,       // Member object (if applicable)
    previous?: object,     // Previous state (for updates)
    // Additional data based on event type
  }
}

// Event types:
// - member.created
// - member.updated
// - member.deleted
// - member.plan.added
// - member.plan.removed
// - member.payment.succeeded
// - member.payment.failed
```

### Verify Webhook Signature

```javascript
// VERIFY webhook - EXACT METHOD SIGNATURE:
memberstackAdmin.verifyWebhookSignature(params)

// REQUIRED params:
{
  payload: string | object, // REQUIRED - Raw body or parsed JSON
  signature: string,        // REQUIRED - From webhook header
  secret: string           // REQUIRED - Your webhook secret
}

// RETURN VALUE:
// boolean - true if valid, false if invalid

// COMPLETE EXAMPLE (Express.js):
app.post('/webhook/memberstack', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['memberstack-signature'];
  const secret = process.env.MEMBERSTACK_WEBHOOK_SECRET;

  try {
    const isValid = memberstackAdmin.verifyWebhookSignature({
      payload: req.body,
      signature: signature,
      secret: secret
    });

    if (!isValid) {
      return res.status(401).send('Invalid signature');
    }

    // Process webhook
    const event = JSON.parse(req.body);
    
    switch (event.type) {
      case 'member.created':
        await handleMemberCreated(event.data.member);
        break;
      case 'member.plan.added':
        await handlePlanAdded(event.data.member, event.data.plan);
        break;
      // Handle other events
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});
```

## Error Handling

### Error Structure

```javascript
// Admin API errors follow this structure:
{
  message: string,         // Human-readable message
  statusCode: number,      // HTTP status code
  code?: string,          // Memberstack error code
  details?: object        // Additional error details
}
```

### Common Error Codes

```javascript
// COMPLETE ERROR HANDLING:
try {
  const result = await memberstackAdmin.getMember(params);
} catch (error) {
  switch (error.code) {
    case 'member_not_found':
      console.error('Member does not exist');
      break;
    
    case 'email_already_exists':
      console.error('Email is already registered');
      break;
    
    case 'invalid_plan':
      console.error('Plan ID is invalid or inactive');
      break;
    
    case 'insufficient_permissions':
      console.error('API key lacks required permissions');
      break;
    
    case 'rate_limit_exceeded':
      console.error('Too many requests - back off');
      break;
    
    case 'invalid_token':
      console.error('Token is invalid or expired');
      break;
    
    default:
      console.error(`API error: ${error.message}`);
  }

  // HTTP status handling
  if (error.statusCode === 401) {
    // Invalid API key
  } else if (error.statusCode === 403) {
    // Forbidden - check permissions
  } else if (error.statusCode === 429) {
    // Rate limited - implement backoff
  } else if (error.statusCode >= 500) {
    // Server error - retry later
  }
}
```

## Common Patterns

### Bulk Operations

```javascript
// Pattern for bulk member updates
async function bulkUpdateMembers(updates) {
  const results = {
    successful: [],
    failed: []
  };

  // Process in batches to avoid rate limits
  const batchSize = 10;
  
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    const promises = batch.map(async ({ memberId, data }) => {
      try {
        const result = await memberstackAdmin.updateMember({
          memberId,
          ...data
        });
        results.successful.push({ memberId, result });
      } catch (error) {
        results.failed.push({ memberId, error: error.message });
      }
    });
    
    await Promise.all(promises);
    
    // Rate limit protection
    if (i + batchSize < updates.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

### Member Import Pattern

```javascript
// Pattern for importing members from another system
async function importMembers(externalUsers) {
  const imported = [];
  const errors = [];

  for (const user of externalUsers) {
    try {
      // Check if member already exists
      const { data: existing } = await memberstackAdmin.searchMembers({
        query: user.email,
        searchBy: 'email'
      });

      if (existing.members.length > 0) {
        // Update existing member
        const member = await memberstackAdmin.updateMember({
          memberId: existing.members[0].id,
          customFields: {
            ...user.customData,
            importedAt: new Date().toISOString()
          }
        });
        imported.push({ action: 'updated', member });
      } else {
        // Create new member
        const member = await memberstackAdmin.createMember({
          email: user.email,
          password: generateSecurePassword(),
          customFields: {
            ...user.customData,
            importedAt: new Date().toISOString()
          },
          plans: [{ planId: 'pln_imported' }],
          sendWelcomeEmail: true
        });
        imported.push({ action: 'created', member });
      }
    } catch (error) {
      errors.push({ user, error: error.message });
    }
  }

  return { imported, errors };
}
```

### Admin Dashboard Integration

```javascript
// Pattern for admin dashboard API endpoint
class MemberstackAdminAPI {
  constructor(adminClient) {
    this.admin = adminClient;
  }

  async getDashboardStats() {
    try {
      // Get total members
      const { data: allMembers } = await this.admin.getMembers({
        limit: 1 // Just need total count
      });

      // Get verified members
      const { data: verifiedMembers } = await this.admin.getMembers({
        limit: 1,
        filter: { verified: true }
      });

      // Get premium members
      const { data: premiumMembers } = await this.admin.getMembers({
        limit: 1,
        filter: { planId: 'pln_premium' }
      });

      return {
        totalMembers: allMembers.total,
        verifiedMembers: verifiedMembers.total,
        premiumMembers: premiumMembers.total,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  async getMemberDetails(memberId) {
    try {
      const { data: member } = await this.admin.getMember({ memberId });
      
      // Add computed fields
      return {
        ...member,
        computed: {
          totalPlans: member.planConnections?.length || 0,
          isPremium: member.planConnections?.some(p => p.planId === 'pln_premium'),
          daysSinceCreated: Math.floor(
            (Date.now() - new Date(member.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          )
        }
      };
    } catch (error) {
      throw error;
    }
  }
}
```

### Sync with External Systems

```javascript
// Pattern for syncing with CRM or other systems
class MemberstackSync {
  constructor(adminClient, externalAPI) {
    this.admin = adminClient;
    this.external = externalAPI;
  }

  async syncMemberToExternal(memberId) {
    try {
      // Get member from Memberstack
      const { data: member } = await this.admin.getMember({ memberId });

      // Transform data for external system
      const externalData = {
        email: member.auth.email,
        firstName: member.customFields.firstName,
        lastName: member.customFields.lastName,
        tags: member.planConnections.map(p => p.planId),
        metadata: {
          memberstackId: member.id,
          verified: member.verified,
          createdAt: member.createdAt
        }
      };

      // Create or update in external system
      const externalUser = await this.external.upsertUser(
        member.auth.email,
        externalData
      );

      // Store external ID in Memberstack
      await this.admin.updateMember({
        memberId: member.id,
        metadata: {
          ...member.metadata,
          externalId: externalUser.id,
          lastSynced: new Date().toISOString()
        }
      });

      return { success: true, externalId: externalUser.id };
    } catch (error) {
      console.error(`Sync failed for ${memberId}:`, error);
      throw error;
    }
  }

  async syncAllMembers() {
    let offset = 0;
    const limit = 100;
    const results = { synced: 0, failed: 0 };

    while (true) {
      const { data } = await this.admin.getMembers({ limit, offset });
      
      for (const member of data.members) {
        try {
          await this.syncMemberToExternal(member.id);
          results.synced++;
        } catch (error) {
          results.failed++;
        }
      }

      if (!data.hasMore) break;
      offset += limit;
      
      // Rate limit protection
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }
}
```

## Security Best Practices

### Secret Key Management

```javascript
// NEVER expose secret keys in client code
// NEVER commit secret keys to version control

// Good: Environment variables
const adminClient = MemberstackAdmin.init({
  secretKey: process.env.MEMBERSTACK_SECRET_KEY
});

// Bad: Hardcoded keys
// const adminClient = MemberstackAdmin.init({
//   secretKey: 'sk_sb_1234567890' // NEVER DO THIS
// });

// Validate environment
if (!process.env.MEMBERSTACK_SECRET_KEY) {
  throw new Error('MEMBERSTACK_SECRET_KEY environment variable is required');
}
```

### API Route Protection

```javascript
// Example: Next.js API route with authentication
export async function POST(request) {
  try {
    // Verify request authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify token with Memberstack
    const { data: member } = await memberstackAdmin.verifyToken({ token });
    
    // Check admin permissions
    if (!member.planConnections?.some(p => p.planId === 'pln_admin')) {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Proceed with admin operation
    const body = await request.json();
    const result = await performAdminOperation(body);
    
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Admin API error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Critical Notes for AI Assistants

1. **ALWAYS use exact method signatures** - Do not modify parameter names
2. **NEVER expose secret keys** - Admin API is server-side only
3. **ALWAYS handle errors** - Use try/catch for all operations
4. **DISTINGUISH Admin vs DOM API** - Admin is server-side, DOM is client-side
5. **RATE LIMITS apply** - Implement backoff for bulk operations
6. **VERIFY webhooks** - Always validate webhook signatures
7. **PAGINATE large datasets** - Use limit/offset for getMembers
8. **TEST MODE has separate data** - Test and live modes are isolated

### Common Mistakes to Avoid

- ❌ Using Admin API in browser/client code
- ✅ Admin API only in server/backend code
- ❌ Hardcoding secret keys
- ✅ Using environment variables
- ❌ Not handling pagination
- ✅ Implementing proper pagination logic
- ❌ Ignoring rate limits
- ✅ Adding delays between bulk operations
- ❌ Trusting webhook data without verification
- ✅ Always verify webhook signatures

This reference covers the essential Memberstack Admin API functionality. Note that some methods and parameters shown are templates based on common patterns - always refer to official documentation for the exact API specifications available in your version.