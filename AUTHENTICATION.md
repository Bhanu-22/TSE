# Authentication

## Overview

This document describes the authentication enhancements made to the TSE Demo Builder, including the modernized login page and logout functionality.

## Enhanced Login Page

### Features

The login page (`src/components/LoginPage.tsx`) now includes:

-   **Logo Display**: Loads application logo from styling configuration with IndexedDB support.
-   **Modern UI**: Enhanced card design with shadows, animations, and improved spacing.
-   **Loading States**: Skeleton loader for logo and spinner for authentication checks.
-   **Error Handling**: Visual error messages with warning icons.
-   **Responsive Design**: Mobile-friendly layout with proper padding.

*Reference: `LoginPage.tsx`*

### Implementation Details

The logo loading follows the same pattern as `TopBar`, supporting both direct URLs and IndexedDB references:

```typescript
// Logo loads from localStorage config
const storedLogoUrl = config?.stylingConfig?.application?.topBar?.logoUrl;

// Handles IndexedDB references
if (storedLogoUrl.startsWith("indexeddb://")) {
  const imageId = storedLogoUrl.replace("indexeddb://", "");
  const imageData = await getImageFromIndexedDB(imageId);
}
```

## Logout Functionality

### Architecture

The logout system consists of three components:

-   **API Function** (`src/services/thoughtspotApi.ts`): Calls ThoughtSpot's logout endpoint.
-   **UI Button** (`src/components/TopBar.tsx`): Logout button in user menu dropdown.
-   **Handler** (`src/components/Layout.tsx`): Manages logout flow and state cleanup.

### Implementation

#### 1. API Function

Added to `src/services/thoughtspotApi.ts`:

```typescript
export async function logoutFromThoughtSpot(): Promise<boolean> {
  try {
    const response = await fetch(`${THOUGHTSPOT_BASE_URL}/auth/session/logout`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    return response.ok;
  } catch (error) {
    console.error("ThoughtSpot logout failed:", error);
    return false;
  }
}
```
*Reference: `thoughtspotApi.ts`*

#### 2. TopBar Integration

The logout button appears in the user menu dropdown with red styling to indicate a destructive action:

```tsx
<button
  onClick={() => {
    onLogout();
    const menu = document.getElementById("user-menu");
    if (menu) menu.style.display = "none";
  }}
  style={{
    color: "#dc2626", // Red color for logout
    fontWeight: "500",
  }}
>
  🚪 Logout
</button>
```

#### 3. Layout Handler

The `handleLogout` function in `Layout.tsx` performs cleanup:

-   Calls the logout API.
-   Clears ThoughtSpot-related `localStorage` items.
-   Clears ThoughtSpot-related `sessionStorage` items.
-   Clears ThoughtSpot cookies.
-   Reloads the page to trigger `SessionChecker`.

*Reference: `SessionChecker.tsx`*

### State Cleanup

The logout handler reuses the same cleanup logic used for cluster URL changes, ensuring consistency:

```javascript
// Clear localStorage
const keysToRemove = Object.keys(localStorage).filter(
  (key) => key.includes("thoughtspot") || key.includes("ts-")
);
keysToRemove.forEach((key) => localStorage.removeItem(key));

// Clear sessionStorage
const sessionKeysToRemove = Object.keys(sessionStorage).filter(
  (key) => key.includes("thoughtspot") || key.includes("ts-")
);
sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));

// Clear cookies
document.cookie.split(";").forEach((cookie) => {
  const name = cookie.split("=")[0];
  if (name.includes("thoughtspot") || name.includes("ts-")) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  }
});
```
*Reference: `configurationService.ts`*

## Integration with SessionChecker

Both features integrate seamlessly with the existing `SessionChecker` component:

-   **Login**: After successful authentication, the page reloads and `SessionChecker` detects a valid session.
-   **Logout**: After logout, the page reloads and `SessionChecker` detects no session, showing the `LoginPage`.

*Reference: `SessionChecker.tsx`*

## Testing

### Login Page

-   Clear browser cookies for ThoughtSpot.
-   Navigate to the application.
-   Verify the logo loads correctly.
-   Test the "Open ThoughtSpot" button.
-   Test the "I'm Logged In" button with and without a valid session.
-   Verify error messages display correctly.

### Logout

-   Log in to the application.
-   Click the user menu in the `TopBar`.
-   Click the "Logout" button.
-   Verify you are redirected to the login page.
-   Verify the ThoughtSpot session is cleared.
-   Verify you cannot access protected pages without re-authentication.

## Notes

-   Logout requires an active ThoughtSpot session to work properly.
-   All ThoughtSpot-related state is cleared on logout for security.
-   A page reload ensures a clean state after logout.
-   The login page logo syncs with the `TopBar` logo configuration.

## Authentication API Functions

The following API functions are used for authentication:

### 1. `loginToThoughtSpot`

Attempts to log in to ThoughtSpot with the provided username and password.

#### Implementation

```typescript
export async function loginToThoughtSpot(username: string, password: string): Promise<boolean> {  
  try {  
    const response = await fetch(`${THOUGHTSPOT_BASE_URL}/auth/session/login`, {  
      method: "POST",  
      headers: {  
        "Accept": "application/json",  
        "Content-Type": "application/json",  
      },  
      body: JSON.stringify({  
        username,  
        password,  
      }),  
      credentials: "include", // Ensures cookie is set for session  
    });  
  
    if (!response.ok) {  
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);  
    }  
  
    return true;  
  } catch (error) {  
    console.error("ThoughtSpot login failed:", error);  
    return false;  
  }  
}
```

-   **POSTs** credentials to `/auth/session/login` endpoint
-   Uses `credentials: "include"` to ensure session cookie is set by browser
-   Returns boolean success status
-   Session cookie is the authentication token (not parsed from response body)

### 2. `logoutFromThoughtSpot`

Logs out of ThoughtSpot and clears the session.

#### Implementation

```typescript
export async function logoutFromThoughtSpot(): Promise<boolean> {    
  try {    
    const response = await fetch(`${THOUGHTSPOT_BASE_URL}/auth/session/logout`, {    
      method: "POST",    
      headers: {    
        "Accept": "application/json",    
        "Content-Type": "application/json",    
      },    
      credentials: "include", // Include session cookies to clear them    
    });    
    
    if (!response.ok) {    
      throw new Error(`Logout failed: ${response.status} ${response.statusText}`);    
    }    
    
    return true;    
  } catch (error) {    
    console.error("ThoughtSpot logout failed:", error);    
    return false;    
  }    
}
```

-   **POSTs** to `/auth/session/logout` endpoint
-   Uses `credentials: "include"` to send session cookie for validation
-   ThoughtSpot server clears the session cookie on successful logout
-   Returns boolean success status

## Alternative Login Interface: Settings Modal

In addition to the main login page, users can also authenticate through the Settings Modal's Connection tab.

### Implementation: `src/components/SettingsModal.tsx:257-434`

#### Features:

-   Username and password input fields
-   Login button that calls `loginToThoughtSpot()`
-   Success banner display without full page reload
-   Integration with "Apply Changes" workflow for URL changes
-   Allows authentication without leaving the application

This provides flexibility for users who need to re-authenticate or switch clusters while working in the application.

## Session Validation

### SessionChecker Component

The `SessionChecker` component wraps the entire application to enforce authentication. It validates the user's session on mount and determines whether to render the login page or application content.

#### Implementation: `src/components/SessionChecker.tsx:127-294`

### Session Check Process

-   **URL Validation** - If no `thoughtspotUrl` configured, set error state and show login page
-   **User Fetch** - Call `getCurrentUser()` to validate session
-   **Session Valid** - If user object returned, render application content
-   **Session Invalid** - If null returned (401 response), show login page
-   **Error Handling** - Distinguish between server connection failures and authentication errors

### SessionChecker Props

The component receives several props for integration with the application:

#### Implementation: `src/components/SessionChecker.tsx:8-15`

-   `children` - Application content to render when authenticated
-   `thoughtspotUrl` - Configured ThoughtSpot cluster URL
-   `onSessionStatusChange` - Callback to notify parent of session status
-   `onConfigureSettings` - Callback to open settings modal
-   `appConfig` - Application configuration object
-   `updateAppConfig` - Function to update configuration

## getCurrentUser API Function

The `getCurrentUser()` function validates the session by fetching current user details:

#### Implementation: `src/services/thoughtspotApi.ts:783-818`

The function:

-   Makes GET request to `/auth/session/user` with session cookie
-   Returns `ThoughtSpotUser` object if authenticated (200 response)
-   Returns null if not authenticated (401 response)
-   Gracefully handles 401 errors as expected behavior

## Session Cookie Management

The application uses HTTP-only session cookies issued by the ThoughtSpot platform. All API requests include `credentials: "include"` in the fetch options to ensure cookies are sent with every request.

### Cookie Configuration

-   **Cookie Type**: HTTP-only session cookie (set by ThoughtSpot, not accessible via JavaScript)
-   **Cookie Scope**: ThoughtSpot domain
-   **Transmission**: `credentials: "include"` sent with all API requests
-   **Lifetime**: Server-controlled by ThoughtSpot session timeout policies
-   **Security**: Secure flag enforced for HTTPS connections

### API Call Cookie Handling

All API calls in the `thoughtspotApi` service include credentials configuration:

```typescript
credentials: "include", // Include session cookies
```

This pattern is used consistently across:

-   `makeThoughtSpotApiCall` - POST requests with JSON body
-   `makeThoughtSpotGetCall` - GET requests
-   `makeThoughtSpotTagsCall` - Tag-specific POST requests
-   `loginToThoughtSpot` - Login authentication
-   `logoutFromThoughtSpot` - Logout cleanup

## Authentication Type Configuration

The application supports different authentication types configured in `appConfig.authType`:

#### Implementation: `src/components/Layout.tsx:1264-1266`

Supported types:

-   **Basic Authentication (default)** - Username/password login
-   **TrustedAuthToken** - Token-based authentication for SSO scenarios

The authentication type affects how ThoughtSpot SDK initialization works. When using `TrustedAuthToken`, the application provides a `getAuthToken` function to the SDK initialization config.

## Error Scenarios and Recovery

### Common Error Scenarios

| Scenario                     | Detection                          | User Experience                     | Recovery Action                          |
|------------------------------|------------------------------------|-------------------------------------|------------------------------------------|
| Invalid Credentials           | `loginToThoughtSpot()` returns false | Error message displayed             | User re-enters correct credentials       |
| Wrong ThoughtSpot URL         | Network error or 404 response      | Error message with URL guidance     | User updates URL in settings             |
| Session Expired During Use   | API calls return 401               | Graceful degradation; empty data    | SessionChecker prompts re-login on next check |
| Server Unavailable            | Network error or 500 response      | Warning banner with settings option | User waits or contacts administrator     |
| No URL Configured            | `thoughtspotUrl` is empty         | Login page with URL input emphasized | User enters and saves ThoughtSpot URL   |

### Session Expiration Handling

When a session expires during active use:

-   Individual API functions return empty data (not errors)
-   Application continues rendering without crashes
-   `SessionChecker`'s next validation cycle detects expired session
-   User is redirected to `LoginPage` for re-authentication

This approach provides graceful degradation rather than immediate logout on first 401 response.

## Security Considerations

### Cookie Security

-   **HTTP-Only Cookies**: Set by ThoughtSpot server; not accessible via JavaScript
-   **Secure Flag**: Enforced for HTTPS connections
-   **SameSite Policy**: Configured by ThoughtSpot server
-   **Credentials Policy**: `credentials: "include"` sends cookies only to ThoughtSpot domain

### Authentication Flow Security

-   **Credentials Transmission**: Username/password sent over HTTPS to ThoughtSpot
-   **Session Token**: Server-side session ID in HTTP-only cookie
-   **No Client-Side Token Storage**: No JWT or tokens stored in localStorage
-   **Server-Side Validation**: All requests validated by ThoughtSpot platform

## Testing

### Login Page Testing

-   Clear browser cookies for ThoughtSpot
-   Navigate to the application
-   Verify the logo loads correctly
-   Enter and save ThoughtSpot URL
-   Enter username and password
-   Test login with valid and invalid credentials
-   Verify error messages display correctly

### Logout Testing

-   Log in to the application
-   Click the user menu in the TopBar
-   Click the "Logout" button
-   Verify you are redirected to the login page
-   Verify the ThoughtSpot session is cleared
-   Verify you cannot access protected pages without re-authentication

### Settings Modal Login Testing

-   Open Settings Modal
-   Navigate to Connection tab
-   Enter credentials and click Login
-   Verify success banner appears
-   Click "Apply Changes" to finalize
-   Verify session is established

## Notes

-   Logout requires an active ThoughtSpot session to work properly
-   All ThoughtSpot-related state is cleared on logout for security
-   A page reload ensures a clean state after logout
-   The login page logo syncs with the TopBar logo configuration
-   Session validation occurs on every page load via SessionChecker
-   The application supports both main login page and Settings Modal login interfaces
-   Authentication type can be configured for SSO scenarios using TrustedAuthToken
