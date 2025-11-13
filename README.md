# TSE Demo Builder  
  
A configurable ThoughtSpot embedding platform that enables rapid prototyping and demonstration of ThoughtSpot analytics embedded in custom applications.  
  
## Overview  
  
TSE Demo Builder is a Next.js-based web application that provides a visual interface for configuring and previewing ThoughtSpot embedded analytics. The application supports multiple embedding scenarios including liveboards, search, Spotter (AI Analyst), and full application embeds.  
  
## Key Features  
  
### Configuration Management  
- **Visual Configuration Editor**: Modify all settings through an intuitive settings modal without editing code  
- **Auto-Save**: Changes are automatically persisted with 1-second debouncing  
- **Import/Export**: Save and share configurations as JSON files  
- **GitHub Integration**: Store configurations in GitHub repositories for version control  
  
### Menu System  
- **Standard Menus**: Pre-configured pages for Home, Favorites, My Reports, Spotter, Search, Full App, and All Content  
- **Custom Menus**: Create unlimited custom pages with specific ThoughtSpot content  
- **Drag-and-Drop Ordering**: Reorder menu items visually  
  
### Multi-User Support  
- **User Profiles**: Define multiple user personas with different access levels  
- **Access Control**: Configure which menus and features each user can access  
- **Runtime Filters**: Apply user-specific data filters  
  
### Styling & Branding  
- **Application Chrome**: Customize colors, logos, and layout  
- **Embedded Content**: Apply custom CSS to ThoughtSpot embeds  
- **Responsive Design**: Works across desktop and mobile devices  
  
### Storage  
- **Hybrid Storage System**: Automatically uses localStorage for small configs (<1MB) and IndexedDB for larger configurations with images  
  
## Getting Started  
  
### Prerequisites  
- Node.js 16+ and npm/yarn  
- Access to a ThoughtSpot instance  
- ThoughtSpot user credentials  
  
### Installation  
  
```bash  
# Clone the repository
git clone https://github.com/Bhanu-22/TSE.git  
cd TSE  
  
# Install dependencies
npm install  
  
# Start development server
npm run dev
```

Open http://localhost:3000 in your browser to see the application.

## Configuration

- Open the application in your browser (typically http://localhost:3000)
- Click the settings icon to open the configuration modal
- Configure your ThoughtSpot instance URL in the "App Config" tab
- Customize menus, styling, and user profiles as needed
- Changes are automatically saved

## Environment Variables

Create a `.env.local` file in the root directory:

```bash
# .env.local
SPOTGPT_API_KEY=your_spotgpt_api_key_here
```

**Note**: The `SPOTGPT_API_KEY` is optional. If not provided:

- Data questions will still work using standard ThoughtSpot integration
- General/conversational chat will be disabled
- Question classification will use rule-based methods instead of AI

## Architecture

The application follows a three-tier architecture:

- **Presentation Layer**: React components with centralized state management via AppContext
- **Service Layer**: Abstraction for ThoughtSpot API, configuration storage, and GitHub integration
- **Storage Layer**: Hybrid localStorage/IndexedDB system for configuration persistence

## How It Works

- **Client (Browser)**: Users interact with the chatbot UI and configuration interface
- **API Routes (Server)**: Next.js API routes act as secure proxies to external services
- **Server-Side Logic**: API routes securely access environment variables and make calls to ThoughtSpot and SpotGPT services

This architecture ensures API keys are never exposed to the user's browser.

## SpotGPT Integration

The application includes optional AI chatbot capabilities powered by SpotGPT:

```javascript
import { SpotGPTClient } from './services/spotgptService';  
  
const client = new SpotGPTClient('your-api-key');  
const response = await client.chat("What are top products by sales?");
```

See SPOTGPT_USAGE_EXAMPLE.md for complete usage examples.

## Deployment to Vercel

1. **Push to Git**: Ensure your code is on GitHub, GitLab, or Bitbucket
2. **Import Project**: In Vercel Dashboard, import the project from your Git repository
3. **Configure Environment Variables**:
   - Go to Settings → Environment Variables
   - Add `SPOTGPT_API_KEY` (optional)
   - Select all environments (Production, Preview, Development)
4. **Deploy**: Click Deploy - Vercel handles the build automatically

## Testing Your Deployment

Visit the test endpoint to verify configuration:

- **Local**: http://localhost:3000/api/spotgpt/test
- **Deployed**: https://your-app-name.vercel.app/api/spotgpt/test

## Troubleshooting

### Common Issues

**API Key Not Found**:
- **Local**: Ensure `.env.local` exists and restart dev server
- **Vercel**: Verify environment variable name is exactly `SPOTGPT_API_KEY` and redeploy

**Network Errors**:
- Check server logs for detailed error messages
- Verify API key is valid and has correct permissions

## Security

- **No Exposed Keys**: API keys are only accessed server-side
- **.gitignore**: `.env.local` is excluded from version control by default
- **Vercel Security**: Environment variables are encrypted and secure