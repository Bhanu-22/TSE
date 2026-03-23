# ThoughtSpot Demo Builder Application

## How It Works (Architecture)

The application uses a modern, secure client-server architecture built with Next.js.

1. **Client (Browser)**: The user interacts with the chatbot UI. When a user sends a message, client-side functions (defined in `spotgptClient.ts`) are called.
2. **API Routes (Server)**: Instead of calling external services directly from the browser, the client-side functions make requests to internal Next.js API routes (e.g., `/api/spotgpt/chat`). This acts as a secure proxy.
3. **Server-Side Logic**: These API routes, running on the server, securely read the `SPOTGPT_API_KEY` from environment variables. They then make the actual calls to the SpotGPT service and return the response to the client.

This architecture ensures the `SPOTGPT_API_KEY` is never exposed to the user's browser.

---

## Getting Started

Follow these steps to run the application on your local machine.

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Local Setup

1.  **Clone the Repository**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables**
    Create a file named `.env.local` in the root of your project. This file is for local secrets and should not be committed to Git.

    ```bash
    # .env.local
    SPOTGPT_API_KEY=your_spotgpt_api_key_here
    ```
    *If you don't have a `SPOTGPT_API_KEY`, you can leave it blank. See Fallback Behavior.*

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open http://localhost:3000 in your browser to see the application.

## Configuration: The `SPOTGPT_API_KEY`

## Databricks Note

- If the loaded app config sets `provider: "databricks"`, the app uses the Databricks login flow and Databricks dashboard/Genie pages instead of the ThoughtSpot session flow.

### What is SpotGPT?

The `SPOTGPT_API_KEY` is a credential for the SpotGPT service, which provides the generative AI capabilities for this application (general chat, AI-powered question classification). You would typically get this key from your organization's ThoughtSpot administrator or a SpotGPT developer portal.

### Fallback Behavior (Without API Key)

**You can run and deploy the application without a `SPOTGPT_API_KEY`**. If the key is not provided:
- **Data questions will still work perfectly** using the standard ThoughtSpot integration.
- General/conversational chat will be disabled.
- Question classification will use a simpler, rule-based method instead of AI.

---

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

This application is built with security as a top priority.

- **No Exposed Keys**: The `SPOTGPT_API_KEY` is **only** accessed on the server-side. It is never sent to the user's browser.
- **`.gitignore`**: The `.env.local` file is included in the `.gitignore` file by default in Next.js, preventing you from accidentally committing secrets.
- **Vercel Security**: Vercel's environment variable system is encrypted and secure for storing production secrets.

---

## Additional Documentation

For more detailed information on specific features, please refer to the following documents:

- **Authentication Enhancements**: Describes the modernized login page and logout functionality.
- **SpotGPT API Setup**: Guide for setting up the SpotGPT API for chatbot features.
