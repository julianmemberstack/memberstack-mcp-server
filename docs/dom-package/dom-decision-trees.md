# Memberstack DOM Package - Decision Trees

**PACKAGE:** @memberstack/dom  
**PURPOSE:** Visual decision guides for selecting the right Memberstack methods

## Table of Contents
- [Authentication Decision Tree](#authentication-decision-tree)
- [Profile Management Decision Tree](#profile-management-decision-tree)
- [Plan Management Decision Tree](#plan-management-decision-tree)
- [Password Management Decision Tree](#password-management-decision-tree)
- [Modal vs Direct Method Decision Tree](#modal-vs-direct-method-decision-tree)
- [Error Recovery Decision Tree](#error-recovery-decision-tree)
- [Session Management Decision Tree](#session-management-decision-tree)

## Authentication Decision Tree

```
User needs authentication?
├─ New user (SIGNUP)?
│  ├─ Want pre-built UI?
│  │  └─ openModal("SIGNUP", { signup: { plans: ["pln_id"] } })
│  │
│  └─ Custom UI/form?
│     ├─ Email/Password?
│     │  └─ signupMemberEmailPassword({
│     │        email,
│     │        password,
│     │        plans: [{ planId: "pln_id" }],  // Array of objects
│     │        customFields: { ... }
│     │      })
│     │
│     ├─ Social provider (Google/Facebook/etc)?
│     │  └─ signupWithProvider({
│     │        provider: "google",
│     │        plans: [{ planId: "pln_id" }],
│     │        allowLogin: true  // Allow existing users
│     │      })
│     │      // ⚠️ REDIRECTS IMMEDIATELY
│     │
│     └─ Passwordless (magic link)?
│        ├─ Step 1: Send email
│        │  └─ sendMemberSignupPasswordlessEmail({ email })
│        └─ Step 2: Complete with token
│           └─ signupMemberPasswordless({
│                 email,
│                 passwordlessToken,
│                 plans: [{ planId: "pln_id" }]
│               })
│
└─ Existing user (LOGIN)?
   ├─ Want pre-built UI?
   │  └─ openModal("LOGIN")
   │
   └─ Custom UI/form?
      ├─ Email/Password?
      │  └─ loginMemberEmailPassword({ email, password })
      │
      ├─ Social provider?
      │  └─ loginWithProvider({
      │        provider: "google",
      │        allowSignup: true  // Allow new users
      │      })
      │      // ⚠️ REDIRECTS IMMEDIATELY
      │
      └─ Passwordless (magic link)?
         ├─ Step 1: Send email
         │  └─ sendMemberLoginPasswordlessEmail({ email })
         └─ Step 2: Complete with token
            └─ loginMemberPasswordless({
                  email,
                  passwordlessToken
                })
```

## Profile Management Decision Tree

```
Managing member profile?
├─ Check if logged in?
│  └─ getCurrentMember() → if (!member) redirect to login
│
├─ Display profile data?
│  ├─ Basic info (email, plans)?
│  │  └─ member.auth.email, member.planConnections
│  │
│  ├─ Custom fields?
│  │  └─ member.customFields.fieldName
│  │
│  └─ Complex JSON data?
│     └─ getMemberJSON() → returns JSON directly
│
├─ Update profile data?
│  ├─ Custom fields (name, preferences, etc)?
│  │  └─ updateMember({
│  │        customFields: {
│  │          firstName: "John",
│  │          company: "Acme Corp"
│  │        }
│  │      })
│  │
│  ├─ Email address?
│  │  └─ updateMemberAuth({ email: "new@email.com" })
│  │      // No password required for email change
│  │
│  ├─ Password?
│  │  └─ updateMemberAuth({
│  │        oldPassword: "current",
│  │        newPassword: "newSecure123"
│  │      })
│  │
│  └─ Complex JSON data?
│     └─ updateMemberJSON({
│           json: {
│             preferences: { theme: "dark" },
│             settings: { notifications: true }
│           }
│         })
│
├─ Social account management?
│  ├─ Connect new provider?
│  │  └─ connectProvider({ provider: "google" })
│  │      // ⚠️ REDIRECTS IMMEDIATELY
│  │
│  └─ Disconnect provider?
│     └─ disconnectProvider({ provider: "google" })
│
├─ Email verification?
│  └─ sendMemberVerificationEmail()
│
└─ Delete account?
   └─ deleteMember() // ⚠️ PERMANENT
```

## Plan Management Decision Tree

```
Managing plans?
├─ Checking user's current plans?
│  ├─ Get member data
│  │  └─ const { data: member } = await getCurrentMember()
│  │
│  └─ Check plan access
│     └─ member.planConnections.find(conn => 
│           conn.planId === "pln_id" && conn.active
│         )
│
├─ Browsing available plans?
│  ├─ Get all plans?
│  │  └─ getPlans() → returns array of plans
│  │
│  └─ Get specific plan details?
│     └─ getPlan({ planId: "pln_id" })
│
├─ Free plan management?
│  ├─ Add free plan?
│  │  └─ addPlan({ planId: "pln_free_id" })
│  │      // ⚠️ Use Plan ID for free plans
│  │
│  └─ Remove plan?
│     └─ removePlan({ planId: "pln_id" })
│
└─ Paid plan management (Stripe)?
   ├─ Purchase new plan?
   │  └─ purchasePlansWithCheckout({
   │        priceId: "prc_stripe_price_id",  // ⚠️ Use Price ID
   │        successUrl: "/success",
   │        cancelUrl: "/cancel",
   │        autoRedirect: true  // or false to get URL
   │      })
   │
   └─ Manage existing subscription?
      └─ launchStripeCustomerPortal({
            returnUrl: "/dashboard",
            autoRedirect: true  // or false to get URL
          })
```

## Password Management Decision Tree

```
Password-related action?
├─ User forgot password?
│  ├─ Step 1: Send reset email
│  │  └─ sendMemberResetPasswordEmail({ email })
│  │
│  └─ Step 2: Reset with token (from email)
│     └─ resetMemberPassword({
│           token: "token_from_email",
│           newPassword: "newSecure123"
│         })
│
├─ Logged-in user changing password?
│  └─ updateMemberAuth({
│        oldPassword: "current",
│        newPassword: "newSecure123"
│      })
│
├─ Passwordless user needs password?
│  └─ setPassword({ password: "newSecure123" })
│
└─ Pre-built password reset UI?
   ├─ Show forgot password modal
   │  └─ openModal("FORGOT_PASSWORD")
   │
   └─ Show reset password modal (with token)
      └─ openModal("RESET_PASSWORD")
```

## Modal vs Direct Method Decision Tree

```
Need user interface?
├─ Want Memberstack's pre-built UI?
│  ├─ Login interface?
│  │  └─ openModal("LOGIN", {
│  │        signup: { plans: ["pln_id"] }  // Optional
│  │      })
│  │
│  ├─ Signup interface?
│  │  └─ openModal("SIGNUP", {
│  │        signup: { plans: ["pln_id"] }  // ⚠️ Array of strings
│  │      })
│  │
│  ├─ Profile management?
│  │  └─ openModal("PROFILE")
│  │
│  ├─ Forgot password?
│  │  └─ openModal("FORGOT_PASSWORD")
│  │
│  └─ After modal success?
│     └─ hideModal()  // ⚠️ Must call manually
│
└─ Building custom UI?
   ├─ Full control over UX?
   │  └─ Use direct methods (loginMemberEmailPassword, etc)
   │
   ├─ Custom error handling?
   │  └─ Use direct methods with try/catch
   │
   └─ Progressive form enhancement?
      └─ Use direct methods for each step
```

## Error Recovery Decision Tree

```
Error occurred?
├─ Authentication errors?
│  ├─ invalid_credentials?
│  │  └─ Show "Wrong email or password"
│  │
│  ├─ email_not_verified?
│  │  ├─ Prompt to check email
│  │  └─ Offer: sendMemberVerificationEmail()
│  │
│  ├─ member_not_found?
│  │  └─ Suggest signup instead
│  │
│  ├─ email_already_exists?
│  │  └─ Suggest login instead
│  │
│  └─ too_many_requests?
│     └─ Show cooldown timer
│
├─ Validation errors?
│  ├─ weak_password?
│  │  └─ Show password requirements
│  │
│  └─ invalid_email?
│     └─ Show email format requirements
│
├─ Permission errors?
│  ├─ unauthorized (401)?
│  │  └─ Redirect to login
│  │
│  └─ forbidden (403)?
│     └─ Show plan upgrade prompt
│
├─ Network errors?
│  ├─ Server error (5xx)?
│  │  └─ Retry with exponential backoff
│  │
│  └─ Network timeout?
│     └─ Check connection and retry
│
└─ Token errors?
   ├─ invalid_token?
   │  └─ Request new token
   │
   └─ expired_token?
      └─ Restart the flow
```

## Session Management Decision Tree

```
Managing user sessions?
├─ Initial setup?
│  └─ memberstackDOM.init({
│        publicKey: "pk_...",
│        useCookies: true,  // For cross-tab sync
│        sessionDurationDays: 30  // Default: 7
│      })
│
├─ Monitor auth state?
│  ├─ Set up listener
│  │  └─ const listener = onAuthChange((member) => {
│  │        if (member) {
│  │          // User logged in
│  │        } else {
│  │          // User logged out
│  │        }
│  │      })
│  │
│  └─ Clean up listener
│     └─ listener.unsubscribe()  // ⚠️ CRITICAL
│
├─ Check current auth?
│  ├─ Quick check (cached)?
│  │  └─ getCurrentMember({ useCache: true })
│  │
│  └─ Fresh check?
│     └─ getCurrentMember()  // Default: no cache
│
├─ Get auth token for API?
│  └─ getMemberToken() → string | null
│
└─ End session?
   └─ logout() → clears all auth data
```

## Quick Decision Summary

### "I want to..." → Method to use:

| Goal | Method |
|------|--------|
| Sign up new user with email | `signupMemberEmailPassword()` |
| Log in existing user | `loginMemberEmailPassword()` |
| Use Google/Facebook login | `signupWithProvider()` / `loginWithProvider()` |
| Send magic link | `sendMemberSignupPasswordlessEmail()` |
| Show login popup | `openModal("LOGIN")` |
| Check if user logged in | `getCurrentMember()` |
| Update user's name | `updateMember({ customFields: {...} })` |
| Change password | `updateMemberAuth({ oldPassword, newPassword })` |
| Add free plan | `addPlan({ planId })` |
| Start paid subscription | `purchasePlansWithCheckout({ priceId })` |
| Reset forgotten password | `sendMemberResetPasswordEmail()` |
| Listen for login/logout | `onAuthChange(callback)` |
| Log out user | `logout()` |

## Critical Decision Points

### 1. **Authentication Method**
- **Pre-built UI?** → Use modals
- **Custom UI?** → Use direct methods
- **Social login?** → Will redirect away from your site

### 2. **Plan Types**
- **Free plans** → Use Plan ID (`pln_...`)
- **Paid plans** → Use Price ID (`prc_...`)
- **Test mode** → Different IDs than live mode

### 3. **Data Storage**
- **Simple fields** → `customFields`
- **Complex data** → `updateMemberJSON()`
- **Files** → Store URLs only, not files

### 4. **Error Handling**
- **Always use try/catch**
- **Check error.code first**
- **Have fallback for generic errors**

### 5. **Modal Parameters**
- **Signup methods:** `plans: [{ planId: "..." }]`
- **Modal methods:** `signup: { plans: ["..."] }`

These decision trees help you quickly identify the right Memberstack method for any scenario. Always refer to the main API reference for complete parameter details and examples.