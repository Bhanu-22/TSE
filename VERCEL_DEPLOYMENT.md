# Vercel Deployment Guide

This guide explains how to properly configure environment variables and deploy the TSE Demo Builder application to Vercel.

## Environment Variable Setup

### 1. Local Development

Create a `.env.local` file in your project root:

```bash
# .env.local
SPOTGPT_API_KEY=your_spotgpt_api_key_here
```

**Note**: The `.env.local` file is automatically excluded from version control via `.gitignore`.

### 2. Vercel Deployment

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Name**: `SPOTGPT_API_KEY`
   - **Value**: Your actual SpotGPT API key
   - **Environment**: Select all environments (Production, Preview, Development)
5. Click **Save**
6. Redeploy your application

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Set environment variable
vercel env add SPOTGPT_API_KEY

# Follow the prompts to set the value and select environments
```

#### Option C: Using vercel.json

Create a `vercel.json` file in your project root:

```json
{
  "env": {
    "SPOTGPT_API_KEY": "@spotgpt-api-key"
  }
}
```

Then add the secret using Vercel CLI:

```bash
vercel secrets add spotgpt-api-key your_actual_api_key_here
```

## Deployment Publishing Feature

The application includes a built-in deployment publishing feature that creates GitHub branches and triggers Vercel deployments.

### Required Environment Variables for Publishing

To use the "Publish Deployment" feature in the Settings Modal, configure these additional environment variables in Vercel:

| Variable | Purpose | Required | Format |
|----------|---------|----------|--------|
| `GITHUB_TOKEN` | GitHub API access for creating branches | Yes | `ghp_...` or `github_pat_...` |
| `GITHUB_OWNER` | GitHub repository owner | Yes | `your-username` |
| `GITHUB_REPO` | GitHub repository name | Yes | `your-repo-name` |
| `VERCEL_TOKEN` | Vercel API access token | Yes | `vercel_token_...` |
| `VERCEL_PROJECT_NAME` | Vercel project identifier | Yes | `your-project-name` |

### GitHub Token Permissions

The `GITHUB_TOKEN` requires the following permissions:

- `repo` scope for private repositories
- `public_repo` scope for public repositories
- `workflow` scope if using GitHub Actions integration

### How Publishing Works

1. User clicks "Publish Deployment" in Settings Modal
2. Application creates a new GitHub branch with baked configuration
3. Vercel automatically detects the new branch and triggers deployment
4. User receives deployment URL once complete

## Testing Your Configuration

### 1. Test Endpoint

Visit `/api/spotgpt/test` in your deployed application to check if the API key is properly configured.

Example: `https://your-app.vercel.app/api/spotgpt/test`

This endpoint will return:

- Whether the API key exists
- Environment information
- Deployment instructions if the key is missing

### 2. Expected Response

**Success Response:**

```json
{
  "apiKeyExists": true,
  "apiKeyLength": 200,
  "apiKeyPrefix": "on_pnlKU",
  "message": "SpotGPT API key is configured",
  "apiTest": {
    "success": true,
    "message": "API connection successful"
  },
  "environment": {
    "nodeEnv": "production",
    "vercelEnv": "production",
    "vercelUrl": "your-app.vercel.app",
    "allEnvVars": ["SPOTGPT_API_KEY"],
    "totalEnvVars": 50
  }
}
```

**Error Response:**

```json
{
  "apiKeyExists": false,
  "apiKeyLength": 0,
  "apiKeyPrefix": "N/A",
  "message": "SpotGPT API key is not configured. Please set SPOTGPT_API_KEY in your Vercel deployment settings.",
  "apiTest": null,
  "environment": {
    "nodeEnv": "production",
    "vercelEnv": "production",
    "vercelUrl": "your-app.vercel.app",
    "allEnvVars": [],
    "totalEnvVars": 50
  },
  "deploymentInstructions": {
    "vercel": "Go to your Vercel dashboard > Project Settings > Environment Variables > Add SPOTGPT_API_KEY",
    "local": "Create a .env.local file with SPOTGPT_API_KEY=your_key_here"
  }
}
```

## Troubleshooting

### Common Issues

**API key not found in production**
- Ensure the environment variable is set for the correct environment (Production, Preview, Development)
- Redeploy after adding the environment variable
- Check that the variable name is exactly `SPOTGPT_API_KEY`

**API key works locally but not in Vercel**
- Verify the environment variable is set in Vercel dashboard
- Check that it's enabled for all environments
- Ensure there are no extra spaces or characters in the variable value

**Build fails due to missing environment variable**
- The application is designed to handle missing API keys gracefully
- Check the build logs for any other issues
- Ensure your API key is valid and has the correct format

**Publish Deployment fails**
- Verify all GitHub and Vercel tokens are configured
- Check token permissions and expiration dates
- Review Vercel function logs for detailed error messages

### Debug Steps

1. **Check the test endpoint**: Visit `/api/spotgpt/test` to see detailed environment information
2. **Check Vercel logs**: Go to your Vercel dashboard → Functions → View Function Logs
3. **Verify environment variables**: In Vercel dashboard → Settings → Environment Variables
4. **Test locally**: Ensure your `.env.local` file works correctly

## Security

This application is built with security as a top priority.

- **No Exposed Keys**: The `SPOTGPT_API_KEY` is only accessed on the server-side. It is never sent to the user's browser.
- **.gitignore**: The `.env.local` file is included in the `.gitignore` file by default in Next.js, preventing you from accidentally committing secrets.
- **Vercel Security**: Vercel's environment variable system is encrypted and secure for storing production secrets.
- **API Routes**: All external API calls go through Next.js API routes that run server-side

## Next.js Configuration

The application is configured to keep environment variables server-side only. The `next.config.ts` file does NOT expose the API key to the client:

```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

This ensures that the `SPOTGPT_API_KEY` environment variable is only accessible on the server-side (API routes), never exposed to the browser, which is the correct and secure approach.

## Fallback Behavior

You can run and deploy the application without a `SPOTGPT_API_KEY`. If the key is not provided:

- Data questions will still work perfectly using the standard ThoughtSpot integration
- General/conversational chat will be disabled
- Question classification will use a simpler, rule-based method instead of AI

This allows you to deploy and use the core ThoughtSpot embedding features without requiring SpotGPT integration.
