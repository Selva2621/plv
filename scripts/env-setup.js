#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * This script helps set up environment configuration for the mobile app.
 * It can copy template files, validate configurations, and switch between environments.
 */

const fs = require('fs');
const path = require('path');

const ENV_FILES = {
  main: '.env',
  example: '.env.example',
  development: '.env.development',
  production: '.env.production',
  staging: '.env.staging'
};

const REQUIRED_VARS = ['API_BASE_URL', 'WEBSOCKET_URL'];
const RECOMMENDED_VARS = ['JWT_SECRET', 'ENCRYPTION_KEY']; // Not required but recommended

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Read environment file and parse variables
 */
function readEnvFile(filePath) {
  if (!fileExists(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return vars;
}

/**
 * Validate environment configuration
 */
function validateEnv(envVars) {
  const missing = [];
  const missingRecommended = [];

  REQUIRED_VARS.forEach(varName => {
    if (!envVars[varName]) {
      missing.push(varName);
    }
  });

  RECOMMENDED_VARS.forEach(varName => {
    if (!envVars[varName] || envVars[varName].includes('your-') || envVars[varName].includes('change-this')) {
      missingRecommended.push(varName);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    missingRecommended
  };
}

/**
 * Copy template file to create new environment file
 */
function copyTemplate(source, target) {
  if (fileExists(target)) {
    console.log(`⚠️  ${target} already exists. Skipping copy.`);
    return false;
  }

  if (!fileExists(source)) {
    console.log(`❌ Template file ${source} not found.`);
    return false;
  }

  fs.copyFileSync(source, target);
  console.log(`✅ Created ${target} from ${source}`);
  return true;
}

/**
 * Switch to a specific environment
 */
function switchEnvironment(env) {
  const sourceFile = ENV_FILES[env];
  const targetFile = ENV_FILES.main;

  if (!sourceFile) {
    console.log(`❌ Unknown environment: ${env}`);
    console.log(`Available environments: ${Object.keys(ENV_FILES).filter(k => k !== 'main' && k !== 'example').join(', ')}`);
    return false;
  }

  if (!fileExists(sourceFile)) {
    console.log(`❌ Environment file ${sourceFile} not found.`);
    return false;
  }

  // Backup current .env if it exists
  if (fileExists(targetFile)) {
    const backupFile = `${targetFile}.backup.${Date.now()}`;
    fs.copyFileSync(targetFile, backupFile);
    console.log(`📦 Backed up current .env to ${backupFile}`);
  }

  fs.copyFileSync(sourceFile, targetFile);
  console.log(`✅ Switched to ${env} environment`);
  return true;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Environment Setup Script

Usage:
  node scripts/env-setup.js <command> [options]

Commands:
  init                 Initialize environment files from templates
  validate             Validate current environment configuration
  switch <env>         Switch to a specific environment (development, production, staging)
  help                 Show this help message

Examples:
  node scripts/env-setup.js init
  node scripts/env-setup.js validate
  node scripts/env-setup.js switch development
  node scripts/env-setup.js switch production
`);
}

/**
 * Initialize environment files
 */
function initEnvironment() {
  console.log('🚀 Initializing environment configuration...\n');

  // Copy example to .env if it doesn't exist
  copyTemplate(ENV_FILES.example, ENV_FILES.main);

  console.log('\n📝 Next steps:');
  console.log('1. Edit .env with your actual configuration values');
  console.log('2. Run "node scripts/env-setup.js validate" to check your configuration');
  console.log('3. See ENV_CONFIG.md for detailed documentation');
}

/**
 * Validate current environment
 */
function validateEnvironment() {
  console.log('🔍 Validating environment configuration...\n');

  const envVars = readEnvFile(ENV_FILES.main);
  const validation = validateEnv(envVars);

  if (validation.isValid) {
    console.log('✅ Environment configuration is valid!');

    if (validation.missingRecommended.length > 0) {
      console.log('\n⚠️  Recommended variables need attention:');
      validation.missingRecommended.forEach(varName => {
        console.log(`  - ${varName} (using default or placeholder value)`);
      });
      console.log('\nConsider updating these for production use.');
    }

    console.log('\nLoaded variables:');
    Object.keys(envVars).forEach(key => {
      const value = envVars[key];
      const displayValue = key.toLowerCase().includes('secret') || key.toLowerCase().includes('key')
        ? '***'
        : value;
      console.log(`  ${key}=${displayValue}`);
    });
  } else {
    console.log('❌ Environment configuration is invalid!');
    console.log('\nMissing required variables:');
    validation.missing.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    console.log('\nPlease update your .env file with the missing variables.');
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      initEnvironment();
      break;

    case 'validate':
      validateEnvironment();
      break;

    case 'switch':
      const env = args[1];
      if (!env) {
        console.log('❌ Please specify an environment to switch to.');
        console.log('Usage: node scripts/env-setup.js switch <environment>');
        return;
      }
      switchEnvironment(env);
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      console.log('❌ Unknown command:', command);
      showHelp();
      break;
  }
}

// Run the script
main();
