# Memberstack Error Handling - Comprehensive Guide

**PURPOSE:** Complete error handling strategies for all Memberstack APIs  
**SCOPE:** DOM package, Admin API, REST API, and Webhooks

## Table of Contents
- [Error Structure Overview](#error-structure-overview)
- [DOM Package Error Handling](#dom-package-error-handling)
- [Admin API Error Handling](#admin-api-error-handling)
- [REST API Error Handling](#rest-api-error-handling)
- [Webhook Error Handling](#webhook-error-handling)
- [Error Recovery Patterns](#error-recovery-patterns)
- [User-Friendly Error Messages](#user-friendly-error-messages)
- [Monitoring and Logging](#monitoring-and-logging)

## Error Structure Overview

### Universal Error Format

All Memberstack APIs follow a consistent error structure:

```javascript
// ERROR object structure across all APIs:
interface MemberstackError {
  message: string;         // Human-readable error message
  statusCode?: number;     // HTTP status code (REST API, Admin API)
  code?: string;          // Memberstack-specific error code
  details?: any;          // Additional error context
  requestId?: string;     // Request ID for tracking (API only)
}
```

### Error Categories

```javascript
// ERROR categories by type:
const ERROR_CATEGORIES = {
  // Authentication & Authorization
  AUTHENTICATION: [
    'invalid_credentials',
    'email_not_verified',
    'member_not_found',
    'unauthorized',
    'forbidden'
  ],
  
  // Validation
  VALIDATION: [
    'invalid_email',
    'weak_password',
    'invalid_token',
    'missing_required_field',
    'validation_failed'
  ],
  
  // Resource Management
  RESOURCE: [
    'email_already_exists',
    'member_not_found',
    'plan_not_found',
    'resource_not_found'
  ],
  
  // Rate Limiting & Quotas
  RATE_LIMITING: [
    'too_many_requests',
    'rate_limit_exceeded',
    'quota_exceeded'
  ],
  
  // System & Network
  SYSTEM: [
    'internal_error',
    'service_unavailable',
    'network_error',
    'timeout'
  ]
};
```

## DOM Package Error Handling

### Comprehensive Error Handler for DOM Package

```javascript
class MemberstackDOMErrorHandler {
  constructor() {
    this.retryableErrors = [
      'network_error',
      'timeout',
      'service_unavailable',
      'internal_error'
    ];
    
    this.userFriendlyMessages = {
      // Authentication errors
      'invalid_credentials': 'The email or password you entered is incorrect.',
      'email_not_verified': 'Please check your email and click the verification link before logging in.',
      'member_not_found': 'No account found with this email address.',
      'too_many_requests': 'Too many login attempts. Please wait a few minutes before trying again.',
      
      // Validation errors
      'weak_password': 'Password must be at least 8 characters with uppercase letters and numbers.',
      'invalid_email': 'Please enter a valid email address.',
      'email_already_exists': 'An account with this email already exists.',
      
      // Plan errors
      'invalid_plan': 'The selected plan is not available.',
      'plan_not_found': 'The requested plan could not be found.',
      
      // Token errors
      'invalid_token': 'Your session has expired. Please log in again.',
      'token_expired': 'Your login link has expired. Please request a new one.',
      
      // Network errors
      'network_error': 'Connection problem. Please check your internet and try again.',
      'service_unavailable': 'Service temporarily unavailable. Please try again in a moment.',
      'internal_error': 'Something went wrong. Please try again.'
    };
  }

  async handleError(error, context = {}) {
    const errorInfo = this.categorizeError(error);
    
    // Log error for debugging
    this.logError(error, context, errorInfo);
    
    // Determine if error is retryable
    if (this.isRetryable(error) && context.retryCount < 3) {
      return await this.retryWithBackoff(context.operation, context.retryCount + 1);
    }
    
    // Handle specific error types
    switch (errorInfo.category) {
      case 'authentication':
        return this.handleAuthError(error, context);
      
      case 'validation':
        return this.handleValidationError(error, context);
      
      case 'rate_limiting':
        return this.handleRateLimitError(error, context);
      
      case 'network':
        return this.handleNetworkError(error, context);
      
      default:
        return this.handleGenericError(error, context);
    }
  }

  categorizeError(error) {
    const category = this.getErrorCategory(error.code);
    const severity = this.getErrorSeverity(error);
    const isRetryable = this.isRetryable(error);
    
    return {
      category,
      severity,
      isRetryable,
      userMessage: this.getUserMessage(error),
      technicalMessage: error.message,
      code: error.code,
      statusCode: error.statusCode
    };
  }

  getErrorCategory(errorCode) {
    for (const [category, codes] of Object.entries(ERROR_CATEGORIES)) {
      if (codes.includes(errorCode)) {
        return category.toLowerCase();
      }
    }
    return 'unknown';
  }

  getErrorSeverity(error) {
    if (error.statusCode >= 500) return 'high';
    if (error.statusCode === 429) return 'medium';
    if (error.statusCode >= 400) return 'low';
    return 'medium';
  }

  isRetryable(error) {
    return this.retryableErrors.includes(error.code) || 
           error.statusCode >= 500 || 
           error.statusCode === 429;
  }

  getUserMessage(error) {
    return this.userFriendlyMessages[error.code] || 
           'Something went wrong. Please try again.';
  }

  async handleAuthError(error, context) {
    switch (error.code) {
      case 'invalid_credentials':
        return {
          shouldShowError: true,
          message: this.getUserMessage(error),
          actions: ['retry', 'forgot_password'],
          redirect: null
        };
      
      case 'email_not_verified':
        return {
          shouldShowError: true,
          message: this.getUserMessage(error),
          actions: ['resend_verification'],
          redirect: null
        };
      
      case 'member_not_found':
        return {
          shouldShowError: true,
          message: this.getUserMessage(error),
          actions: ['signup'],
          redirect: null
        };
      
      case 'unauthorized':
        return {
          shouldShowError: false,
          message: 'Please log in to continue',
          actions: ['login'],
          redirect: '/login'
        };
      
      default:
        return this.handleGenericError(error, context);
    }
  }

  async handleValidationError(error, context) {
    return {
      shouldShowError: true,
      message: this.getUserMessage(error),
      actions: ['retry'],
      fieldErrors: this.extractFieldErrors(error),
      redirect: null
    };
  }

  async handleRateLimitError(error, context) {
    const retryAfter = this.extractRetryAfter(error);
    
    return {
      shouldShowError: true,
      message: `Too many attempts. Please wait ${retryAfter} before trying again.`,
      actions: ['wait_and_retry'],
      retryAfter: retryAfter,
      redirect: null
    };
  }

  async handleNetworkError(error, context) {
    return {
      shouldShowError: true,
      message: this.getUserMessage(error),
      actions: ['retry', 'check_connection'],
      redirect: null,
      canRetry: true
    };
  }

  async handleGenericError(error, context) {
    return {
      shouldShowError: true,
      message: this.getUserMessage(error),
      actions: ['retry', 'contact_support'],
      redirect: null,
      supportInfo: {
        errorId: this.generateErrorId(),
        timestamp: new Date().toISOString()
      }
    };
  }

  async retryWithBackoff(operation, retryCount) {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= 3) {
        throw error;
      }
      return this.handleError(error, { operation, retryCount });
    }
  }

  extractFieldErrors(error) {
    // Extract field-specific errors from error details
    if (error.details && error.details.fields) {
      return error.details.fields;
    }
    return {};
  }

  extractRetryAfter(error) {
    if (error.details && error.details.retryAfter) {
      const seconds = error.details.retryAfter;
      if (seconds < 60) return `${seconds} seconds`;
      if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
      return `${Math.ceil(seconds / 3600)} hours`;
    }
    return '5 minutes';
  }

  logError(error, context, errorInfo) {
    console.group(`Memberstack Error: ${error.code || 'Unknown'}`);
    console.error('Error Details:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context: context,
      category: errorInfo.category,
      severity: errorInfo.severity
    });
    console.error('Stack Trace:', error.stack);
    console.groupEnd();
    
    // Send to monitoring service
    this.sendToMonitoring(error, context, errorInfo);
  }

  sendToMonitoring(error, context, errorInfo) {
    // Example: Send to monitoring service like Sentry, LogRocket, etc.
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          service: 'memberstack',
          category: errorInfo.category,
          severity: errorInfo.severity
        },
        extra: {
          context,
          memberstackCode: error.code,
          statusCode: error.statusCode
        }
      });
    }
  }

  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

// Usage with DOM package methods:
const errorHandler = new MemberstackDOMErrorHandler();

async function safeLogin(email, password) {
  try {
    const result = await memberstack.loginMemberEmailPassword({ email, password });
    return { success: true, data: result.data };
  } catch (error) {
    const errorResult = await errorHandler.handleError(error, {
      operation: () => memberstack.loginMemberEmailPassword({ email, password }),
      retryCount: 0,
      method: 'loginMemberEmailPassword'
    });
    
    return { success: false, error: errorResult };
  }
}

// React component usage:
const LoginForm = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email, password) => {
    setLoading(true);
    setError(null);
    
    const result = await safeLogin(email, password);
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      const errorInfo = result.error;
      setError(errorInfo);
      
      // Handle automatic actions
      if (errorInfo.redirect) {
        router.push(errorInfo.redirect);
      }
    }
    
    setLoading(false);
  };

  const handleErrorAction = (action) => {
    switch (action) {
      case 'forgot_password':
        router.push('/forgot-password');
        break;
      case 'signup':
        router.push('/signup');
        break;
      case 'resend_verification':
        // Implement resend verification
        break;
      case 'retry':
        setError(null);
        break;
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(e.target.email.value, e.target.password.value);
    }}>
      {error && (
        <div className="error-display">
          <p>{error.message}</p>
          {error.actions && (
            <div className="error-actions">
              {error.actions.map(action => (
                <button
                  key={action}
                  type="button"
                  onClick={() => handleErrorAction(action)}
                  className={`error-action ${action}`}
                >
                  {getActionLabel(action)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

## Admin API Error Handling

### Admin API Error Handler

```javascript
class MemberstackAdminErrorHandler {
  constructor() {
    this.rateLimitBackoff = new Map();
  }

  async handleAdminError(error, context = {}) {
    const errorInfo = this.categorizeAdminError(error);
    
    // Log for admin operations
    this.logAdminError(error, context, errorInfo);
    
    switch (error.statusCode) {
      case 400:
        return this.handleBadRequest(error, context);
      case 401:
        return this.handleUnauthorized(error, context);
      case 403:
        return this.handleForbidden(error, context);
      case 404:
        return this.handleNotFound(error, context);
      case 409:
        return this.handleConflict(error, context);
      case 422:
        return this.handleValidationError(error, context);
      case 429:
        return this.handleRateLimit(error, context);
      case 500:
      case 502:
      case 503:
        return this.handleServerError(error, context);
      default:
        return this.handleUnknownError(error, context);
    }
  }

  async handleBadRequest(error, context) {
    return {
      type: 'validation_error',
      message: 'Invalid request parameters',
      details: error.details,
      canRetry: false,
      suggestions: [
        'Check request parameters',
        'Validate input data',
        'Review API documentation'
      ]
    };
  }

  async handleUnauthorized(error, context) {
    return {
      type: 'auth_error',
      message: 'Invalid or missing API key',
      canRetry: false,
      suggestions: [
        'Verify API key is correct',
        'Check environment variables',
        'Ensure key has not expired'
      ],
      requiresAction: 'check_credentials'
    };
  }

  async handleForbidden(error, context) {
    return {
      type: 'permission_error',
      message: 'Insufficient permissions for this operation',
      canRetry: false,
      suggestions: [
        'Check API key permissions',
        'Verify account access level',
        'Contact support if needed'
      ]
    };
  }

  async handleNotFound(error, context) {
    const resourceType = this.determineResourceType(context);
    
    return {
      type: 'not_found',
      message: `${resourceType} not found`,
      canRetry: false,
      suggestions: [
        `Verify ${resourceType} ID is correct`,
        'Check if resource has been deleted',
        'Ensure using correct environment (test/live)'
      ]
    };
  }

  async handleConflict(error, context) {
    return {
      type: 'conflict',
      message: 'Resource already exists or conflict detected',
      canRetry: false,
      suggestions: [
        'Check if resource already exists',
        'Use different identifier',
        'Update existing resource instead'
      ]
    };
  }

  async handleValidationError(error, context) {
    return {
      type: 'validation_error',
      message: 'Request validation failed',
      fieldErrors: this.extractFieldErrors(error),
      canRetry: true,
      suggestions: [
        'Fix validation errors',
        'Check required fields',
        'Verify data types'
      ]
    };
  }

  async handleRateLimit(error, context) {
    const retryAfter = this.getRetryAfter(error);
    const backoffKey = context.endpoint || 'default';
    
    // Track rate limit backoff
    this.rateLimitBackoff.set(backoffKey, Date.now() + (retryAfter * 1000));
    
    return {
      type: 'rate_limit',
      message: `Rate limit exceeded. Retry after ${retryAfter} seconds`,
      retryAfter: retryAfter,
      canRetry: true,
      suggestions: [
        'Implement exponential backoff',
        'Reduce request frequency',
        'Use bulk operations where possible'
      ]
    };
  }

  async handleServerError(error, context) {
    return {
      type: 'server_error',
      message: 'Server error occurred',
      canRetry: true,
      retryable: true,
      suggestions: [
        'Retry with exponential backoff',
        'Check Memberstack status page',
        'Contact support if persistent'
      ],
      supportInfo: {
        requestId: error.requestId,
        timestamp: new Date().toISOString()
      }
    };
  }

  determineResourceType(context) {
    if (context.endpoint) {
      if (context.endpoint.includes('members')) return 'Member';
      if (context.endpoint.includes('plans')) return 'Plan';
      if (context.endpoint.includes('auth')) return 'Authentication';
    }
    return 'Resource';
  }

  getRetryAfter(error) {
    // Check Retry-After header or default
    return error.details?.retryAfter || 60;
  }

  logAdminError(error, context, errorInfo) {
    console.group(`Admin API Error: ${error.statusCode} ${error.code || 'Unknown'}`);
    console.error('Error Details:', {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      requestId: error.requestId,
      endpoint: context.endpoint,
      method: context.method
    });
    console.groupEnd();
  }

  // Wrapper for admin operations with error handling
  async safeAdminOperation(operation, context = {}) {
    try {
      // Check rate limit backoff
      const backoffKey = context.endpoint || 'default';
      const backoffUntil = this.rateLimitBackoff.get(backoffKey);
      
      if (backoffUntil && Date.now() < backoffUntil) {
        const waitTime = Math.ceil((backoffUntil - Date.now()) / 1000);
        throw new Error(`Rate limited. Wait ${waitTime} seconds before retrying.`);
      }

      const result = await operation();
      
      // Clear backoff on success
      this.rateLimitBackoff.delete(backoffKey);
      
      return { success: true, data: result };
    } catch (error) {
      const errorResult = await this.handleAdminError(error, context);
      return { success: false, error: errorResult };
    }
  }
}

// Usage examples:
const adminErrorHandler = new MemberstackAdminErrorHandler();

// Safe member creation
async function safeCreateMember(memberData) {
  return adminErrorHandler.safeAdminOperation(
    () => memberstackAdmin.createMember(memberData),
    { endpoint: '/members', method: 'POST' }
  );
}

// Safe bulk operations with error handling
async function bulkCreateMembers(membersData) {
  const results = {
    successful: [],
    failed: []
  };

  for (const memberData of membersData) {
    const result = await safeCreateMember(memberData);
    
    if (result.success) {
      results.successful.push({ data: memberData, result: result.data });
    } else {
      results.failed.push({ 
        data: memberData, 
        error: result.error,
        canRetry: result.error.canRetry
      });
    }

    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}
```

## REST API Error Handling

### REST API Error Handler with Retry Logic

```javascript
class MemberstackRESTErrorHandler {
  constructor(baseURL = 'https://api.memberstack.com/v1') {
    this.baseURL = baseURL;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second base delay
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${process.env.MEMBERSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        // Handle different response status codes
        const result = await this.handleResponse(response, endpoint, options);
        
        if (result.success) {
          return result;
        }

        // If not successful but not retryable, return immediately
        if (!result.canRetry) {
          return result;
        }

        lastError = result.error;

      } catch (networkError) {
        lastError = {
          type: 'network_error',
          message: 'Network request failed',
          originalError: networkError,
          canRetry: true
        };
      }

      // If this isn't the last attempt, wait before retrying
      if (attempt < this.maxRetries) {
        const delay = this.calculateRetryDelay(attempt, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    return {
      success: false,
      error: {
        ...lastError,
        message: `Request failed after ${this.maxRetries + 1} attempts: ${lastError.message}`,
        exhaustedRetries: true
      }
    };
  }

  async handleResponse(response, endpoint, options) {
    const status = response.status;
    
    // Success responses
    if (status >= 200 && status < 300) {
      const data = status === 204 ? null : await response.json();
      return { success: true, data };
    }

    // Parse error response
    let errorData;
    try {
      errorData = await response.json();
    } catch (parseError) {
      errorData = { message: response.statusText };
    }

    const error = {
      statusCode: status,
      message: errorData.error?.message || errorData.message || response.statusText,
      code: errorData.error?.code,
      details: errorData.error?.details,
      requestId: response.headers.get('X-Request-ID')
    };

    switch (status) {
      case 400:
        return {
          success: false,
          canRetry: false,
          error: {
            type: 'bad_request',
            ...error,
            userMessage: 'Invalid request. Please check your input and try again.'
          }
        };

      case 401:
        return {
          success: false,
          canRetry: false,
          error: {
            type: 'unauthorized',
            ...error,
            userMessage: 'Authentication failed. Please check your API credentials.',
            requiresAction: 'check_auth'
          }
        };

      case 403:
        return {
          success: false,
          canRetry: false,
          error: {
            type: 'forbidden',
            ...error,
            userMessage: 'Permission denied. You may not have access to this resource.'
          }
        };

      case 404:
        return {
          success: false,
          canRetry: false,
          error: {
            type: 'not_found',
            ...error,
            userMessage: 'The requested resource was not found.'
          }
        };

      case 409:
        return {
          success: false,
          canRetry: false,
          error: {
            type: 'conflict',
            ...error,
            userMessage: 'A conflict occurred. The resource may already exist.'
          }
        };

      case 422:
        return {
          success: false,
          canRetry: true,
          error: {
            type: 'validation_error',
            ...error,
            userMessage: 'Please fix the validation errors and try again.',
            fieldErrors: this.extractFieldErrors(errorData)
          }
        };

      case 429:
        const retryAfter = parseInt(response.headers.get('Retry-After')) || 60;
        return {
          success: false,
          canRetry: true,
          error: {
            type: 'rate_limited',
            ...error,
            retryAfter,
            userMessage: `Too many requests. Please wait ${retryAfter} seconds before retrying.`
          }
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          success: false,
          canRetry: true,
          error: {
            type: 'server_error',
            ...error,
            userMessage: 'Server error occurred. Please try again in a moment.'
          }
        };

      default:
        return {
          success: false,
          canRetry: false,
          error: {
            type: 'unknown_error',
            ...error,
            userMessage: 'An unexpected error occurred. Please try again.'
          }
        };
    }
  }

  calculateRetryDelay(attempt, error) {
    // Use retry-after header for rate limits
    if (error?.retryAfter) {
      return error.retryAfter * 1000;
    }

    // Exponential backoff with jitter
    const baseDelay = this.retryDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * baseDelay;
    return Math.min(baseDelay + jitter, 30000); // Max 30 seconds
  }

  extractFieldErrors(errorData) {
    if (errorData.error?.details?.fields) {
      return errorData.error.details.fields;
    }
    return {};
  }

  // Convenience methods for common operations
  async getMembers(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/members${query ? `?${query}` : ''}`;
    
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  async getMember(memberId) {
    return this.makeRequest(`/members/${memberId}`, { method: 'GET' });
  }

  async createMember(memberData) {
    return this.makeRequest('/members', {
      method: 'POST',
      body: JSON.stringify(memberData)
    });
  }

  async updateMember(memberId, updates) {
    return this.makeRequest(`/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async deleteMember(memberId) {
    return this.makeRequest(`/members/${memberId}`, { method: 'DELETE' });
  }
}

// Usage example:
const restClient = new MemberstackRESTErrorHandler();

async function handleMemberOperation() {
  const result = await restClient.createMember({
    email: 'user@example.com',
    password: 'securePassword123',
    custom_fields: {
      first_name: 'John',
      last_name: 'Doe'
    }
  });

  if (result.success) {
    console.log('Member created:', result.data);
    return result.data;
  } else {
    const error = result.error;
    
    // Handle specific error types
    switch (error.type) {
      case 'validation_error':
        console.error('Validation failed:', error.fieldErrors);
        // Show field-specific errors to user
        break;
        
      case 'conflict':
        console.error('Member already exists');
        // Suggest login instead
        break;
        
      case 'rate_limited':
        console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
        // Show waiting message to user
        break;
        
      case 'server_error':
        console.error('Server error:', error.message);
        // Show generic error message and retry option
        break;
        
      default:
        console.error('Operation failed:', error.message);
        // Show generic error message
    }
    
    throw new Error(error.userMessage);
  }
}
```

## Webhook Error Handling

### Webhook Error Handler

```javascript
class MemberstackWebhookErrorHandler {
  constructor() {
    this.maxRetries = 3;
    this.retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
  }

  async processWebhook(payload, signature, secret) {
    try {
      // Verify webhook signature
      if (!this.verifySignature(payload, signature, secret)) {
        throw new Error('Invalid webhook signature');
      }

      // Parse webhook data
      const webhookData = this.parseWebhookData(payload);
      
      // Process the webhook
      const result = await this.handleWebhookEvent(webhookData);
      
      return {
        success: true,
        processed: true,
        data: result
      };

    } catch (error) {
      return await this.handleWebhookError(error, payload);
    }
  }

  async handleWebhookError(error, payload) {
    const errorInfo = this.categorizeWebhookError(error);
    
    // Log webhook error
    this.logWebhookError(error, payload, errorInfo);
    
    // Determine if webhook should be retried
    if (errorInfo.shouldRetry) {
      await this.scheduleWebhookRetry(payload, errorInfo);
      
      return {
        success: false,
        shouldRetry: true,
        error: errorInfo,
        status: 202 // Accepted for retry
      };
    }

    // Webhook processing failed permanently
    return {
      success: false,
      shouldRetry: false,
      error: errorInfo,
      status: errorInfo.permanent ? 400 : 500
    };
  }

  categorizeWebhookError(error) {
    // Signature verification errors (permanent)
    if (error.message.includes('signature')) {
      return {
        type: 'signature_error',
        permanent: true,
        shouldRetry: false,
        userMessage: 'Webhook signature verification failed'
      };
    }

    // Parsing errors (permanent)
    if (error instanceof SyntaxError) {
      return {
        type: 'parse_error',
        permanent: true,
        shouldRetry: false,
        userMessage: 'Webhook payload could not be parsed'
      };
    }

    // Validation errors (permanent)
    if (error.message.includes('validation')) {
      return {
        type: 'validation_error',
        permanent: true,
        shouldRetry: false,
        userMessage: 'Webhook data validation failed'
      };
    }

    // Database errors (retryable)
    if (error.message.includes('database') || error.code === 'ECONNRESET') {
      return {
        type: 'database_error',
        permanent: false,
        shouldRetry: true,
        userMessage: 'Database operation failed'
      };
    }

    // External API errors (retryable)
    if (error.message.includes('fetch') || error.code === 'ENOTFOUND') {
      return {
        type: 'external_api_error',
        permanent: false,
        shouldRetry: true,
        userMessage: 'External API call failed'
      };
    }

    // Generic errors (retryable)
    return {
      type: 'generic_error',
      permanent: false,
      shouldRetry: true,
      userMessage: 'Webhook processing failed'
    };
  }

  verifySignature(payload, signature, secret) {
    const crypto = require('crypto');
    
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

  parseWebhookData(payload) {
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      
      // Validate required webhook fields
      if (!data.id || !data.type || !data.created) {
        throw new Error('Invalid webhook structure');
      }
      
      return data;
    } catch (error) {
      throw new SyntaxError('Webhook payload parsing failed');
    }
  }

  async handleWebhookEvent(webhookData) {
    const { type, data } = webhookData;
    
    try {
      switch (type) {
        case 'member.created':
          return await this.handleMemberCreated(data.member);
          
        case 'member.updated':
          return await this.handleMemberUpdated(data.member, data.previous);
          
        case 'member.deleted':
          return await this.handleMemberDeleted(data.member);
          
        case 'member.plan.added':
          return await this.handlePlanAdded(data.member, data.plan);
          
        case 'member.plan.removed':
          return await this.handlePlanRemoved(data.member, data.plan);
          
        case 'member.payment.succeeded':
          return await this.handlePaymentSucceeded(data.member, data.payment);
          
        case 'member.payment.failed':
          return await this.handlePaymentFailed(data.member, data.payment);
          
        default:
          console.warn(`Unhandled webhook event type: ${type}`);
          return { handled: false, type };
      }
    } catch (error) {
      error.message = `Webhook handler failed for ${type}: ${error.message}`;
      throw error;
    }
  }

  async handleMemberCreated(member) {
    // Example: Sync to CRM, send welcome email, etc.
    try {
      await this.syncToCRM(member);
      await this.sendWelcomeEmail(member);
      
      return { handled: true, actions: ['crm_sync', 'welcome_email'] };
    } catch (error) {
      throw new Error(`Member creation webhook failed: ${error.message}`);
    }
  }

  async scheduleWebhookRetry(payload, errorInfo) {
    // Implementation would depend on your queuing system
    // Examples: Redis Queue, AWS SQS, database queue, etc.
    
    const retryJob = {
      id: this.generateRetryId(),
      payload,
      error: errorInfo,
      nextRetry: Date.now() + this.retryDelays[0],
      attempt: 1,
      maxAttempts: this.maxRetries
    };
    
    // Add to retry queue (implementation specific)
    await this.addToRetryQueue(retryJob);
  }

  logWebhookError(error, payload, errorInfo) {
    console.group(`Webhook Error: ${errorInfo.type}`);
    console.error('Error Details:', {
      message: error.message,
      type: errorInfo.type,
      permanent: errorInfo.permanent,
      shouldRetry: errorInfo.shouldRetry,
      webhookId: payload.id,
      webhookType: payload.type
    });
    console.error('Payload:', payload);
    console.error('Stack:', error.stack);
    console.groupEnd();
    
    // Send to monitoring
    this.sendWebhookErrorToMonitoring(error, payload, errorInfo);
  }

  sendWebhookErrorToMonitoring(error, payload, errorInfo) {
    // Example: Send to monitoring service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          service: 'memberstack_webhook',
          webhook_type: payload.type,
          error_type: errorInfo.type,
          permanent: errorInfo.permanent
        },
        extra: {
          webhook_id: payload.id,
          webhook_payload: payload,
          error_info: errorInfo
        }
      });
    }
  }

  generateRetryId() {
    return `retry_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  async addToRetryQueue(retryJob) {
    // Implementation depends on your infrastructure
    // Example implementations:
    
    // Redis Queue
    // await redis.lpush('webhook_retries', JSON.stringify(retryJob));
    
    // Database Queue
    // await db.webhookRetries.create(retryJob);
    
    // AWS SQS
    // await sqs.sendMessage({
    //   QueueUrl: process.env.WEBHOOK_RETRY_QUEUE,
    //   MessageBody: JSON.stringify(retryJob),
    //   DelaySeconds: Math.floor((retryJob.nextRetry - Date.now()) / 1000)
    // }).promise();
    
    console.log('Webhook queued for retry:', retryJob.id);
  }
}

// Express.js webhook endpoint with error handling:
const webhookHandler = new MemberstackWebhookErrorHandler();

app.post('/webhook/memberstack', 
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    const signature = req.headers['memberstack-signature'];
    const secret = process.env.MEMBERSTACK_WEBHOOK_SECRET;
    
    const result = await webhookHandler.processWebhook(
      req.body, 
      signature, 
      secret
    );
    
    if (result.success) {
      res.status(200).json({ received: true });
    } else {
      res.status(result.status).json({
        error: result.error.userMessage,
        retry: result.shouldRetry
      });
    }
  }
);
```

## Error Recovery Patterns

### Automatic Error Recovery System

```javascript
class ErrorRecoverySystem {
  constructor() {
    this.recoveryStrategies = new Map();
    this.setupDefaultStrategies();
  }

  setupDefaultStrategies() {
    // Authentication errors
    this.recoveryStrategies.set('invalid_credentials', async (context) => {
      // Show login form with error message
      return { action: 'show_login', message: 'Please check your credentials' };
    });

    this.recoveryStrategies.set('email_not_verified', async (context) => {
      // Offer to resend verification email
      return { 
        action: 'offer_resend_verification',
        message: 'Please verify your email address',
        autoAction: () => this.resendVerification(context.email)
      };
    });

    // Rate limiting
    this.recoveryStrategies.set('too_many_requests', async (context) => {
      // Implement progressive backoff
      const backoffTime = this.calculateBackoff(context.attemptCount);
      return {
        action: 'wait_and_retry',
        waitTime: backoffTime,
        autoRetry: true
      };
    });

    // Network errors
    this.recoveryStrategies.set('network_error', async (context) => {
      // Retry with exponential backoff
      return {
        action: 'retry_with_backoff',
        maxRetries: 3,
        autoRetry: true
      };
    });

    // Token expiry
    this.recoveryStrategies.set('invalid_token', async (context) => {
      // Attempt token refresh or redirect to login
      try {
        await this.refreshToken(context);
        return { action: 'retry_original_request' };
      } catch (refreshError) {
        return { action: 'redirect_to_login' };
      }
    });
  }

  async recoverFromError(error, context) {
    const strategy = this.recoveryStrategies.get(error.code);
    
    if (!strategy) {
      return this.defaultRecovery(error, context);
    }

    try {
      const recovery = await strategy(context);
      
      // Execute automatic recovery if specified
      if (recovery.autoAction) {
        await recovery.autoAction();
      }
      
      return recovery;
    } catch (recoveryError) {
      console.error('Recovery strategy failed:', recoveryError);
      return this.defaultRecovery(error, context);
    }
  }

  defaultRecovery(error, context) {
    return {
      action: 'show_error',
      message: 'Something went wrong. Please try again.',
      canRetry: true,
      supportContact: true
    };
  }

  async resendVerification(email) {
    try {
      await memberstack.sendMemberVerificationEmail();
      return { success: true, message: 'Verification email sent' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async refreshToken(context) {
    // Attempt to refresh the authentication token
    // Implementation depends on your auth setup
    const { data: member } = await memberstack.getCurrentMember();
    if (member) {
      return { success: true, member };
    }
    throw new Error('Token refresh failed');
  }

  calculateBackoff(attemptCount) {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const backoff = Math.min(baseDelay * Math.pow(2, attemptCount), maxDelay);
    const jitter = Math.random() * 0.1 * backoff;
    return backoff + jitter;
  }

  // Circuit breaker pattern for failing services
  createCircuitBreaker(operation, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000,
      monitorTimeout = 5000
    } = options;

    let failureCount = 0;
    let lastFailureTime = 0;
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

    return async (...args) => {
      // Check circuit state
      if (state === 'OPEN') {
        if (Date.now() - lastFailureTime > resetTimeout) {
          state = 'HALF_OPEN';
        } else {
          throw new Error('Circuit breaker is OPEN');
        }
      }

      try {
        const result = await operation(...args);
        
        // Success - reset failure count
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failureCount = 0;
        }
        
        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = Date.now();
        
        if (failureCount >= failureThreshold) {
          state = 'OPEN';
        }
        
        throw error;
      }
    };
  }
}

// Usage example:
const recovery = new ErrorRecoverySystem();

// Create circuit breaker for external API calls
const robustAPICall = recovery.createCircuitBreaker(
  async (endpoint, data) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    return response.json();
  },
  { failureThreshold: 3, resetTimeout: 30000 }
);

// Main operation with error recovery
async function performOperationWithRecovery(operation, context = {}) {
  let attemptCount = 0;
  const maxAttempts = 3;

  while (attemptCount < maxAttempts) {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      attemptCount++;
      
      const recoveryPlan = await recovery.recoverFromError(error, {
        ...context,
        attemptCount
      });

      // Handle recovery actions
      switch (recoveryPlan.action) {
        case 'retry_with_backoff':
          if (attemptCount < maxAttempts) {
            const delay = recovery.calculateBackoff(attemptCount - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          break;

        case 'wait_and_retry':
          if (recoveryPlan.autoRetry && attemptCount < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, recoveryPlan.waitTime));
            continue;
          }
          break;

        case 'retry_original_request':
          if (attemptCount < maxAttempts) {
            continue;
          }
          break;

        default:
          // Non-retryable error or manual recovery needed
          return {
            success: false,
            error: error,
            recovery: recoveryPlan,
            exhaustedRetries: attemptCount >= maxAttempts
          };
      }
    }
  }

  return {
    success: false,
    error: new Error('Operation failed after maximum retry attempts'),
    exhaustedRetries: true
  };
}
```

## User-Friendly Error Messages

### Error Message Generator

```javascript
class UserFriendlyErrorMessages {
  constructor() {
    this.messages = {
      // Authentication errors
      'invalid_credentials': {
        title: 'Login Failed',
        message: 'The email or password you entered is incorrect.',
        actions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Forgot Password?', action: 'forgot_password' }
        ],
        icon: '🔒'
      },

      'email_not_verified': {
        title: 'Email Verification Required',
        message: 'Please check your email and click the verification link to continue.',
        actions: [
          { label: 'Resend Email', action: 'resend_verification' },
          { label: 'Change Email', action: 'change_email' }
        ],
        icon: '📧'
      },

      'member_not_found': {
        title: 'Account Not Found',
        message: 'We couldn\'t find an account with that email address.',
        actions: [
          { label: 'Create Account', action: 'signup' },
          { label: 'Try Different Email', action: 'retry' }
        ],
        icon: '👤'
      },

      // Validation errors
      'weak_password': {
        title: 'Password Too Weak',
        message: 'Please choose a stronger password with at least 8 characters, including uppercase letters and numbers.',
        actions: [
          { label: 'Try Again', action: 'retry' }
        ],
        icon: '🔐'
      },

      'invalid_email': {
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        actions: [
          { label: 'Try Again', action: 'retry' }
        ],
        icon: '✉️'
      },

      'email_already_exists': {
        title: 'Account Already Exists',
        message: 'An account with this email already exists.',
        actions: [
          { label: 'Sign In Instead', action: 'login' },
          { label: 'Forgot Password?', action: 'forgot_password' }
        ],
        icon: '👥'
      },

      // Rate limiting
      'too_many_requests': {
        title: 'Too Many Attempts',
        message: 'Please wait a moment before trying again.',
        actions: [
          { label: 'Wait and Retry', action: 'wait_retry' }
        ],
        icon: '⏰'
      },

      // Network errors
      'network_error': {
        title: 'Connection Problem',
        message: 'Please check your internet connection and try again.',
        actions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Check Connection', action: 'check_connection' }
        ],
        icon: '🌐'
      },

      // Server errors
      'service_unavailable': {
        title: 'Service Temporarily Unavailable',
        message: 'We\'re experiencing some technical difficulties. Please try again in a few moments.',
        actions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Check Status', action: 'status_page' }
        ],
        icon: '⚠️'
      },

      // Generic fallback
      'unknown_error': {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
        actions: [
          { label: 'Try Again', action: 'retry' },
          { label: 'Contact Support', action: 'contact_support' }
        ],
        icon: '❌'
      }
    };
  }

  getErrorMessage(error, context = {}) {
    const template = this.messages[error.code] || this.messages['unknown_error'];
    
    return {
      ...template,
      originalError: error,
      context,
      timestamp: new Date().toISOString(),
      id: this.generateErrorId()
    };
  }

  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Contextual error messages based on user state
  getContextualMessage(error, userContext) {
    const baseMessage = this.getErrorMessage(error);
    
    // Customize based on user context
    if (userContext.isFirstTimeUser) {
      baseMessage.helpText = "New to our platform? Check out our getting started guide.";
      baseMessage.actions.push({ 
        label: 'Get Help', 
        action: 'help_center' 
      });
    }

    if (userContext.hasPreviousSuccess) {
      baseMessage.message += ' This is unusual - you were able to sign in before.';
    }

    if (userContext.userAgent?.includes('Mobile')) {
      baseMessage.mobileOptimized = true;
      baseMessage.actions = baseMessage.actions.filter(action => 
        ['retry', 'contact_support'].includes(action.action)
      );
    }

    return baseMessage;
  }

  // Generate error message for different UI frameworks
  renderForFramework(errorMessage, framework = 'react') {
    switch (framework) {
      case 'react':
        return this.renderReactComponent(errorMessage);
      case 'vue':
        return this.renderVueComponent(errorMessage);
      case 'html':
        return this.renderHTML(errorMessage);
      default:
        return errorMessage;
    }
  }

  renderReactComponent(errorMessage) {
    return `
const ErrorDisplay = ({ onAction }) => (
  <div className="error-container">
    <div className="error-icon">${errorMessage.icon}</div>
    <h3 className="error-title">${errorMessage.title}</h3>
    <p className="error-message">${errorMessage.message}</p>
    ${errorMessage.helpText ? `<p className="error-help">${errorMessage.helpText}</p>` : ''}
    <div className="error-actions">
      ${errorMessage.actions.map(action => `
        <button 
          key="${action.action}"
          onClick={() => onAction('${action.action}')}
          className="error-action ${action.action}"
        >
          ${action.label}
        </button>
      `).join('')}
    </div>
    <div className="error-meta">
      <small>Error ID: ${errorMessage.id}</small>
    </div>
  </div>
);`;
  }

  renderHTML(errorMessage) {
    return `
<div class="error-container">
  <div class="error-icon">${errorMessage.icon}</div>
  <h3 class="error-title">${errorMessage.title}</h3>
  <p class="error-message">${errorMessage.message}</p>
  ${errorMessage.helpText ? `<p class="error-help">${errorMessage.helpText}</p>` : ''}
  <div class="error-actions">
    ${errorMessage.actions.map(action => `
      <button class="error-action ${action.action}" data-action="${action.action}">
        ${action.label}
      </button>
    `).join('')}
  </div>
  <div class="error-meta">
    <small>Error ID: ${errorMessage.id}</small>
  </div>
</div>`;
  }
}

// Usage example:
const errorMessages = new UserFriendlyErrorMessages();

// In your error handler:
function displayError(error, userContext = {}) {
  const errorDisplay = errorMessages.getContextualMessage(error, userContext);
  
  // Show to user (implementation depends on your UI framework)
  showErrorModal(errorDisplay);
  
  // Log for analytics
  analytics.track('Error Displayed', {
    errorCode: error.code,
    errorId: errorDisplay.id,
    userContext
  });
}

function handleErrorAction(action, errorId) {
  switch (action) {
    case 'retry':
      hideError();
      retryLastOperation();
      break;
      
    case 'forgot_password':
      navigateToForgotPassword();
      break;
      
    case 'signup':
      navigateToSignup();
      break;
      
    case 'contact_support':
      openSupportChat(errorId);
      break;
      
    case 'status_page':
      window.open('https://status.memberstack.com', '_blank');
      break;
      
    default:
      console.warn('Unknown error action:', action);
  }
}
```

## Monitoring and Logging

### Error Monitoring System

```javascript
class MemberstackErrorMonitoring {
  constructor(config = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: true,
      enableAnalytics: true,
      logLevel: 'error', // error, warn, info, debug
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config
    };
    
    this.errorQueue = [];
    this.setupPeriodicFlush();
  }

  logError(error, context = {}, metadata = {}) {
    const errorEntry = this.createErrorEntry(error, context, metadata);
    
    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorEntry);
    }
    
    // Queue for remote logging
    if (this.config.enableRemoteLogging) {
      this.queueForRemoteLogging(errorEntry);
    }
    
    // Analytics tracking
    if (this.config.enableAnalytics) {
      this.trackErrorAnalytics(errorEntry);
    }
    
    return errorEntry.id;
  }

  createErrorEntry(error, context, metadata) {
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      },
      context: {
        service: 'memberstack',
        method: context.method,
        endpoint: context.endpoint,
        userId: context.userId,
        sessionId: context.sessionId,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        ...context
      },
      metadata: {
        severity: this.calculateSeverity(error),
        category: this.categorizeError(error),
        ...metadata
      }
    };
  }

  calculateSeverity(error) {
    if (error.statusCode >= 500) return 'critical';
    if (error.statusCode === 429) return 'warning';
    if (error.statusCode >= 400) return 'error';
    if (error.code === 'network_error') return 'warning';
    return 'info';
  }

  categorizeError(error) {
    const categories = {
      authentication: ['invalid_credentials', 'unauthorized', 'forbidden'],
      validation: ['invalid_email', 'weak_password', 'validation_failed'],
      network: ['network_error', 'timeout', 'connection_failed'],
      server: ['internal_error', 'service_unavailable', 'server_error'],
      rate_limiting: ['too_many_requests', 'rate_limit_exceeded']
    };

    for (const [category, codes] of Object.entries(categories)) {
      if (codes.includes(error.code)) {
        return category;
      }
    }

    return 'unknown';
  }

  logToConsole(errorEntry) {
    const { error, context, metadata } = errorEntry;
    
    const style = this.getConsoleStyle(metadata.severity);
    
    console.group(`%c[Memberstack Error] ${error.code || 'Unknown'}`, style);
    console.error('Message:', error.message);
    console.error('Context:', context);
    console.error('Metadata:', metadata);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    console.groupEnd();
  }

  getConsoleStyle(severity) {
    const styles = {
      critical: 'color: white; background: red; font-weight: bold; padding: 2px 4px;',
      error: 'color: red; font-weight: bold;',
      warning: 'color: orange; font-weight: bold;',
      info: 'color: blue;'
    };
    
    return styles[severity] || styles.info;
  }

  queueForRemoteLogging(errorEntry) {
    this.errorQueue.push(errorEntry);
    
    // Flush immediately for critical errors
    if (errorEntry.metadata.severity === 'critical') {
      this.flushErrorQueue();
    } else if (this.errorQueue.length >= this.config.batchSize) {
      this.flushErrorQueue();
    }
  }

  async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;
    
    const errors = this.errorQueue.splice(0);
    
    try {
      await this.sendErrorsToRemote(errors);
    } catch (sendError) {
      console.error('Failed to send errors to remote logging:', sendError);
      // Re-queue errors for retry
      this.errorQueue.unshift(...errors);
    }
  }

  async sendErrorsToRemote(errors) {
    // Example implementations for different services:
    
    // Sentry
    if (window.Sentry) {
      errors.forEach(errorEntry => {
        window.Sentry.captureException(new Error(errorEntry.error.message), {
          tags: {
            service: errorEntry.context.service,
            category: errorEntry.metadata.category,
            severity: errorEntry.metadata.severity
          },
          extra: {
            memberstackCode: errorEntry.error.code,
            context: errorEntry.context,
            metadata: errorEntry.metadata
          }
        });
      });
      return;
    }
    
    // LogRocket
    if (window.LogRocket) {
      errors.forEach(errorEntry => {
        window.LogRocket.captureException(new Error(errorEntry.error.message));
      });
    }
    
    // Custom logging endpoint
    const response = await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ errors })
    });
    
    if (!response.ok) {
      throw new Error(`Remote logging failed: ${response.status}`);
    }
  }

  trackErrorAnalytics(errorEntry) {
    // Example analytics implementations:
    
    // Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'memberstack_error', {
        error_code: errorEntry.error.code,
        error_category: errorEntry.metadata.category,
        error_severity: errorEntry.metadata.severity,
        custom_map: {
          dimension1: errorEntry.context.method,
          dimension2: errorEntry.context.userId
        }
      });
    }
    
    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track('Memberstack Error', {
        error_code: errorEntry.error.code,
        error_category: errorEntry.metadata.category,
        error_severity: errorEntry.metadata.severity,
        method: errorEntry.context.method,
        user_id: errorEntry.context.userId
      });
    }
    
    // Segment
    if (window.analytics) {
      window.analytics.track('Memberstack Error', {
        errorCode: errorEntry.error.code,
        errorCategory: errorEntry.metadata.category,
        errorSeverity: errorEntry.metadata.severity,
        method: errorEntry.context.method,
        userId: errorEntry.context.userId
      });
    }
  }

  setupPeriodicFlush() {
    setInterval(() => {
      this.flushErrorQueue();
    }, this.config.flushInterval);
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushErrorQueue();
      });
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Error aggregation and insights
  getErrorInsights(timeWindow = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = Date.now() - timeWindow;
    const recentErrors = this.errorQueue.filter(
      error => new Date(error.timestamp).getTime() > cutoff
    );
    
    const insights = {
      totalErrors: recentErrors.length,
      errorsByCategory: {},
      errorsBySeverity: {},
      topErrorCodes: {},
      errorTrends: this.calculateErrorTrends(recentErrors)
    };
    
    recentErrors.forEach(error => {
      // By category
      const category = error.metadata.category;
      insights.errorsByCategory[category] = (insights.errorsByCategory[category] || 0) + 1;
      
      // By severity
      const severity = error.metadata.severity;
      insights.errorsBySeverity[severity] = (insights.errorsBySeverity[severity] || 0) + 1;
      
      // By error code
      const code = error.error.code || 'unknown';
      insights.topErrorCodes[code] = (insights.topErrorCodes[code] || 0) + 1;
    });
    
    return insights;
  }

  calculateErrorTrends(errors) {
    // Simple trend calculation (errors per hour)
    const hourlyBuckets = {};
    
    errors.forEach(error => {
      const hour = new Date(error.timestamp).getHours();
      hourlyBuckets[hour] = (hourlyBuckets[hour] || 0) + 1;
    });
    
    return hourlyBuckets;
  }
}

// Global error monitoring instance
const errorMonitoring = new MemberstackErrorMonitoring({
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableRemoteLogging: true,
  enableAnalytics: true
});

// Export for use in error handlers
export { errorMonitoring };

// Usage in error handlers:
export function logMemberstackError(error, context = {}) {
  return errorMonitoring.logError(error, context);
}

// Dashboard component for error insights
export function ErrorInsightsDashboard() {
  const insights = errorMonitoring.getErrorInsights();
  
  return {
    insights,
    refresh: () => errorMonitoring.getErrorInsights(),
    exportLogs: () => errorMonitoring.exportErrorLogs(),
    clearLogs: () => errorMonitoring.clearErrorLogs()
  };
}
```

This comprehensive error handling guide provides production-ready patterns for handling all types of Memberstack errors across different APIs and scenarios. The implementations include automatic recovery, user-friendly messaging, and comprehensive monitoring to ensure robust error handling in your applications.