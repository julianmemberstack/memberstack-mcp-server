# Memberstack DOM Package - AI Assistant Reference Guide

**PACKAGE:** @memberstack/dom  
**VERSION:** 1.9.40
**CRITICAL:** This is the ONLY authoritative source for Memberstack DOM package. Do not use patterns from older versions or other libraries.

## Quick Reference Index
- [Method Signatures Quick Lookup](#method-signatures-quick-lookup)
- [Decision Trees](#decision-trees)
- [Error Codes Reference](#error-codes-reference)
- [Installation & Setup](#installation--setup)
- [Authentication Methods](#authentication-methods)
- [Profile Management](#profile-management)
- [Plan Management](#plan-management)
- [Pre-built Modals](#pre-built-modals)
- [Session Management](#session-management)
- [Common Patterns](#common-patterns)
- [Framework-Specific Implementation](#framework-specific-implementation)
- [Type Definitions](#type-definitions)
- [Common Gotchas & Important Notes](#common-gotchas--important-notes)

## Method Signatures Quick Lookup

### Authentication Methods
| Method | Purpose | Required Params | Returns | Notes |
|--------|---------|----------------|---------|-------|
| `signupMemberEmailPassword()` | Email/password signup | email, password | `Promise<{data: {member, tokens}}>` | Use plans: [{planId}] format |
| `loginMemberEmailPassword()` | Email/password login | email, password | `Promise<{data: {member, tokens}}>` | - |
| `signupWithProvider()` | Social signup | provider | Redirects immediately | No code after executes |
| `loginWithProvider()` | Social login | provider | Redirects immediately | No code after executes |
| `sendMemberSignupPasswordlessEmail()` | Send signup magic link | email | `Promise<void>` | - |
| `sendMemberLoginPasswordlessEmail()` | Send login magic link | email | `Promise<void>` | - |
| `signupMemberPasswordless()` | Complete passwordless signup | email, passwordlessToken | `Promise<{data: {member, tokens}}>` | Token from email |
| `loginMemberPasswordless()` | Complete passwordless login | email, passwordlessToken | `Promise<{data: {member, tokens}}>` | Token from email |
| `logout()` | Logout user | - | `Promise<void>` | - |
| `onAuthChange()` | Listen for auth changes | callback | `{unsubscribe: () => void}` | Always unsubscribe |
| `getMemberToken()` | Get auth token | - | `string \| null` | For API requests |
| `sendMemberVerificationEmail()` | Send verification email | - | `Promise<void>` | - |

### Profile Management
| Method | Purpose | Required Params | Returns | Notes |
|--------|---------|----------------|---------|-------|
| `getCurrentMember()` | Get logged in member | - | `Promise<{data: Member \| null}>` | Check if null |
| `updateMember()` | Update custom fields | customFields | `Promise<{data: Member}>` | - |
| `updateMemberAuth()` | Update email/password | email or passwords | `Promise<{data: Member}>` | - |
| `updateMemberJSON()` | Store JSON data | json | `Promise<{data: object}>` | - |
| `getMemberJSON()` | Get JSON data | - | `Promise<object>` | Returns JSON directly |
| `sendMemberResetPasswordEmail()` | Send reset email | email | `Promise<void>` | - |
| `resetMemberPassword()` | Reset password | token, newPassword | `Promise<void>` | - |
| `setPassword()` | Set password for passwordless | password | `Promise<{data: Member}>` | - |
| `connectProvider()` | Connect social account | provider | Redirects immediately | - |
| `disconnectProvider()` | Disconnect social account | provider | `Promise<{data: {providers}}>` | - |
| `deleteMember()` | Delete member account | - | `Promise<void>` | Permanent |

### Plan Management
| Method | Purpose | Required Params | Returns | Notes |
|--------|---------|----------------|---------|-------|
| `getPlan()` | Get single plan | planId | `Promise<{data: Plan}>` | - |
| `getPlans()` | Get all plans | - | `Promise<{data: Plan[]}>` | - |
| `addPlan()` | Add free plan | planId | `Promise<{data: Member}>` | Free plans only |
| `removePlan()` | Remove plan | planId | `Promise<{data: Member}>` | - |
| `purchasePlansWithCheckout()` | Start Stripe checkout | priceId | `Promise<{data: {url}}>` | Use Price ID not Plan ID |
| `launchStripeCustomerPortal()` | Open billing portal | - | `Promise<{data: {url}}>` | - |

### Modal Management
| Method | Purpose | Required Params | Returns | Notes |
|--------|---------|----------------|---------|-------|
| `openModal()` | Open pre-built modal | type | `Promise<result>` | Types: LOGIN, SIGNUP, etc |
| `hideModal()` | Close modal | - | `Promise<void>` | Must call manually |

## Decision Trees

### Authentication Method Selection
```
Need to authenticate user?
├─ New user registration?
│  ├─ Email/Password?
│  │  └─ signupMemberEmailPassword({ email, password, plans: [{planId}] })
│  ├─ Social provider (Google/Facebook/etc)?
│  │  └─ signupWithProvider({ provider, plans: [{planId}] }) // Redirects
│  ├─ Passwordless (magic link)?
│  │  ├─ sendMemberSignupPasswordlessEmail({ email })
│  │  └─ signupMemberPasswordless({ email, passwordlessToken })
│  └─ Pre-built UI?
│     └─ openModal("SIGNUP", { signup: { plans: ["planId"] } })
│
└─ Existing user login?
   ├─ Email/Password?
   │  └─ loginMemberEmailPassword({ email, password })
   ├─ Social provider?
   │  └─ loginWithProvider({ provider }) // Redirects
   ├─ Passwordless (magic link)?
   │  ├─ sendMemberLoginPasswordlessEmail({ email })
   │  └─ loginMemberPasswordless({ email, passwordlessToken })
   └─ Pre-built UI?
      └─ openModal("LOGIN")
```

### Plan Management Decision Tree
```
Managing user plans?
├─ Check current plans?
│  └─ getCurrentMember() → check member.planConnections[]
│
├─ Browse available plans?
│  ├─ Single plan details → getPlan({ planId })
│  └─ All plans → getPlans()
│
├─ Free plan?
│  ├─ Add to user → addPlan({ planId: "pln_..." })
│  └─ Remove from user → removePlan({ planId: "pln_..." })
│
└─ Paid plan (Stripe)?
   ├─ New purchase → purchasePlansWithCheckout({ priceId: "prc_..." })
   └─ Manage billing → launchStripeCustomerPortal()
```

### Profile Update Decision Tree
```
Updating member data?
├─ Custom fields (name, preferences, etc)?
│  └─ updateMember({ customFields: { field: value } })
│
├─ Authentication details?
│  ├─ Email only → updateMemberAuth({ email })
│  └─ Password → updateMemberAuth({ oldPassword, newPassword })
│
├─ Complex JSON data?
│  ├─ Store → updateMemberJSON({ json: object })
│  └─ Retrieve → getMemberJSON()
│
├─ Social accounts?
│  ├─ Connect → connectProvider({ provider }) // Redirects
│  └─ Disconnect → disconnectProvider({ provider })
│
└─ Password management?
   ├─ Forgot password → sendMemberResetPasswordEmail({ email })
   ├─ Reset with token → resetMemberPassword({ token, newPassword })
   └─ Set initial password → setPassword({ password })
```

## Error Codes Reference

| Error Code | Description | Common Cause | Solution |
|------------|-------------|--------------|----------|
| `invalid_credentials` | Wrong email/password | User entered incorrect credentials | Show "Invalid email or password" |
| `email_not_verified` | Email needs verification | User hasn't clicked verification link | Prompt to check email or resend |
| `member_not_found` | No account exists | Email not registered | Suggest signup instead |
| `email_already_exists` | Email already registered | Duplicate signup attempt | Suggest login instead |
| `weak_password` | Password too simple | Doesn't meet requirements | Show password requirements |
| `invalid_email` | Invalid email format | Malformed email address | Validate email format |
| `too_many_requests` | Rate limit hit | Too many attempts | Show cooldown message |
| `invalid_token` | Bad/expired token | Token expired or invalid | Request new token |
| `unauthorized` | Not authenticated | No valid session | Redirect to login |
| `forbidden` | Insufficient permissions | Lacks required plan/access | Show upgrade prompt |

## Installation & Setup

### Installation

```bash
# Install via npm
npm install @memberstack/dom

# OR install via yarn
yarn add @memberstack/dom
```

### Basic Import & Initialization

```javascript
// Import the package
import memberstackDOM from '@memberstack/dom';

// Initialize Memberstack (REQUIRED)
const memberstack = memberstackDOM.init({
	publicKey: 'pk_your_public_key_here', // REQUIRED
	// Optional configuration:
	useCookies: true, // Enable cookie-based auth (default: false)
	setCookieOnRootDomain: true, // Set cookies on root domain (only if useCookies: true)
	sessionDurationDays: 30, // Session length before re-auth (default: 7)
	domain: 'your-custom-domain.com' // Custom API domain
});
```

### Framework Integration

#### React

```javascript
import { useEffect, useState } from 'react';
import memberstackDOM from '@memberstack/dom';

function App() {
	const [memberstack, setMemberstack] = useState(null);

	useEffect(() => {
		const ms = memberstackDOM.init({
			publicKey: 'pk_your_public_key_here',
			useCookies: true
		});
		setMemberstack(ms);

		return () => {
			// Cleanup if needed
		};
	}, []);

	return <div>Your app content</div>;
}
```

#### Vue

```javascript
<script setup>
import { onMounted } from 'vue'
import memberstackDOM from "@memberstack/dom"

let memberstack;

onMounted(() => {
  memberstack = memberstackDOM.init({
    publicKey: "pk_your_public_key_here",
    useCookies: true
  });
});
</script>

<template>
  <div>Your app content</div>
</template>
```

#### Svelte

```javascript
<script>
  import { onMount } from 'svelte';
  import memberstackDOM from "@memberstack/dom";

  let memberstack;

  onMount(() => {
    memberstack = memberstackDOM.init({
      publicKey: "pk_your_public_key_here",
      useCookies: true
    });
  });
</script>

<slot />
```

**⚠️ CRITICAL:** Always check if user is logged in before calling member-specific methods:

```javascript
// ALWAYS do this check first
const { data: member } = await memberstack.getCurrentMember();
if (!member) {
	// User is not logged in - redirect to login or show auth modal
	return;
}
```

## Authentication Methods

### Method Signatures (EXACT - Do Not Modify)

#### Email/Password Signup

```javascript
// EXACT METHOD SIGNATURE:
memberstack.signupMemberEmailPassword(params, options?)

// REQUIRED params:
{
  email: string,           // REQUIRED
  password: string         // REQUIRED
}

// OPTIONAL params (add to above object):
{
  customFields?: object,   // Custom fields object
  metaData?: object,       // Additional metadata
  plans?: Array<{ planId: string }>, // CRITICAL: Array of objects for signup methods
  captchaToken?: string,   // CAPTCHA token
  inviteToken?: string     // Invite token for restricted signup
}

// RETURN VALUE:
// Promise<{ data: { member: Member, tokens: { accessToken: string } } }>

// COMPLETE EXAMPLE:
try {
  const result = await memberstack.signupMemberEmailPassword({
    email: "user@example.com",
    password: "securePassword123",
    customFields: {
      firstName: "John",
      lastName: "Doe"
    },
    plans: [{ planId: "pln_free-plan-id" }] // CRITICAL: Array of objects
  });
  console.log("Signup successful:", result.data.member);
  console.log("Access token:", result.data.tokens.accessToken);
} catch (error) {
  console.error("Signup failed:", error.message);
}
```

#### Email/Password Login

```javascript
// EXACT METHOD SIGNATURE:
memberstack.loginMemberEmailPassword(params, options?)

// REQUIRED params:
{
  email: string,           // REQUIRED
  password: string         // REQUIRED
}

// RETURN VALUE:
// Promise<{ data: { member: Member, tokens: { accessToken: string } } }>

// COMPLETE EXAMPLE:
try {
  const result = await memberstack.loginMemberEmailPassword({
    email: "user@example.com",
    password: "userPassword"
  });
  console.log("Login successful:", result.data.member);
} catch (error) {
  console.error("Login failed:", error.message);
}
```

#### Logout

```javascript
// EXACT METHOD SIGNATURE:
memberstack.logout(options?)

// RETURN VALUE: Promise<void>

// COMPLETE EXAMPLE:
try {
  await memberstack.logout();
  console.log("Logout successful");
  // Redirect to login page or update UI
} catch (error) {
  console.error("Logout failed:", error.message);
}
```

#### Social Provider Authentication

```javascript
// SIGNUP with provider - EXACT METHOD SIGNATURE:
memberstack.signupWithProvider(params)

// REQUIRED params:
{
  provider: string         // REQUIRED: "google", "facebook", "github", etc.
}

// OPTIONAL params (add to above object):
{
  customFields?: object,   // Custom fields
  plans?: Array<{ planId: string }>, // Array of objects with plan IDs
  allowLogin?: boolean     // Allow existing users to login instead
}

// LOGIN with provider - EXACT METHOD SIGNATURE:
memberstack.loginWithProvider(params)

// REQUIRED params:
{
  provider: string         // REQUIRED: "google", "facebook", "github", etc.
}

// OPTIONAL params:
{
  allowSignup?: boolean    // Allow new users to signup
}

// IMPORTANT: Both methods immediately redirect to the provider's auth page

// COMPLETE EXAMPLES:
try {
  // Signup with Google (will redirect immediately)
  await memberstack.signupWithProvider({
    provider: "google",
    allowLogin: true,
    plans: [{ planId: "pln_free-plan-id" }]
  });
  // Code after this will not execute due to redirect
} catch (error) {
  console.error("Provider signup failed:", error.message);
}

try {
  // Login with Google (will redirect immediately)
  await memberstack.loginWithProvider({
    provider: "google",
    allowSignup: true
  });
  // Code after this will not execute due to redirect
} catch (error) {
  console.error("Provider login failed:", error.message);
}
```

#### Passwordless (Magic Link) Authentication

```javascript
// SEND passwordless signup email - EXACT METHOD SIGNATURE:
memberstack.sendMemberSignupPasswordlessEmail(params, options?)

// SEND passwordless login email - EXACT METHOD SIGNATURE:
memberstack.sendMemberLoginPasswordlessEmail(params, options?)

// REQUIRED params for both:
{
  email: string            // REQUIRED
}

// COMPLETE passwordless login with token - EXACT METHOD SIGNATURE:
memberstack.loginMemberPasswordless(params, options?)

// COMPLETE passwordless signup with token - EXACT METHOD SIGNATURE:
memberstack.signupMemberPasswordless(params, options?)

// REQUIRED params for both:
{
  email: string,           // REQUIRED
  passwordlessToken: string // REQUIRED - from email link
}

// OPTIONAL params for signup:
{
  customFields?: object,   // Custom fields
  metaData?: object,       // Additional metadata
  plans?: Array<{ planId: string }> // Array of objects with plan IDs
}

// COMPLETE EXAMPLES:
try {
  // Send magic link for login
  await memberstack.sendMemberLoginPasswordlessEmail({
    email: "user@example.com"
  });
  console.log("Magic link sent");
} catch (error) {
  console.error("Failed to send magic link:", error.message);
}

try {
  // Complete login with token (from email link)
  const result = await memberstack.loginMemberPasswordless({
    email: "user@example.com",
    passwordlessToken: "token_from_email_link"
  });
  console.log("Passwordless login successful:", result.data.member);
} catch (error) {
  console.error("Passwordless login failed:", error.message);
}
```

#### Auth State Management

```javascript
// LISTEN for auth changes - EXACT METHOD SIGNATURE:
memberstack.onAuthChange(callback)

// callback signature:
(member: Member | null) => void

// RETURNS: { unsubscribe: () => void }

// COMPLETE EXAMPLE:
const authListener = memberstack.onAuthChange((member) => {
  if (member) {
    console.log("User logged in:", member);
    // Update UI for logged in state
  } else {
    console.log("User logged out");
    // Update UI for logged out state
  }
});

// CRITICAL: Always unsubscribe when component unmounts
authListener.unsubscribe();
```

#### Get Auth Token

```javascript
// GET current member token - EXACT METHOD SIGNATURE:
memberstack.getMemberToken();

// Returns: string | null

// COMPLETE EXAMPLE:
const token = memberstack.getMemberToken();
if (token) {
	console.log('Auth token:', token);
	// Use token for authenticated API requests
} else {
	console.log('No auth token - user not logged in');
}
```

#### Email Verification

```javascript
// SEND verification email - EXACT METHOD SIGNATURE:
memberstack.sendMemberVerificationEmail(options?)

// RETURN VALUE: Promise<void>

// COMPLETE EXAMPLE:
try {
  await memberstack.sendMemberVerificationEmail();
  console.log("Verification email sent");
} catch (error) {
  console.error("Failed to send verification email:", error.message);
}
```

## Profile Management

### Get Current Member

```javascript
// EXACT METHOD SIGNATURE:
memberstack.getCurrentMember(options?)

// OPTIONAL options:
{
  useCache?: boolean       // Default: false - set true to use cached data
}

// RETURN VALUE:
// Promise<{ data: Member | null }>

// COMPLETE EXAMPLE:
try {
  const { data: member } = await memberstack.getCurrentMember();
  if (member) {
    console.log("Current member:", member);
    console.log("Email:", member.auth.email);           // CRITICAL: .auth.email
    console.log("Plans:", member.planConnections);      // CRITICAL: .planConnections
    console.log("Custom fields:", member.customFields);
    console.log("Verified:", member.verified);
  } else {
    console.log("No member logged in");
  }
} catch (error) {
  console.error("Failed to get member:", error.message);
}
```

### Update Member Profile

```javascript
// UPDATE custom fields - EXACT METHOD SIGNATURE:
memberstack.updateMember(params, options?)

// REQUIRED params:
{
  customFields: object     // REQUIRED - object with custom field updates
}

// RETURN VALUE: Promise<{ data: Member }>

// UPDATE auth (email/password) - EXACT METHOD SIGNATURE:
memberstack.updateMemberAuth(params, options?)

// OPTIONAL params (at least one required):
{
  email?: string,          // New email
  oldPassword?: string,    // Current password (required only if changing password)
  newPassword?: string     // New password
}

// RETURN VALUE: Promise<{ data: Member }>

// COMPLETE EXAMPLES:
try {
  // Update custom fields
  const result = await memberstack.updateMember({
    customFields: {
      firstName: "Jane",
      lastName: "Smith",
      company: "Acme Corp"
    }
  });
  console.log("Profile updated:", result.data);
} catch (error) {
  console.error("Profile update failed:", error.message);
}

try {
  // Update email (no password required)
  const result = await memberstack.updateMemberAuth({
    email: "newemail@example.com"
  });
  console.log("Email updated:", result.data);
} catch (error) {
  console.error("Email update failed:", error.message);
}

try {
  // Update password
  const result = await memberstack.updateMemberAuth({
    oldPassword: "currentPassword",
    newPassword: "newSecurePassword"
  });
  console.log("Password updated:", result.data);
} catch (error) {
  console.error("Password update failed:", error.message);
}
```

### JSON Data Storage

```javascript
// UPDATE member JSON - EXACT METHOD SIGNATURE:
memberstack.updateMemberJSON(params, options?)

// REQUIRED params:
{
  json: object             // REQUIRED - any JSON object
}

// RETURN VALUE: Promise<{ data: object }>

// GET member JSON - EXACT METHOD SIGNATURE:
memberstack.getMemberJSON(options?)

// RETURN VALUE: Promise<object> (returns JSON data directly, not wrapped)

// COMPLETE EXAMPLES:
try {
  // Store JSON data
  await memberstack.updateMemberJSON({
    json: {
      preferences: {
        theme: "dark",
        language: "en",
        notifications: true
      },
      settings: {
        autoSave: true
      }
    }
  });
  console.log("JSON updated");
} catch (error) {
  console.error("JSON update failed:", error.message);
}

try {
  // Retrieve JSON data
  const memberJson = await memberstack.getMemberJSON();
  console.log("Member JSON:", memberJson); // Direct access to JSON data
} catch (error) {
  console.error("Failed to get JSON:", error.message);
}
```

### Password Reset

```javascript
// SEND password reset email - EXACT METHOD SIGNATURE:
memberstack.sendMemberResetPasswordEmail(params)

// REQUIRED params:
{
  email: string            // REQUIRED
}

// RETURN VALUE: Promise<void>

// RESET password with token - EXACT METHOD SIGNATURE:
memberstack.resetMemberPassword(params)

// REQUIRED params:
{
  token: string,           // REQUIRED - from reset email
  newPassword: string      // REQUIRED - new password
}

// RETURN VALUE: Promise<void>

// SET password (for passwordless members) - EXACT METHOD SIGNATURE:
memberstack.setPassword(params, options?)

// REQUIRED params:
{
  password: string         // REQUIRED - new password
}

// RETURN VALUE: Promise<{ data: Member }>

// COMPLETE EXAMPLES:
try {
  // Send reset email
  await memberstack.sendMemberResetPasswordEmail({
    email: "user@example.com"
  });
  console.log("Reset email sent");
} catch (error) {
  console.error("Failed to send reset email:", error.message);
}

try {
  // Reset password with token
  await memberstack.resetMemberPassword({
    token: "reset_token_from_email",
    newPassword: "newSecurePassword123"
  });
  console.log("Password reset successful");
} catch (error) {
  console.error("Password reset failed:", error.message);
}
```

### Provider Management

```javascript
// CONNECT provider - EXACT METHOD SIGNATURE:
memberstack.connectProvider(params);

// DISCONNECT provider - EXACT METHOD SIGNATURE:
memberstack.disconnectProvider(params);

// REQUIRED params for both:
{
	provider: string; // REQUIRED: "google", "facebook", "github", etc.
}

// RETURN VALUE for disconnect: Promise<{ data: { providers: Array } }>

// COMPLETE EXAMPLES:
try {
	// Connect Google account (will redirect)
	await memberstack.connectProvider({
		provider: 'google'
	});
	// Code after this will not execute due to redirect
} catch (error) {
	console.error('Failed to connect provider:', error.message);
}

try {
	// Disconnect Google account
	const result = await memberstack.disconnectProvider({
		provider: 'google'
	});
	console.log('Remaining providers:', result.data.providers);
} catch (error) {
	console.error('Failed to disconnect provider:', error.message);
}
```

### Delete Member

```javascript
// DELETE member - EXACT METHOD SIGNATURE:
memberstack.deleteMember(options?)

// RETURN VALUE: Promise<void>

// COMPLETE EXAMPLE:
try {
  await memberstack.deleteMember();
  console.log("Member account deleted");
  // Redirect to home page or show confirmation
} catch (error) {
  console.error("Failed to delete member:", error.message);
}
```

## Plan Management

### Get Plans

```javascript
// GET single plan - EXACT METHOD SIGNATURE:
memberstack.getPlan(params);

// REQUIRED params:
{
	planId: string; // REQUIRED
}

// RETURN VALUE: Promise<{ data: Plan }>

// GET all plans - EXACT METHOD SIGNATURE:
memberstack.getPlans();

// RETURN VALUE: Promise<{ data: Plan[] }>

// COMPLETE EXAMPLES:
try {
	// Get specific plan
	const { data: plan } = await memberstack.getPlan({
		planId: 'pln_plan-id-here'
	});
	console.log('Plan details:', plan);
} catch (error) {
	console.error('Failed to get plan:', error.message);
}

try {
	// Get all plans
	const { data: plans } = await memberstack.getPlans();
	console.log('All plans:', plans);
} catch (error) {
	console.error('Failed to get plans:', error.message);
}
```

### Manage Member Plans

```javascript
// ADD plan to member - EXACT METHOD SIGNATURE:
memberstack.addPlan(params, options?)

// REQUIRED params:
{
  planId: string           // REQUIRED - Plan ID for free plans
}

// RETURN VALUE: Promise<{ data: Member }>

// REMOVE plan from member - EXACT METHOD SIGNATURE:
memberstack.removePlan(params, options?)

// REQUIRED params:
{
  planId: string           // REQUIRED
}

// RETURN VALUE: Promise<{ data: Member }>

// COMPLETE EXAMPLES:
try {
  // Add free plan to current member
  const result = await memberstack.addPlan({
    planId: "pln_free-plan-id"
  });
  console.log("Plan added successfully:", result.data);
} catch (error) {
  console.error("Failed to add plan:", error.message);
}

try {
  // Remove plan from current member
  const result = await memberstack.removePlan({
    planId: "pln_plan-id-here"
  });
  console.log("Plan removed successfully:", result.data);
} catch (error) {
  console.error("Failed to remove plan:", error.message);
}
```

### Stripe Integration

```javascript
// PURCHASE with Stripe Checkout - EXACT METHOD SIGNATURE:
memberstack.purchasePlansWithCheckout(params, options?)

// REQUIRED params:
{
  priceId: string          // REQUIRED - Stripe Price ID (starts with "prc_")
}

// OPTIONAL params (add to above object):
{
  couponId?: string,       // Stripe Coupon ID
  cancelUrl?: string,      // Redirect URL on cancel
  successUrl?: string,     // Redirect URL on success
  autoRedirect?: boolean,  // Auto redirect to Stripe (default: true)
  metadataForCheckout?: object // Additional metadata
}

// RETURN VALUE: Promise<{ data: { url: string } }>

// STRIPE Customer Portal - EXACT METHOD SIGNATURE:
memberstack.launchStripeCustomerPortal(params?, options?)

// OPTIONAL params:
{
  priceIds?: string[],     // Array of Price IDs to show
  configuration?: object,  // Portal configuration
  returnUrl?: string,      // Return URL from portal
  autoRedirect?: boolean   // Auto redirect (default: true)
}

// RETURN VALUE: Promise<{ data: { url: string } }>

// COMPLETE EXAMPLES:
try {
  // Start Stripe Checkout for paid plan
  const { data } = await memberstack.purchasePlansWithCheckout({
    priceId: "prc_stripe-price-id", // Use Price ID, not Plan ID
    successUrl: "https://yoursite.com/success",
    cancelUrl: "https://yoursite.com/cancel",
    autoRedirect: false // Set to false to get URL without redirect
  });
  console.log("Checkout URL:", data.url);
  // Manually redirect if autoRedirect: false
  window.location.href = data.url;
} catch (error) {
  console.error("Checkout failed:", error.message);
}

try {
  // Launch Customer Portal
  const { data } = await memberstack.launchStripeCustomerPortal({
    returnUrl: "https://yoursite.com/dashboard",
    autoRedirect: false
  });
  console.log("Portal URL:", data.url);
  // Manually redirect if autoRedirect: false
  window.location.href = data.url;
} catch (error) {
  console.error("Portal launch failed:", error.message);
}
```

**CRITICAL NOTES:**

- Free plans use **Plan IDs** (starts with "pln\_")
- Paid plans use **Price IDs** (starts with "prc\_")
- Test mode has separate IDs from live mode
- Get these IDs from your Memberstack dashboard

## Pre-built Modals

### Available Modal Types

```javascript
// EXACT MODAL TYPES (use exact strings):
'LOGIN'; // Login modal
'SIGNUP'; // Signup modal
'FORGOT_PASSWORD'; // Forgot password modal
'RESET_PASSWORD'; // Reset password modal
'PROFILE'; // Profile management modal
```

### Open & Close Modals

```javascript
// OPEN modal - EXACT METHOD SIGNATURE:
memberstack.openModal(type, params?)

// CLOSE modal - EXACT METHOD SIGNATURE:
memberstack.hideModal()

// CRITICAL: Modal parameters use different structure than signup methods!

// COMPLETE EXAMPLES:
try {
  // Open login modal
  await memberstack.openModal("LOGIN");
} catch (error) {
  console.error("Failed to open login modal:", error.message);
}

try {
  // Open login modal with signup option
  await memberstack.openModal("LOGIN", {
    signup: {
      plans: ["pln_free-plan-id"] // Array of strings (not objects!) inside signup object
    }
  });
} catch (error) {
  console.error("Failed to open login modal:", error.message);
}

try {
  // Open signup modal
  await memberstack.openModal("SIGNUP", {
    signup: {
      plans: ["pln_free-plan-id"] // Array of strings (not objects!) inside signup object
    }
  });
} catch (error) {
  console.error("Failed to open signup modal:", error.message);
}

try {
  // Open profile modal
  await memberstack.openModal("PROFILE");
} catch (error) {
  console.error("Failed to open profile modal:", error.message);
}

try {
  // Close any open modal
  await memberstack.hideModal();
} catch (error) {
  console.error("Failed to close modal:", error.message);
}
```

### Modal Behavior

```javascript
// IMPORTANT: Modals do NOT close automatically
// You must explicitly call hideModal() after successful operations

async function handleLoginModal() {
	try {
		// Open the login modal
		const result = await memberstack.openModal('LOGIN');

		// Modal promise resolves when login is successful
		console.log('Login successful:', result);

		// CRITICAL: Manually close the modal
		await memberstack.hideModal();

		// Redirect or update UI
		window.location.href = '/dashboard';
	} catch (error) {
		console.error('Login modal failed:', error.message);
	}
}
```

## Session Management

### Configuration Options

```javascript
// Session configuration during initialization
const memberstack = memberstackDOM.init({
	publicKey: 'pk_...',
	useCookies: true, // Use cookies instead of localStorage
	setCookieOnRootDomain: true, // Only if useCookies: true
	sessionDurationDays: 30 // Days before re-auth required (default: 7)
});
```

### Session Monitoring

```javascript
// Set up authentication listener
const authListener = memberstack.onAuthChange((member) => {
	if (member) {
		console.log('User session active:', member.auth.email);
		updateUIForLoggedIn(member);
	} else {
		console.log('User session ended');
		updateUIForLoggedOut();
	}
});

// CRITICAL: Always unsubscribe when done
// Store unsubscribe function for cleanup
window.memberstackUnsubscribe = authListener;

// Clean up when component unmounts
if (window.memberstackUnsubscribe) {
	window.memberstackUnsubscribe.unsubscribe();
	window.memberstackUnsubscribe = null;
}
```

## Error Handling

### Standard Error Structure

```javascript
// ALL Memberstack errors have this structure:
{
  message: string,         // Human-readable error message
  statusCode?: number,     // HTTP status code (400, 401, 403, 404, etc.)
  code?: string,          // Memberstack-specific error code
  details?: any           // Additional error details
}
```

### Common Error Codes & Handling

```javascript
// COMPLETE ERROR HANDLING EXAMPLE:
try {
	const result = await memberstack.loginMemberEmailPassword({
		email: 'user@example.com',
		password: 'wrongpassword'
	});
} catch (error) {
	console.error('Login error:', error);

	// Handle specific error codes
	switch (error.code) {
		case 'invalid_credentials':
			alert('Invalid email or password');
			break;
		case 'email_not_verified':
			alert('Please verify your email before logging in');
			break;
		case 'member_not_found':
			alert('No account found with this email');
			break;
		case 'too_many_requests':
			alert('Too many login attempts. Please try again later');
			break;
		case 'weak_password':
			alert('Password is too weak. Please choose a stronger password.');
			break;
		case 'email_already_exists':
			alert('An account with this email already exists. Please try logging in.');
			break;
		case 'invalid_email':
			alert('Please enter a valid email address.');
			break;
		default:
			alert(`Login failed: ${error.message}`);
	}

	// Handle HTTP status codes
	if (error.statusCode === 401) {
		console.log('Unauthorized - redirect to login');
	} else if (error.statusCode === 403) {
		console.log('Forbidden - insufficient permissions');
	} else if (error.statusCode >= 500) {
		console.log('Server error - try again later');
	}
}
```

## Common Patterns

### Check Authentication Status

```javascript
// PATTERN: Check if user is logged in
async function checkAuthStatus() {
	try {
		const { data: member } = await memberstack.getCurrentMember();
		if (member) {
			console.log('User is logged in:', member.auth.email);
			return member;
		} else {
			console.log('User is not logged in');
			return null;
		}
	} catch (error) {
		console.error('Error checking auth:', error.message);
		return null;
	}
}

// PATTERN: Redirect if not authenticated
async function requireAuth() {
	const member = await checkAuthStatus();
	if (!member) {
		window.location.href = '/login';
		return false;
	}
	return true;
}
```

### Plan-Based Content Access

```javascript
// PATTERN: Check if user has specific plan
async function checkPlanAccess(requiredPlanId) {
	try {
		const { data: member } = await memberstack.getCurrentMember();

		if (!member) {
			console.log('User not logged in');
			return false;
		}

		// Check planConnections array for the required plan
		const hasPlan = member.planConnections?.some(
			(connection) => connection.planId === requiredPlanId && connection.active
		);

		if (hasPlan) {
			console.log('User has required plan');
			return true;
		} else {
			console.log('User does not have required plan');
			return false;
		}
	} catch (error) {
		console.error('Error checking plan access:', error.message);
		return false;
	}
}
```

### Complete Authentication Flow

```javascript
// PATTERN: Complete signup flow with error handling
async function completeSignupFlow(email, password, customFields = {}) {
	try {
		// 1. Sign up the user
		console.log('Signing up user...');
		const { data } = await memberstack.signupMemberEmailPassword({
			email: email,
			password: password,
			customFields: customFields,
			plans: [{ planId: 'pln_free-plan-id' }] // Array of objects for signup
		});

		console.log('Signup successful:', data.member);

		// 2. Send verification email (optional)
		try {
			await memberstack.sendMemberVerificationEmail();
			console.log('Verification email sent');
		} catch (emailError) {
			console.log('Note: Verification email failed to send:', emailError.message);
			// Don't fail the whole flow if email fails
		}

		// 3. Redirect to dashboard or welcome page
		window.location.href = '/dashboard';
	} catch (error) {
		console.error('Signup flow failed:', error);

		// Handle specific signup errors
		if (error.code === 'email_already_exists') {
			alert('An account with this email already exists. Please try logging in.');
		} else if (error.code === 'weak_password') {
			alert('Password is too weak. Please choose a stronger password.');
		} else if (error.code === 'invalid_email') {
			alert('Please enter a valid email address.');
		} else {
			alert(`Signup failed: ${error.message}`);
		}
	}
}
```

## Framework-Specific Implementation

### SvelteKit

```javascript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import memberstackDOM from '@memberstack/dom';

const memberstack = memberstackDOM.init({
  publicKey: import.meta.env.VITE_MEMBERSTACK_PUBLIC_KEY
});

export const handle: Handle = async ({ event, resolve }) => {
  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];

  if (protectedRoutes.some(route => event.url.pathname.startsWith(route))) {
    try {
      const { data: member } = await memberstack.getCurrentMember();

      if (!member) {
        return new Response(null, {
          status: 302,
          headers: { location: '/login' }
        });
      }

      event.locals.member = member;
    } catch (error) {
      console.error('Auth check failed:', error);
      return new Response(null, {
        status: 302,
        headers: { location: '/login' }
      });
    }
  }

  return resolve(event);
};

// src/app.d.ts (TypeScript)
declare global {
  namespace App {
    interface Locals {
      member?: Member;
    }
  }
}
```

### Next.js (App Router)

```javascript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import memberstackDOM from '@memberstack/dom';

const memberstack = memberstackDOM.init({
  publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_KEY!
});

export async function middleware(request: NextRequest) {
  const protectedRoutes = ['/dashboard', '/profile'];

  if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    try {
      const { data: member } = await memberstack.getCurrentMember();
      if (!member) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*']
};
```

### Next.js (Pages Router)

```javascript
// pages/dashboard.tsx
import { GetServerSideProps } from 'next';
import memberstackDOM from '@memberstack/dom';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const memberstack = memberstackDOM.init({
    publicKey: process.env.NEXT_PUBLIC_MEMBERSTACK_KEY!
  });

  try {
    const { data: member } = await memberstack.getCurrentMember();

    if (!member) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // CRITICAL: Serialize member data
    return {
      props: {
        member: JSON.parse(JSON.stringify(member))
      }
    };
  } catch (error) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};
```

### Vue/Nuxt

```javascript
// middleware/auth.js
export default defineNuxtRouteMiddleware(async (to, from) => {
	const memberstack = useMemberstack();

	try {
		const { data: member } = await memberstack.getCurrentMember();
		if (!member) {
			return navigateTo('/login');
		}
	} catch (error) {
		return navigateTo('/login');
	}
});

// composables/useMemberstack.js
export const useMemberstack = () => {
	const memberstack = useState('memberstack', () => null);

	if (!memberstack.value) {
		memberstack.value = memberstackDOM.init({
			publicKey: useRuntimeConfig().public.memberstackKey
		});
	}

	return memberstack.value;
};
```

## Type Definitions

### Core Types (for reference)

```typescript
// Member object structure
interface Member {
	id: string;
	verified: boolean;
	profileImage?: string;
	auth: {
		email: string;
		hasPassword: boolean;
		providers: Array<{ provider: string }>;
	};
	loginRedirect?: string;
	stripeCustomerId?: string;
	createdAt: string;
	metaData: { [key: string]: any };
	customFields: { [key: string]: any };
	permissions: string[];
	planConnections: Array<{
		id: string;
		planId: string;
		active: boolean;
		status: string;
		type: string;
	}>;
}

// Plan object structure
interface Plan {
	id: string;
	name: string;
	description: string;
	status: string;
	redirects: {
		afterLogin: string;
		afterLogout: string;
		afterSignup: string;
	};
	prices?: Array<{
		id: string;
		amount: number;
		name: string;
		type: 'ONETIME' | 'RECURRING';
		currency: string;
		interval?: 'day' | 'week' | 'month' | 'year';
		freeTrial?: any;
		setupFee?: {
			amount: number;
			name: string;
		};
	}>;
}

// Standard API response structure
interface APIResponse<T> {
	data: T;
	success?: boolean;
	message?: string;
}

// Auth response structure
interface AuthResponse {
	data: {
		member: Member;
		tokens: {
			accessToken: string;
			type: string;
			expires: number;
		};
	};
}

// Error structure
interface MemberstackError {
	message: string;
	statusCode?: number;
	code?: string;
	details?: any;
}
```

## Common Gotchas & Important Notes

### 1. **Modal Parameters vs Signup Method Parameters**

- **Signup methods**: Use `plans: [{ planId: "pln_..." }]` (array of objects)
- **Modal methods**: Use `signup: { plans: ["pln_..."] }` (array of strings inside signup object)

### 2. **Plan IDs vs Price IDs**

- **Free plans**: Always use Plan IDs (starts with "pln\_")
- **Paid plans**: Always use Price IDs (starts with "prc\_")
- **Test mode**: Has separate IDs from live mode - always update when switching

### 3. **Custom Fields Storage**

- **ALL custom fields are stored as strings**
- Convert to appropriate types when reading: `parseInt()`, `parseFloat()`, `JSON.parse()`
- For arrays/objects, use `JSON.stringify()` before storing

### 4. **Promise Return Values**

- Most methods return `Promise<{ data: ... }>`
- `getMemberJSON()` returns the JSON directly (not wrapped in data)
- Always destructure appropriately: `const { data: member } = await getCurrentMember()`

### 5. **Provider Authentication Redirects**

- `signupWithProvider()` and `loginWithProvider()` redirect immediately
- `connectProvider()` also redirects immediately
- Code after these calls will NOT execute

### 6. **Modal Behavior**

- Modals do NOT close automatically
- Always call `memberstack.hideModal()` after successful operations
- Modal promises resolve when the operation is successful

### 7. **Session Management**

- Default session duration is 7 days
- Always unsubscribe from `onAuthChange` listeners
- Use `useCookies: true` for cross-tab synchronization

### 8. **File Storage**

- Memberstack does NOT handle file storage
- Upload files to external services (AWS S3, Cloudinary, etc.)
- Store only the resulting URLs in Memberstack custom fields

### 9. **Test Mode vs Live Mode**

- Test mode public keys start with `pk_sb_`
- Live mode public keys start with `pk_`
- Limited to 50 test members in test mode
- Always update ALL integrations when switching modes

### 10. **Error Handling**

- Always wrap async calls in try/catch blocks
- Check for specific error codes before generic handling
- Some operations (like email verification) can fail silently - don't break the flow

### 11. **Framework Integration**

- Always initialize Memberstack on client-side only
- For SSR frameworks, check authentication in middleware/hooks
- Serialize member data when passing from server to client

### 12. **Authentication State**

- Always check if member exists before accessing member properties
- Use `const { data: member } = await getCurrentMember()` pattern
- Member can be null if not logged in

## Critical Notes for AI Assistants

1. **ALWAYS use exact method signatures** - Do not modify parameter names or structure
2. **ALWAYS check authentication first** - Use `getCurrentMember()` before member-specific operations
3. **ALWAYS handle errors** - Use try/catch blocks for all async operations
4. **NEVER assume old API patterns** - This is the current DOM package, not legacy versions
5. **NEVER invent methods** - Only use methods documented in this guide
6. **ALWAYS return promises** - All methods are async and return promises
7. **PARAMETER VALIDATION** - Required parameters are marked as REQUIRED and must be included
8. **DISTINGUISH between modal and method parameters** - They have different structures
9. **REMEMBER return value structures** - Most return `{ data: ... }` except `getMemberJSON()`
10. **NOTE redirect behavior** - Provider methods redirect immediately

### Common Mistakes to Avoid

- ❌ `memberstack.login()` (wrong method name)
- ✅ `memberstack.loginMemberEmailPassword()`
- ❌ `memberstack.signUp()` (wrong method name)
- ✅ `memberstack.signupMemberEmailPassword()`
- ❌ `memberstack.getUser()` (wrong method name)
- ✅ `memberstack.getCurrentMember()`
- ❌ `plans: ["pln_..."]` in signup methods (wrong format)
- ✅ `plans: [{ planId: "pln_..." }]` in signup methods
- ❌ `plans: [{ planId: "pln_..." }]` in modals (wrong format)
- ✅ `signup: { plans: ["pln_..."] }` in modals
- ❌ `member.data.email` (wrong property path)
- ✅ `member.auth.email` (correct property path)
- ❌ `member.data.plans` (wrong property)
- ✅ `member.planConnections` (correct property)
- ❌ Using Plan IDs for paid plans
- ✅ Use Price IDs (prc*) for paid plans, Plan IDs (pln*) for free plans
- ❌ Using callbacks instead of promises/async-await
- ✅ Always use async/await or .then()/.catch()
- ❌ `window.Memberstack.init()` or CDN script patterns
- ✅ `import memberstackDOM from "@memberstack/dom"` and `memberstackDOM.init()`

This guide covers all major use cases for the Memberstack DOM package. When in doubt, refer to the exact method signatures and examples provided.