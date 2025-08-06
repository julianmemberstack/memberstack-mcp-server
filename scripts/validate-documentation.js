#!/usr/bin/env node

/**
 * Memberstack Documentation Validation Script
 * 
 * This script helps validate that the documented Memberstack methods
 * match the actual SDK implementations.
 * 
 * Usage: node scripts/validate-documentation.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Documentation paths
const DOCS_PATH = path.join(__dirname, '..', 'docs');
const DOM_DOC = path.join(DOCS_PATH, 'dom-package', 'dom-api-reference.md');
const ADMIN_DOC = path.join(DOCS_PATH, 'admin-package', 'admin-api-reference.md');
const REST_DOC = path.join(DOCS_PATH, 'rest-api', 'rest-api-reference.md');

// Known Memberstack DOM methods (as documented)
const DOM_METHODS = [
  // Authentication
  'signupMemberEmailPassword',
  'loginMemberEmailPassword',
  'signupWithProvider',
  'loginWithProvider',
  'sendMemberSignupPasswordlessEmail',
  'sendMemberLoginPasswordlessEmail',
  'signupMemberPasswordless',
  'loginMemberPasswordless',
  'logout',
  'onAuthChange',
  'getMemberToken',
  'sendMemberVerificationEmail',
  
  // Profile Management
  'getCurrentMember',
  'updateMember',
  'updateMemberAuth',
  'updateMemberJSON',
  'getMemberJSON',
  'sendMemberResetPasswordEmail',
  'resetMemberPassword',
  'setPassword',
  'connectProvider',
  'disconnectProvider',
  'deleteMember',
  
  // Plan Management
  'getPlan',
  'getPlans',
  'addPlan',
  'removePlan',
  'purchasePlansWithCheckout',
  'launchStripeCustomerPortal',
  
  // Modal Management
  'openModal',
  'hideModal'
];

// Known Memberstack Admin methods (as documented)
const ADMIN_METHODS = [
  'getMembers',
  'getMember',
  'createMember',
  'updateMember',
  'deleteMember',
  'searchMembers',
  'addPlanToMember',
  'removePlanFromMember',
  'updateMemberPlans',
  'verifyToken',
  'generateLoginLink',
  'revokeAllSessions',
  'verifyWebhookSignature'
];

// REST API endpoints (as documented)
const REST_ENDPOINTS = [
  { method: 'GET', path: '/members' },
  { method: 'GET', path: '/members/{id}' },
  { method: 'POST', path: '/members' },
  { method: 'PATCH', path: '/members/{id}' },
  { method: 'DELETE', path: '/members/{id}' },
  { method: 'POST', path: '/members/search' },
  { method: 'GET', path: '/plans' },
  { method: 'GET', path: '/plans/{id}' },
  { method: 'POST', path: '/members/{id}/plans' },
  { method: 'DELETE', path: '/members/{id}/plans/{planId}' },
  { method: 'POST', path: '/auth/verify' },
  { method: 'POST', path: '/auth/login-link' },
  { method: 'POST', path: '/auth/revoke' }
];

async function extractMethodsFromDocs(filePath, isAdminDoc = false) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Exclude sections that contain incorrect examples
    const sectionsToExclude = [
      /### Common Mistakes to Avoid[\s\S]*?(?=###|$)/gm,
      /## Critical Notes for AI Assistants[\s\S]*?(?=##|$)/gm,
      /❌.*?memberstack\.\w+\(/g
    ];
    
    let cleanContent = content;
    sectionsToExclude.forEach(pattern => {
      cleanContent = cleanContent.replace(pattern, '');
    });
    
    let methodPattern;
    if (isAdminDoc) {
      // Match patterns like: memberstackAdmin.methodName(
      methodPattern = /memberstackAdmin\.(\w+)\(/g;
    } else {
      // Match patterns like: memberstack.methodName(
      methodPattern = /memberstack\.(\w+)\(/g;
    }
    
    const methods = new Set();
    let match;
    
    while ((match = methodPattern.exec(cleanContent)) !== null) {
      methods.add(match[1]);
    }
    
    return Array.from(methods);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

async function validateDocumentation() {
  console.log('🔍 Memberstack Documentation Validator\n');
  console.log('=' .repeat(50));
  
  // Check if documentation files exist
  console.log('\n📁 Checking documentation files...\n');
  
  const files = [DOM_DOC, ADMIN_DOC, REST_DOC];
  for (const file of files) {
    try {
      await fs.access(file);
      console.log(`✅ Found: ${path.basename(path.dirname(file))}/${path.basename(file)}`);
    } catch {
      console.log(`❌ Missing: ${path.basename(path.dirname(file))}/${path.basename(file)}`);
    }
  }
  
  // Extract and validate DOM methods
  console.log('\n📋 DOM Package Methods:\n');
  const documentedDomMethods = await extractMethodsFromDocs(DOM_DOC, false);
  
  console.log(`Found ${documentedDomMethods.length} documented methods`);
  console.log(`Expected ${DOM_METHODS.length} methods\n`);
  
  // Check for missing methods
  const missingDom = DOM_METHODS.filter(m => !documentedDomMethods.includes(m));
  if (missingDom.length > 0) {
    console.log('⚠️  Methods in checklist but not found in docs:');
    missingDom.forEach(m => console.log(`   - ${m}`));
  }
  
  // Check for extra methods
  const extraDom = documentedDomMethods.filter(m => !DOM_METHODS.includes(m));
  if (extraDom.length > 0) {
    console.log('\n📝 Additional methods found in docs:');
    extraDom.forEach(m => console.log(`   + ${m}`));
  }
  
  if (missingDom.length === 0 && extraDom.length === 0) {
    console.log('✅ All DOM methods match the expected checklist!');
  }
  
  // Extract and validate Admin methods
  console.log('\n📋 Admin Package Methods:\n');
  const documentedAdminMethods = await extractMethodsFromDocs(ADMIN_DOC, true);
  
  console.log(`Found ${documentedAdminMethods.length} documented methods`);
  console.log(`Expected ${ADMIN_METHODS.length} methods\n`);
  
  // Check for missing admin methods
  const missingAdmin = ADMIN_METHODS.filter(m => !documentedAdminMethods.includes(m));
  if (missingAdmin.length > 0) {
    console.log('⚠️  Admin methods in checklist but not found in docs:');
    missingAdmin.forEach(m => console.log(`   - ${m}`));
  }
  
  // Check for extra admin methods
  const extraAdmin = documentedAdminMethods.filter(m => !ADMIN_METHODS.includes(m));
  if (extraAdmin.length > 0) {
    console.log('\n📝 Additional admin methods found in docs:');
    extraAdmin.forEach(m => console.log(`   + ${m}`));
  }
  
  if (missingAdmin.length === 0 && extraAdmin.length === 0) {
    console.log('✅ All Admin methods match the expected checklist!');
  }
  
  // Generate validation report
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Validation Summary\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    dom: {
      documented: documentedDomMethods.length,
      expected: DOM_METHODS.length,
      coverage: ((documentedDomMethods.length / DOM_METHODS.length) * 100).toFixed(1) + '%'
    },
    admin: {
      documented: documentedAdminMethods.length,
      expected: ADMIN_METHODS.length,
      coverage: ((documentedAdminMethods.length / ADMIN_METHODS.length) * 100).toFixed(1) + '%'
    },
    rest: {
      endpoints: REST_ENDPOINTS.length
    }
  };
  
  console.log('DOM Package Coverage: ' + report.dom.coverage);
  console.log('Admin Package Coverage: ' + report.admin.coverage);
  console.log('REST API Endpoints: ' + report.rest.endpoints);
  
  // Save validation report
  const reportPath = path.join(__dirname, '..', 'validation-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Validation report saved to: validation-report.json`);
  
  // Recommendations
  console.log('\n💡 Recommendations:\n');
  console.log('1. Install @memberstack/dom and @memberstack/admin packages');
  console.log('2. Run actual method signature checks against installed packages');
  console.log('3. Set up automated tests for critical methods');
  console.log('4. Schedule regular documentation reviews');
  console.log('5. Monitor Memberstack changelog for updates');
}

// Run validation
validateDocumentation().catch(console.error);