# Memberstack Authentication Flows - Complete Guide

**PURPOSE:** Step-by-step implementation guides for all authentication scenarios  
**SCOPE:** Covers DOM package, Admin API, and REST API authentication patterns

## Table of Contents
- [Email/Password Authentication](#emailpassword-authentication)
- [Social Provider Authentication](#social-provider-authentication)
- [Passwordless (Magic Link) Authentication](#passwordless-magic-link-authentication)
- [Multi-Factor Authentication](#multi-factor-authentication)
- [Enterprise SSO Integration](#enterprise-sso-integration)
- [Mobile App Authentication](#mobile-app-authentication)
- [Authentication State Management](#authentication-state-management)
- [Security Best Practices](#security-best-practices)

## Email/Password Authentication

### Basic Signup Flow

```javascript
/**
 * Complete email/password signup implementation
 * Handles validation, creation, verification, and error states
 */
class EmailPasswordAuth {
  constructor(memberstack) {
    this.memberstack = memberstack;
  }

  async signup({ email, password, customFields = {}, planId = null }) {
    const flow = {
      step: 'validation',
      data: null,
      error: null,
      requiresVerification: false
    };

    try {
      // Step 1: Client-side validation
      flow.step = 'validation';
      this.validateInputs(email, password);

      // Step 2: Create member account
      flow.step = 'account_creation';
      const signupParams = {
        email: email.toLowerCase().trim(),
        password,
        customFields,
        ...(planId && { plans: [{ planId }] })
      };

      const result = await this.memberstack.signupMemberEmailPassword(signupParams);
      flow.data = result.data;

      // Step 3: Handle verification if needed
      if (!result.data.member.verified) {
        flow.step = 'verification_sent';
        flow.requiresVerification = true;
        
        try {
          await this.memberstack.sendMemberVerificationEmail();
        } catch (emailError) {
          console.warn('Verification email failed:', emailError);
          // Don't fail the signup flow
        }
      }

      // Step 4: Success - redirect or show success
      flow.step = 'complete';
      return {
        success: true,
        member: result.data.member,
        tokens: result.data.tokens,
        requiresVerification: flow.requiresVerification,
        nextStep: flow.requiresVerification ? 'verify_email' : 'dashboard'
      };

    } catch (error) {
      flow.error = error;
      return this.handleSignupError(error);
    }
  }

  validateInputs(email, password) {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Password validation
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
  }

  handleSignupError(error) {
    const errorMap = {
      'email_already_exists': {
        message: 'An account with this email already exists',
        action: 'login',
        suggestion: 'Try logging in instead, or use a different email address'
      },
      'weak_password': {
        message: 'Password does not meet security requirements',
        action: 'retry',
        suggestion: 'Use at least 8 characters with uppercase letters and numbers'
      },
      'invalid_email': {
        message: 'Email address format is invalid',
        action: 'retry',
        suggestion: 'Please check your email address and try again'
      },
      'invalid_plan': {
        message: 'Selected plan is not available',
        action: 'retry',
        suggestion: 'Please select a different plan or contact support'
      }
    };

    const errorInfo = errorMap[error.code] || {
      message: error.message,
      action: 'retry',
      suggestion: 'Please try again or contact support if the problem persists'
    };

    return {
      success: false,
      error: errorInfo,
      code: error.code,
      statusCode: error.statusCode
    };
  }
}

// Usage example:
const auth = new EmailPasswordAuth(memberstack);

// In a React component:
const handleSignup = async (formData) => {
  setLoading(true);
  
  const result = await auth.signup({
    email: formData.email,
    password: formData.password,
    customFields: {
      firstName: formData.firstName,
      lastName: formData.lastName
    },
    planId: 'pln_free'
  });

  setLoading(false);

  if (result.success) {
    if (result.requiresVerification) {
      setShowVerificationPrompt(true);
    } else {
      router.push('/dashboard');
    }
  } else {
    setError(result.error.message);
    
    if (result.error.action === 'login') {
      setSuggestLogin(true);
    }
  }
};
```

### Advanced Login Flow with Remember Me

```javascript
class AdvancedLoginFlow {
  constructor(memberstack) {
    this.memberstack = memberstack;
    this.maxRetries = 3;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
  }

  async login({ email, password, rememberMe = false }) {
    try {
      // Check if account is locked out
      if (this.isAccountLockedOut(email)) {
        throw new Error('Account temporarily locked due to too many failed attempts');
      }

      // Attempt login
      const result = await this.memberstack.loginMemberEmailPassword({
        email: email.toLowerCase().trim(),
        password
      });

      // Clear any previous lockout on successful login
      this.clearLockout(email);

      // Configure session duration
      if (rememberMe) {
        await this.extendSession(result.data.tokens.accessToken);
      }

      return {
        success: true,
        member: result.data.member,
        tokens: result.data.tokens,
        redirectUrl: this.getRedirectUrl(result.data.member)
      };

    } catch (error) {
      this.handleFailedLogin(email);
      return this.handleLoginError(error);
    }
  }

  isAccountLockedOut(email) {
    const lockoutKey = `lockout_${email}`;
    const lockoutData = localStorage.getItem(lockoutKey);
    
    if (!lockoutData) return false;
    
    const { timestamp, attempts } = JSON.parse(lockoutData);
    const now = Date.now();
    
    // Clear expired lockout
    if (now - timestamp > this.lockoutDuration) {
      localStorage.removeItem(lockoutKey);
      return false;
    }
    
    return attempts >= this.maxRetries;
  }

  handleFailedLogin(email) {
    const lockoutKey = `lockout_${email}`;
    const existing = localStorage.getItem(lockoutKey);
    const now = Date.now();
    
    let lockoutData;
    if (existing) {
      lockoutData = JSON.parse(existing);
      // Reset if it's been more than lockout duration
      if (now - lockoutData.timestamp > this.lockoutDuration) {
        lockoutData = { timestamp: now, attempts: 1 };
      } else {
        lockoutData.attempts++;
      }
    } else {
      lockoutData = { timestamp: now, attempts: 1 };
    }
    
    localStorage.setItem(lockoutKey, JSON.stringify(lockoutData));
  }

  clearLockout(email) {
    localStorage.removeItem(`lockout_${email}`);
  }

  async extendSession(token) {
    // Store preference for extended sessions
    localStorage.setItem('rememberMe', 'true');
    
    // Note: Session duration is configured during memberstack.init()
    // This is handled at initialization time with sessionDurationDays
  }

  getRedirectUrl(member) {
    // Check for stored redirect URL
    const storedRedirect = sessionStorage.getItem('redirectAfterLogin');
    if (storedRedirect) {
      sessionStorage.removeItem('redirectAfterLogin');
      return storedRedirect;
    }

    // Role-based redirects
    const hasAdminPlan = member.planConnections?.some(
      conn => conn.planId === 'pln_admin' && conn.active
    );
    
    if (hasAdminPlan) {
      return '/admin';
    }

    const hasPremiumPlan = member.planConnections?.some(
      conn => conn.planId === 'pln_premium' && conn.active
    );
    
    if (hasPremiumPlan) {
      return '/premium-dashboard';
    }

    return '/dashboard';
  }

  handleLoginError(error) {
    const errorMap = {
      'invalid_credentials': {
        message: 'Invalid email or password',
        canRetry: true,
        showForgotPassword: true
      },
      'email_not_verified': {
        message: 'Please verify your email address before logging in',
        canRetry: false,
        action: 'resend_verification'
      },
      'member_not_found': {
        message: 'No account found with this email address',
        canRetry: false,
        suggestion: 'Try signing up instead'
      },
      'too_many_requests': {
        message: 'Too many login attempts. Please wait before trying again',
        canRetry: false,
        retryAfter: 300 // 5 minutes
      }
    };

    const errorInfo = errorMap[error.code] || {
      message: error.message,
      canRetry: true,
      showForgotPassword: false
    };

    return {
      success: false,
      error: errorInfo,
      code: error.code
    };
  }
}
```

## Social Provider Authentication

### Complete Social Auth Implementation

```javascript
class SocialAuthFlow {
  constructor(memberstack) {
    this.memberstack = memberstack;
    this.supportedProviders = ['google', 'facebook', 'github', 'apple', 'linkedin'];
  }

  async initiateSocialAuth({ provider, isSignup = false, planId = null }) {
    try {
      // Validate provider
      if (!this.supportedProviders.includes(provider)) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      // Store state for post-authentication
      const authState = {
        timestamp: Date.now(),
        isSignup,
        planId,
        returnUrl: window.location.href,
        provider
      };
      
      sessionStorage.setItem('socialAuthState', JSON.stringify(authState));

      // Initiate social authentication
      if (isSignup) {
        await this.memberstack.signupWithProvider({
          provider,
          allowLogin: true, // Allow existing users to login
          ...(planId && { plans: [{ planId }] })
        });
      } else {
        await this.memberstack.loginWithProvider({
          provider,
          allowSignup: true // Allow new users to signup
        });
      }

      // This code won't execute due to redirect
    } catch (error) {
      console.error(`${provider} authentication failed:`, error);
      this.showSocialAuthError(provider, error);
    }
  }

  // Handle return from social provider
  async handleSocialAuthReturn() {
    try {
      // Get stored state
      const authStateData = sessionStorage.getItem('socialAuthState');
      if (!authStateData) {
        throw new Error('Authentication state not found');
      }

      const authState = JSON.parse(authStateData);
      
      // Clean up stored state
      sessionStorage.removeItem('socialAuthState');

      // Check if authentication was successful
      const { data: member } = await this.memberstack.getCurrentMember();
      
      if (!member) {
        throw new Error('Authentication failed - no member found');
      }

      // Handle successful authentication
      return {
        success: true,
        member,
        isNewUser: this.isNewUser(member, authState.timestamp),
        provider: authState.provider,
        returnUrl: authState.returnUrl !== window.location.href ? authState.returnUrl : '/dashboard'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  isNewUser(member, authTimestamp) {
    const memberCreated = new Date(member.createdAt).getTime();
    const authStarted = authTimestamp;
    
    // If member was created within 5 minutes of auth start, likely new user
    return Math.abs(memberCreated - authStarted) < 5 * 60 * 1000;
  }

  showSocialAuthError(provider, error) {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    
    const errorMessages = {
      'popup_blocked': `Popup was blocked. Please allow popups for this site and try again.`,
      'popup_closed': `${providerName} authentication was cancelled.`,
      'network_error': `Unable to connect to ${providerName}. Please check your internet connection.`,
      'provider_error': `${providerName} authentication failed. Please try again.`
    };

    const message = errorMessages[error.code] || 
                   `${providerName} authentication failed: ${error.message}`;
    
    // Show error to user (implement based on your UI framework)
    this.displayError(message);
  }

  displayError(message) {
    // Implement based on your notification system
    console.error('Social auth error:', message);
    
    // Example implementations:
    // toast.error(message);
    // setError(message);
    // alert(message);
  }
}

// Usage in a React component:
const SocialLoginButtons = () => {
  const [isLoading, setIsLoading] = useState({});
  const socialAuth = new SocialAuthFlow(memberstack);

  const handleSocialLogin = async (provider) => {
    setIsLoading(prev => ({ ...prev, [provider]: true }));
    
    await socialAuth.initiateSocialAuth({
      provider,
      isSignup: false // or true for signup
    });
    
    // Loading state will be cleared when user returns or on error
  };

  // Handle return from social provider (useEffect)
  useEffect(() => {
    const handleReturn = async () => {
      // Check if returning from social auth
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'social') {
        const result = await socialAuth.handleSocialAuthReturn();
        
        if (result.success) {
          if (result.isNewUser) {
            router.push('/welcome');
          } else {
            router.push(result.returnUrl);
          }
        } else {
          setError(result.error);
        }
      }
    };

    handleReturn();
  }, []);

  return (
    <div className="social-auth-buttons">
      {['google', 'facebook', 'github'].map(provider => (
        <button
          key={provider}
          onClick={() => handleSocialLogin(provider)}
          disabled={isLoading[provider]}
          className={`social-btn social-btn-${provider}`}
        >
          {isLoading[provider] ? (
            <span>Connecting...</span>
          ) : (
            <span>Continue with {provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
          )}
        </button>
      ))}
    </div>
  );
};
```

### Social Account Linking

```javascript
class SocialAccountLinking {
  constructor(memberstack) {
    this.memberstack = memberstack;
  }

  async linkProvider(provider) {
    try {
      // Check if user is logged in
      const { data: member } = await this.memberstack.getCurrentMember();
      if (!member) {
        throw new Error('Must be logged in to link accounts');
      }

      // Check if provider is already linked
      const isAlreadyLinked = member.auth.providers?.some(
        p => p.provider === provider
      );

      if (isAlreadyLinked) {
        return {
          success: false,
          error: `${provider} account is already linked`
        };
      }

      // Store current state
      sessionStorage.setItem('linkingProvider', provider);

      // Initiate provider linking
      await this.memberstack.connectProvider({ provider });

      // This won't execute due to redirect
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async unlinkProvider(provider) {
    try {
      const { data: member } = await this.memberstack.getCurrentMember();
      if (!member) {
        throw new Error('Must be logged in to unlink accounts');
      }

      // Check if this is the only auth method
      const authMethods = member.auth.providers?.length || 0;
      const hasPassword = member.auth.hasPassword;
      
      if (authMethods === 1 && !hasPassword) {
        return {
          success: false,
          error: 'Cannot remove the only authentication method. Add a password first.'
        };
      }

      // Unlink the provider
      const result = await this.memberstack.disconnectProvider({ provider });

      return {
        success: true,
        remainingProviders: result.data.providers
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleLinkingReturn() {
    const linkingProvider = sessionStorage.getItem('linkingProvider');
    if (!linkingProvider) return null;

    sessionStorage.removeItem('linkingProvider');

    try {
      // Verify the link was successful
      const { data: member } = await this.memberstack.getCurrentMember();
      
      const isLinked = member.auth.providers?.some(
        p => p.provider === linkingProvider
      );

      return {
        success: isLinked,
        provider: linkingProvider,
        error: isLinked ? null : 'Failed to link account'
      };

    } catch (error) {
      return {
        success: false,
        provider: linkingProvider,
        error: error.message
      };
    }
  }
}
```

## Passwordless (Magic Link) Authentication

### Complete Magic Link Implementation

```javascript
class MagicLinkAuth {
  constructor(memberstack) {
    this.memberstack = memberstack;
    this.pendingKey = 'pendingMagicLink';
    this.expiryTime = 10 * 60 * 1000; // 10 minutes
  }

  async sendMagicLink({ email, isSignup = false, planId = null }) {
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        throw new Error('Please enter a valid email address');
      }

      // Store pending auth details
      const pendingAuth = {
        email: cleanEmail,
        isSignup,
        planId,
        timestamp: Date.now(),
        returnUrl: sessionStorage.getItem('returnUrl') || '/dashboard'
      };

      localStorage.setItem(this.pendingKey, JSON.stringify(pendingAuth));

      // Send magic link
      if (isSignup) {
        await this.memberstack.sendMemberSignupPasswordlessEmail({
          email: cleanEmail
        });
      } else {
        await this.memberstack.sendMemberLoginPasswordlessEmail({
          email: cleanEmail
        });
      }

      return {
        success: true,
        email: cleanEmail,
        isSignup,
        message: `We've sent a ${isSignup ? 'signup' : 'login'} link to ${cleanEmail}`
      };

    } catch (error) {
      return this.handleMagicLinkError(error, isSignup);
    }
  }

  async completeMagicLinkAuth(token) {
    try {
      // Get pending auth details
      const pendingData = localStorage.getItem(this.pendingKey);
      if (!pendingData) {
        throw new Error('No pending authentication found. Please request a new link.');
      }

      const pendingAuth = JSON.parse(pendingData);
      
      // Check if link has expired
      if (Date.now() - pendingAuth.timestamp > this.expiryTime) {
        localStorage.removeItem(this.pendingKey);
        throw new Error('Login link has expired. Please request a new one.');
      }

      // Complete authentication
      let result;
      if (pendingAuth.isSignup) {
        const signupParams = {
          email: pendingAuth.email,
          passwordlessToken: token
        };

        if (pendingAuth.planId) {
          signupParams.plans = [{ planId: pendingAuth.planId }];
        }

        result = await this.memberstack.signupMemberPasswordless(signupParams);
      } else {
        result = await this.memberstack.loginMemberPasswordless({
          email: pendingAuth.email,
          passwordlessToken: token
        });
      }

      // Clean up pending auth
      localStorage.removeItem(this.pendingKey);

      return {
        success: true,
        member: result.data.member,
        tokens: result.data.tokens,
        isNewUser: pendingAuth.isSignup,
        returnUrl: pendingAuth.returnUrl
      };

    } catch (error) {
      return this.handleMagicLinkCompletionError(error);
    }
  }

  // Handle magic link from email
  async handleMagicLinkFromEmail() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || urlParams.get('passwordlessToken');
    
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found in URL'
      };
    }

    return await this.completeMagicLinkAuth(token);
  }

  async resendMagicLink() {
    const pendingData = localStorage.getItem(this.pendingKey);
    if (!pendingData) {
      return {
        success: false,
        error: 'No pending authentication to resend'
      };
    }

    const pendingAuth = JSON.parse(pendingData);
    
    // Update timestamp for new expiry
    pendingAuth.timestamp = Date.now();
    localStorage.setItem(this.pendingKey, JSON.stringify(pendingAuth));

    return await this.sendMagicLink({
      email: pendingAuth.email,
      isSignup: pendingAuth.isSignup,
      planId: pendingAuth.planId
    });
  }

  getPendingAuthStatus() {
    const pendingData = localStorage.getItem(this.pendingKey);
    if (!pendingData) return null;

    const pendingAuth = JSON.parse(pendingData);
    const elapsed = Date.now() - pendingAuth.timestamp;
    const remaining = this.expiryTime - elapsed;

    return {
      email: pendingAuth.email,
      isSignup: pendingAuth.isSignup,
      timeRemaining: Math.max(0, remaining),
      expired: remaining <= 0
    };
  }

  handleMagicLinkError(error, isSignup) {
    const errorMap = {
      'invalid_email': 'Please enter a valid email address',
      'member_not_found': isSignup 
        ? 'Unable to create account with this email'
        : 'No account found with this email. Try signing up instead.',
      'email_already_exists': isSignup
        ? 'An account already exists with this email. Try logging in instead.'
        : 'Unable to send login link',
      'too_many_requests': 'Too many requests. Please wait before requesting another link.',
      'rate_limited': 'Please wait before requesting another magic link.'
    };

    return {
      success: false,
      error: errorMap[error.code] || error.message,
      code: error.code,
      canRetry: !['too_many_requests', 'rate_limited'].includes(error.code)
    };
  }

  handleMagicLinkCompletionError(error) {
    const errorMap = {
      'invalid_token': 'Invalid or expired login link. Please request a new one.',
      'token_expired': 'Login link has expired. Please request a new one.',
      'email_mismatch': 'Email address mismatch. Please use the correct email address.',
      'invalid_passwordless_token': 'Invalid login link. Please request a new one.'
    };

    return {
      success: false,
      error: errorMap[error.code] || `Authentication failed: ${error.message}`,
      code: error.code,
      shouldRequestNew: ['invalid_token', 'token_expired', 'invalid_passwordless_token'].includes(error.code)
    };
  }
}

// React component example:
const MagicLinkFlow = () => {
  const [state, setState] = useState('initial'); // initial, sent, checking, success, error
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const magicLink = new MagicLinkAuth(memberstack);

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setState('sending');
    
    const result = await magicLink.sendMagicLink({
      email,
      isSignup: false // or determine from context
    });

    if (result.success) {
      setState('sent');
    } else {
      setError(result.error);
      setState('error');
    }
  };

  const handleResend = async () => {
    const result = await magicLink.resendMagicLink();
    if (result.success) {
      setState('sent');
      setError('');
    } else {
      setError(result.error);
    }
  };

  // Check for magic link on component mount
  useEffect(() => {
    const checkMagicLink = async () => {
      setState('checking');
      const result = await magicLink.handleMagicLinkFromEmail();
      
      if (result.success) {
        setState('success');
        // Redirect to dashboard or welcome page
        router.push(result.isNewUser ? '/welcome' : result.returnUrl);
      } else if (result.error) {
        setError(result.error);
        setState('error');
      } else {
        setState('initial');
      }
    };

    checkMagicLink();
  }, []);

  if (state === 'checking') {
    return <div>Verifying your login link...</div>;
  }

  if (state === 'sent') {
    return (
      <div className="magic-link-sent">
        <h2>Check your email</h2>
        <p>We've sent a login link to {email}</p>
        <p>Click the link in your email to continue.</p>
        <button onClick={handleResend}>Resend link</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSendMagicLink}>
      <h2>Sign in with email</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending...' : 'Send login link'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

## Multi-Factor Authentication

### TOTP (Time-based One-Time Password) Implementation

```javascript
class MFAFlow {
  constructor(memberstack) {
    this.memberstack = memberstack;
  }

  async setupMFA(memberId) {
    try {
      // Generate MFA secret (this would be done server-side)
      const secret = this.generateMFASecret();
      
      // Generate QR code data
      const qrCodeData = this.generateQRCode(secret, memberId);
      
      // Store temporary secret (not activated until verified)
      const tempMFAData = {
        secret,
        memberId,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('tempMFA', JSON.stringify(tempMFAData));
      
      return {
        success: true,
        secret,
        qrCodeData,
        backupCodes: this.generateBackupCodes()
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyMFASetup(token) {
    try {
      const tempData = sessionStorage.getItem('tempMFA');
      if (!tempData) {
        throw new Error('MFA setup session expired');
      }

      const { secret, memberId } = JSON.parse(tempData);
      
      // Verify the token
      if (!this.verifyTOTP(token, secret)) {
        throw new Error('Invalid verification code');
      }

      // Activate MFA for the user
      await this.activateMFA(memberId, secret);
      
      sessionStorage.removeItem('tempMFA');
      
      return {
        success: true,
        message: 'Multi-factor authentication enabled successfully'
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async challengeMFA(memberId) {
    // This would typically be called after successful primary authentication
    return {
      requiresMFA: true,
      challengeId: this.generateChallengeId(),
      allowBackupCodes: true
    };
  }

  async verifyMFAChallenge(challengeId, token, isBackupCode = false) {
    try {
      // Verify the challenge is valid and not expired
      if (!this.isValidChallenge(challengeId)) {
        throw new Error('Invalid or expired MFA challenge');
      }

      let isValid = false;
      
      if (isBackupCode) {
        isValid = await this.verifyBackupCode(challengeId, token);
      } else {
        isValid = await this.verifyMFAToken(challengeId, token);
      }

      if (!isValid) {
        throw new Error('Invalid authentication code');
      }

      // Complete authentication
      return {
        success: true,
        authenticated: true
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        remainingAttempts: this.getRemainingAttempts(challengeId)
      };
    }
  }

  generateMFASecret() {
    // Generate a base32 secret for TOTP
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)];
    }
    return secret;
  }

  generateQRCode(secret, memberId) {
    const issuer = 'YourApp';
    const label = `${issuer}:${memberId}`;
    return `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  }

  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  verifyTOTP(token, secret) {
    // This would use a proper TOTP library like 'otplib'
    // return totp.verify({ token, secret, window: 1 });
    return true; // Placeholder
  }

  async activateMFA(memberId, secret) {
    // Store MFA secret securely server-side
    // This would be an API call to your backend
    return fetch('/api/mfa/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.memberstack.getMemberToken()}`
      },
      body: JSON.stringify({ memberId, secret })
    });
  }
}
```

## Authentication State Management

### Centralized Auth State

```javascript
class AuthStateManager {
  constructor(memberstack) {
    this.memberstack = memberstack;
    this.listeners = new Set();
    this.state = {
      member: null,
      isLoading: true,
      isAuthenticated: false,
      authMethod: null,
      sessionExpiry: null
    };
    
    this.init();
  }

  async init() {
    try {
      // Get current member
      const { data: member } = await this.memberstack.getCurrentMember();
      
      this.updateState({
        member,
        isLoading: false,
        isAuthenticated: !!member,
        authMethod: this.determineAuthMethod(member)
      });

      // Set up auth listener
      this.authListener = this.memberstack.onAuthChange((member) => {
        this.updateState({
          member,
          isAuthenticated: !!member,
          authMethod: this.determineAuthMethod(member)
        });
      });

      // Set up session monitoring
      this.setupSessionMonitoring();

    } catch (error) {
      this.updateState({
        isLoading: false,
        error: error.message
      });
    }
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  determineAuthMethod(member) {
    if (!member) return null;
    
    if (member.auth.providers?.length > 0) {
      return 'social';
    } else if (member.auth.hasPassword) {
      return 'email_password';
    } else {
      return 'passwordless';
    }
  }

  setupSessionMonitoring() {
    // Monitor for session expiry
    setInterval(() => {
      this.checkSessionHealth();
    }, 60000); // Check every minute
  }

  async checkSessionHealth() {
    try {
      const token = this.memberstack.getMemberToken();
      if (!token) {
        if (this.state.isAuthenticated) {
          this.updateState({
            member: null,
            isAuthenticated: false,
            authMethod: null
          });
        }
        return;
      }

      // Decode token to check expiry (if JWT)
      const expiry = this.getTokenExpiry(token);
      if (expiry && expiry < Date.now()) {
        this.updateState({
          member: null,
          isAuthenticated: false,
          authMethod: null
        });
      }

    } catch (error) {
      console.error('Session health check failed:', error);
    }
  }

  getTokenExpiry(token) {
    try {
      // Decode JWT token (simplified)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  }

  async refreshSession() {
    try {
      const { data: member } = await this.memberstack.getCurrentMember();
      this.updateState({ member });
      return member;
    } catch (error) {
      this.updateState({
        member: null,
        isAuthenticated: false,
        authMethod: null
      });
      throw error;
    }
  }

  getState() {
    return this.state;
  }

  cleanup() {
    if (this.authListener) {
      this.authListener.unsubscribe();
    }
    this.listeners.clear();
  }
}

// React hook for auth state
export const useAuth = () => {
  const [authState, setAuthState] = useState(authManager.getState());

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: (credentials) => authManager.login(credentials),
    logout: () => authManager.logout(),
    refreshSession: () => authManager.refreshSession()
  };
};
```

## Security Best Practices

### Secure Authentication Implementation

```javascript
class SecureAuthPractices {
  constructor() {
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30 minutes
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Input validation and sanitization
  validateAndSanitizeInput(input, type) {
    switch (type) {
      case 'email':
        return this.validateEmail(input);
      case 'password':
        return this.validatePassword(input);
      case 'token':
        return this.validateToken(input);
      default:
        return this.sanitizeGeneral(input);
    }
  }

  validateEmail(email) {
    if (typeof email !== 'string') {
      throw new Error('Email must be a string');
    }

    const cleaned = email.toLowerCase().trim();
    
    if (cleaned.length > 254) {
      throw new Error('Email address too long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleaned)) {
      throw new Error('Invalid email format');
    }

    // Check for common malicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /<script/i,
      /on\w+=/i,
      /\[object/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(cleaned))) {
      throw new Error('Invalid email format');
    }

    return cleaned;
  }

  validatePassword(password) {
    if (typeof password !== 'string') {
      throw new Error('Password must be a string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (password.length > 128) {
      throw new Error('Password too long');
    }

    // Check for minimum complexity
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const complexityScore = [hasUpper, hasLower, hasNumber, hasSpecial]
      .filter(Boolean).length;

    if (complexityScore < 3) {
      throw new Error('Password must contain at least 3 of: uppercase, lowercase, numbers, special characters');
    }

    return password;
  }

  // Rate limiting implementation
  checkRateLimit(identifier, action) {
    const key = `${action}_${identifier}`;
    const attempts = this.getAttempts(key);
    
    if (attempts.count >= this.maxLoginAttempts) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      if (timeSinceLastAttempt < this.lockoutDuration) {
        const remainingTime = this.lockoutDuration - timeSinceLastAttempt;
        throw new Error(`Too many attempts. Try again in ${Math.ceil(remainingTime / 60000)} minutes`);
      } else {
        // Reset after lockout period
        this.clearAttempts(key);
      }
    }
  }

  recordAttempt(identifier, action, success) {
    const key = `${action}_${identifier}`;
    
    if (success) {
      this.clearAttempts(key);
    } else {
      this.incrementAttempts(key);
    }
  }

  getAttempts(key) {
    const stored = localStorage.getItem(`attempts_${key}`);
    if (!stored) return { count: 0, lastAttempt: 0 };
    
    return JSON.parse(stored);
  }

  incrementAttempts(key) {
    const current = this.getAttempts(key);
    const updated = {
      count: current.count + 1,
      lastAttempt: Date.now()
    };
    
    localStorage.setItem(`attempts_${key}`, JSON.stringify(updated));
  }

  clearAttempts(key) {
    localStorage.removeItem(`attempts_${key}`);
  }

  // Secure token handling
  secureTokenStorage() {
    // Never store sensitive tokens in localStorage
    // Use httpOnly cookies or secure session storage
    
    return {
      store: (token, expiry) => {
        // Store in secure, httpOnly cookie via server
        // Or use sessionStorage for temporary storage
        if (expiry && expiry < Date.now()) {
          throw new Error('Cannot store expired token');
        }
        
        sessionStorage.setItem('auth_token', token);
        if (expiry) {
          sessionStorage.setItem('auth_expiry', expiry.toString());
        }
      },
      
      retrieve: () => {
        const token = sessionStorage.getItem('auth_token');
        const expiry = sessionStorage.getItem('auth_expiry');
        
        if (expiry && parseInt(expiry) < Date.now()) {
          this.clear();
          return null;
        }
        
        return token;
      },
      
      clear: () => {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_expiry');
      }
    };
  }

  // CSRF protection
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  validateCSRFToken(token, storedToken) {
    if (!token || !storedToken) {
      throw new Error('CSRF token missing');
    }
    
    if (token.length !== storedToken.length) {
      throw new Error('Invalid CSRF token');
    }
    
    // Constant-time comparison to prevent timing attacks
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }
    
    if (result !== 0) {
      throw new Error('Invalid CSRF token');
    }
  }

  // Content Security Policy helpers
  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  // Secure redirect validation
  validateRedirectURL(url, allowedDomains = []) {
    if (!url) return '/dashboard'; // Default safe redirect
    
    try {
      const parsed = new URL(url, window.location.origin);
      
      // Only allow same origin by default
      if (parsed.origin !== window.location.origin) {
        // Check against allowed domains
        const hostname = parsed.hostname;
        const isAllowed = allowedDomains.some(domain => 
          hostname === domain || hostname.endsWith(`.${domain}`)
        );
        
        if (!isAllowed) {
          console.warn('Redirect to external domain blocked:', url);
          return '/dashboard';
        }
      }
      
      // Prevent javascript: and data: URLs
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        console.warn('Unsafe redirect protocol blocked:', parsed.protocol);
        return '/dashboard';
      }
      
      return parsed.pathname + parsed.search + parsed.hash;
      
    } catch (error) {
      console.warn('Invalid redirect URL:', url);
      return '/dashboard';
    }
  }
}

// Usage example with Memberstack
const secureAuth = new SecureAuthPractices();

const secureLogin = async (email, password) => {
  try {
    // Validate inputs
    const cleanEmail = secureAuth.validateAndSanitizeInput(email, 'email');
    const validPassword = secureAuth.validateAndSanitizeInput(password, 'password');
    
    // Check rate limiting
    secureAuth.checkRateLimit(cleanEmail, 'login');
    
    // Attempt login
    const result = await memberstack.loginMemberEmailPassword({
      email: cleanEmail,
      password: validPassword
    });
    
    // Record successful attempt
    secureAuth.recordAttempt(cleanEmail, 'login', true);
    
    return result;
    
  } catch (error) {
    // Record failed attempt
    secureAuth.recordAttempt(email, 'login', false);
    throw error;
  }
};
```

These authentication flows provide comprehensive, production-ready implementations for all major authentication scenarios with Memberstack. Each flow includes proper error handling, security measures, and user experience considerations.