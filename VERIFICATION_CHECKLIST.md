# Memberstack MCP Server - Verification Checklist

This document provides a comprehensive checklist for verifying the accuracy of the Memberstack MCP server documentation.

## Last Verification: 2025-01-06

## Quick Validation Commands

```bash
# Run documentation validation
npm run validate-docs

# Update documentation from official sources  
npm run update-docs

# Build and test the MCP server
npm run build
npm run dev
```

## Manual Verification Steps

### 1. Package Version Verification

- [ ] **DOM Package Version**: Verify `@memberstack/dom` version matches documentation
  - Current documented version: `1.9.40`
  - Check: https://www.npmjs.com/package/@memberstack/dom
  - Update location: `docs/dom-package/dom-api-reference.md` line 4

- [ ] **Admin Package Version**: Verify `@memberstack/admin` version is current
  - Check: https://www.npmjs.com/package/@memberstack/admin
  - Update location: `docs/admin-package/admin-api-reference.md`

### 2. Method Signature Verification

#### DOM Package Methods (31 expected)
- [ ] **Authentication Methods**
  - [ ] `signupMemberEmailPassword()` - parameters and return types
  - [ ] `loginMemberEmailPassword()` - parameters and return types
  - [ ] `signupWithProvider()` - redirect behavior
  - [ ] `loginWithProvider()` - redirect behavior
  - [ ] `logout()` - return type
  - [ ] `onAuthChange()` - callback signature
  - [ ] `getMemberToken()` - return type
  - [ ] Passwordless methods: `sendMember*`, `signupMemberPasswordless`, `loginMemberPasswordless`

- [ ] **Profile Management Methods**
  - [ ] `getCurrentMember()` - return structure
  - [ ] `updateMember()` - custom fields handling
  - [ ] `updateMemberAuth()` - email/password parameters
  - [ ] `updateMemberJSON()` / `getMemberJSON()` - JSON handling
  - [ ] Password management methods
  - [ ] Provider connection methods
  - [ ] `deleteMember()` - confirmation

- [ ] **Plan Management Methods**
  - [ ] `getPlan()` / `getPlans()` - return structures
  - [ ] `addPlan()` / `removePlan()` - Plan ID vs Price ID usage
  - [ ] `purchasePlansWithCheckout()` - Price ID requirement
  - [ ] `launchStripeCustomerPortal()` - return URL structure

- [ ] **Modal Methods**
  - [ ] `openModal()` - modal types and parameter differences
  - [ ] `hideModal()` - behavior

#### Admin Package Methods (13 expected)
- [ ] **Member Management**
  - [ ] `getMembers()` - pagination and filtering
  - [ ] `getMember()` - member ID parameter
  - [ ] `createMember()` - required vs optional parameters
  - [ ] `updateMember()` - update fields
  - [ ] `deleteMember()` - permanent deletion
  - [ ] `searchMembers()` - search criteria

- [ ] **Plan Management**
  - [ ] `addPlanToMember()` / `removePlanFromMember()` - plan operations
  - [ ] `updateMemberPlans()` - bulk plan updates

- [ ] **Authentication**
  - [ ] `verifyToken()` - JWT verification
  - [ ] `generateLoginLink()` - link generation
  - [ ] `revokeAllSessions()` - session management

- [ ] **Webhooks**
  - [ ] `verifyWebhookSignature()` - signature verification

### 3. REST API Verification

- [ ] **Base URL**: Confirm `https://api.memberstack.com/v1` is current
- [ ] **Authentication**: Bearer token format requirements
- [ ] **Rate Limits**: Verify endpoint-specific rate limits
- [ ] **Endpoints** (13 expected):
  - [ ] Member CRUD operations
  - [ ] Plan operations  
  - [ ] Search functionality
  - [ ] Authentication endpoints

### 4. Error Handling Verification

- [ ] **Error Codes**: Verify error codes are current
  - [ ] `invalid_credentials`
  - [ ] `email_not_verified`
  - [ ] `member_not_found`
  - [ ] `email_already_exists`
  - [ ] `weak_password`
  - [ ] Other documented error codes

- [ ] **HTTP Status Codes**: Confirm REST API status codes
  - [ ] 200/201/204 success responses
  - [ ] 400/401/403/404 client errors
  - [ ] 429 rate limiting
  - [ ] 500+ server errors

### 5. Critical Implementation Details

- [ ] **Parameter Format Differences**:
  - [ ] Signup methods: `plans: [{ planId: "pln_..." }]` (array of objects)
  - [ ] Modal methods: `signup: { plans: ["pln_..."] }` (array of strings in signup object)

- [ ] **ID Format Requirements**:
  - [ ] Free plans: Plan IDs starting with `pln_`
  - [ ] Paid plans: Price IDs starting with `prc_`
  - [ ] Test vs Live mode ID differences

- [ ] **Return Value Structures**:
  - [ ] Most methods: `Promise<{ data: ... }>`
  - [ ] `getMemberJSON()`: Returns JSON directly (not wrapped)
  - [ ] `onAuthChange()`: Returns `{ unsubscribe: () => void }`

### 6. Framework Integration Examples

- [ ] **React**: Hooks and component patterns
- [ ] **Vue**: Composition API examples
- [ ] **Svelte**: Store integration
- [ ] **Next.js**: Pages vs App Router differences
- [ ] **SvelteKit**: Middleware patterns

### 7. Documentation Structure Verification

- [ ] **Cross-references**: All internal links work
- [ ] **Code Examples**: All examples are syntactically correct
- [ ] **Decision Trees**: Logic flows are accurate
- [ ] **Method Tables**: Quick reference tables are complete

## Automated Checks

The following items are automatically verified by `npm run validate-docs`:

- ✅ Method count accuracy (DOM: 31, Admin: 13)
- ✅ Method name consistency
- ✅ Documentation file integrity
- ✅ Cross-reference validation

## Official Documentation Sources

Always cross-reference against these official sources:

1. **Primary**: https://docs.memberstack.com/
2. **Developer Portal**: https://developers.memberstack.com/
3. **NPM Packages**: 
   - https://www.npmjs.com/package/@memberstack/dom
   - https://www.npmjs.com/package/@memberstack/admin
4. **GitHub**: Official Memberstack repositories (if public)

## Update Procedure

When updating documentation:

1. **Check versions**: Verify latest package versions
2. **Run validation**: `npm run validate-docs`
3. **Update metadata**: Update `LAST VERIFIED` dates in all files
4. **Test examples**: Spot-check critical code examples
5. **Commit changes**: Update this checklist completion date

## Notes for Maintainers

- **Test Mode vs Live Mode**: Always note differences in IDs and behavior
- **Breaking Changes**: Watch for breaking changes in minor versions
- **New Methods**: Check for new methods added to packages
- **Deprecated Methods**: Identify and mark deprecated functionality
- **Security**: Ensure security best practices are up to date

## Completion

- [ ] All checklist items verified
- [ ] Automated validation passes
- [ ] Version numbers updated
- [ ] Examples tested
- [ ] Documentation metadata updated

**Completed by:** ________________  
**Date:** ________________  
**Next verification due:** ________________

---

*This checklist should be completed monthly or when significant Memberstack updates are released.*