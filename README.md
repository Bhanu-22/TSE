# ThoughtSpot AI Chat Application

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

### What is SpotGPT?

The `SPOTGPT_API_KEY` is a credential for the SpotGPT service, which provides the generative AI capabilities for this application (general chat, AI-powered question classification). You would typically get this key from your organization's ThoughtSpot administrator or a SpotGPT developer portal.

### Fallback Behavior (Without API Key)

**You can run and deploy the application without a `SPOTGPT_API_KEY`**. If the key is not provided:
- **Data questions will still work perfectly** using the standard ThoughtSpot integration.
- General/conversational chat will be disabled.
- Question classification will use a simpler, rule-based method instead of AI.

---

## Deployment to Vercel

Deploying to Vercel is the recommended way to host this application.

1.  **Push to Git**: Make sure your code is on a GitHub, GitLab, or Bitbucket repository.

2.  **Import Project**: In your Vercel Dashboard, import the project from your Git repository. Vercel will automatically detect it as a Next.js app.

3.  **Configure Environment Variables**:
    - Go to your project's **Settings** → **Environment Variables**.
    - Add a new variable:
      - **Name**: `SPOTGPT_API_KEY`
      - **Value**: Paste your actual SpotGPT API key.
      - **Environment**: Select all environments (Production, Preview, Development).
    - Click **Save**.
    *(Note: You can skip this step if you don't have a key).*

4.  **Deploy**: Click the **Deploy** button. Vercel will handle the build and deployment process automatically. You do **not** need to configure any build or output settings.

## Testing and Troubleshooting

### The Test Endpoint

To verify your `SPOTGPT_API_KEY` configuration, the application includes a built-in test endpoint.

- **Local**: http://localhost:3000/api/spotgpt/test
- **Deployed**: `https://your-app-name.vercel.app/api/spotgpt/test`

This endpoint provides a JSON response detailing whether the key exists, its format, and the status of the connection to the SpotGPT API. It's the first place to check if you suspect an issue.

### Common Issues

- **API Key Not Found**:
  - **Local**: Ensure your file is named `.env.local` and you have restarted the dev server (`npm run dev`) after changing it.
  - **Vercel**: Double-check the variable name is exactly `SPOTGPT_API_KEY` and that you have redeployed after adding it.

- **Network Errors**:
  - Check your server logs (in the terminal for local, or Vercel Dashboard for deployed) for detailed error messages from the API.
  - Verify your API key is valid and has the correct permissions.

## Security

This application is built with security as a top priority.

- **No Exposed Keys**: The `SPOTGPT_API_KEY` is **only** accessed on the server-side. It is never sent to the user's browser.
- **`.gitignore`**: The `.env.local` file is included in the `.gitignore` file by default in Next.js, preventing you from accidentally committing secrets.
- **Vercel Security**: Vercel's environment variable system is encrypted and secure for storing production secrets.