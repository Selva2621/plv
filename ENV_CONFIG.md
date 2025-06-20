# Environment Configuration Guide

This guide explains how to set up and use environment variables in the Cosmic Love mobile app.

## Overview

The mobile app now uses environment variables to manage configuration values like API URLs, timeouts, and feature flags. This allows for different configurations across development, staging, and production environments.

## Files Structure

```
mobile/
├── .env                    # Main environment file (gitignored)
├── .env.example           # Template file (committed to git)
├── .env.development       # Development-specific config (gitignored)
├── .env.production        # Production-specific config (gitignored)
├── src/config/env.ts      # Environment configuration module
└── app.json               # Expo configuration with extra fields
```

## Setup Instructions

### 1. Create Your Environment File

Copy the example file and customize it:

```bash
cp .env.example .env
```

### 2. Update Configuration Values

Edit `.env` with your actual values:

```bash
# API Configuration
API_BASE_URL=http://your-backend-server:3000
WEBSOCKET_URL=http://your-backend-server:3000/chat

# App Configuration
APP_NAME=Cosmic Love
APP_VERSION=1.0.0

# Environment flags
NODE_ENV=development
DEBUG_MODE=true

# Timeout configurations (in milliseconds)
API_TIMEOUT=10000
WEBSOCKET_TIMEOUT=10000
WEBSOCKET_RECONNECT_ATTEMPTS=5
WEBSOCKET_RECONNECT_DELAY=1000

# Feature flags
ENABLE_WEBSOCKET=true
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_ANALYTICS=false
```

### 3. Environment-Specific Configuration

For different environments, create specific files:

- `.env.development` - Development settings
- `.env.production` - Production settings
- `.env.staging` - Staging settings (if needed)

## Available Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `API_BASE_URL` | Backend API base URL | `http://localhost:3000` |
| `WEBSOCKET_URL` | WebSocket server URL | `http://localhost:3000/chat` |

### Optional Variables

| Variable | Description | Default | Type |
|----------|-------------|---------|------|
| `APP_NAME` | Application name | `Cosmic Love` | string |
| `APP_VERSION` | Application version | `1.0.0` | string |
| `NODE_ENV` | Environment mode | `development` | string |
| `DEBUG_MODE` | Enable debug logging | `true` | boolean |
| `API_TIMEOUT` | API request timeout (ms) | `10000` | number |
| `WEBSOCKET_TIMEOUT` | WebSocket timeout (ms) | `10000` | number |
| `WEBSOCKET_RECONNECT_ATTEMPTS` | Max reconnection attempts | `5` | number |
| `WEBSOCKET_RECONNECT_DELAY` | Reconnection delay (ms) | `1000` | number |
| `ENABLE_WEBSOCKET` | Enable WebSocket features | `true` | boolean |
| `ENABLE_PUSH_NOTIFICATIONS` | Enable push notifications | `false` | boolean |
| `ENABLE_ANALYTICS` | Enable analytics tracking | `false` | boolean |

## Usage in Code

### Import the configuration

```typescript
import { ENV } from '../config/env';

// Use environment variables
const apiUrl = ENV.API_BASE_URL;
const timeout = ENV.API_TIMEOUT;
const isDebug = ENV.DEBUG_MODE;
```

### Validation

The app automatically validates required environment variables on startup:

```typescript
import { validateEnv } from '../config/env';

// This will throw an error if required variables are missing
validateEnv();
```

## Development vs Production

### Development
- Uses local server URLs
- Debug mode enabled
- Shorter timeouts for faster development
- Analytics disabled

### Production
- Uses production server URLs
- Debug mode disabled
- Longer timeouts for stability
- Analytics enabled
- Push notifications enabled

## Expo Configuration

The `app.json` file includes an `extra` section that mirrors environment variables for Expo builds:

```json
{
  "expo": {
    "extra": {
      "API_BASE_URL": "http://192.168.86.8:3000",
      "WEBSOCKET_URL": "http://192.168.86.8:3000/chat",
      "NODE_ENV": "development"
    }
  }
}
```

## Security Notes

1. **Never commit sensitive data** like API keys or passwords to git
2. **Use .env files for local development** only
3. **Use Expo Secrets or EAS Build environment variables** for production builds
4. **Validate all environment variables** before using them

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   - Check that `.env` file exists
   - Verify variable names match exactly
   - Ensure no extra spaces around values

2. **Values not updating**
   - Restart the Expo development server
   - Clear Metro cache: `expo start --clear`

3. **Production build issues**
   - Update `app.json` extra fields
   - Use EAS Build environment variables for sensitive data

### Debug Environment Loading

The app logs environment configuration on startup when `DEBUG_MODE=true`:

```
🌍 Environment Configuration: {
  NODE_ENV: 'development',
  API_BASE_URL: 'http://192.168.86.8:3000',
  WEBSOCKET_URL: 'http://192.168.86.8:3000/chat',
  DEBUG_MODE: true,
  ENABLE_WEBSOCKET: true
}
```

## Best Practices

1. **Use descriptive variable names** with consistent prefixes
2. **Provide sensible defaults** for optional variables
3. **Document all variables** in this README
4. **Validate critical variables** on app startup
5. **Use environment-specific files** for different deployment targets
6. **Keep sensitive data out of git** using .gitignore
