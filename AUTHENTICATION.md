# Authentication Enhancements

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

*Reference: `LoginPage.tsx:12-43`*

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
*Reference: `thoughtspotApi.ts:1104-1128`*

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

*Reference: `SessionChecker.tsx:271-286`*

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
*Reference: `configurationService.ts:1939-1972`*

## Integration with SessionChecker

Both features integrate seamlessly with the existing `SessionChecker` component:

-   **Login**: After successful authentication, the page reloads and `SessionChecker` detects a valid session.
-   **Logout**: After logout, the page reloads and `SessionChecker` detects no session, showing the `LoginPage`.

*Reference: `SessionChecker.tsx:136-192`*

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

---
