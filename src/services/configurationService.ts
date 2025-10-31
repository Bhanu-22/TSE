import { loadConfigurationFromGitHub } from "./githubApi";
import {
  HomePageConfig,
  AppConfig,
  FullAppConfig,
  StylingConfig,
  UserConfig,
  StandardMenu,
  CustomMenu,
  ConfigurationData,
  ConfigurationSource,
} from "../types/thoughtspot";

// Storage configuration
const STORAGE_KEY = "tse-demo-builder-config";
const INDEXEDDB_NAME = "TSE_Demo_Builder_DB";
const INDEXEDDB_VERSION = 1;
const STORE_NAME = "configurations";
const LARGE_OBJECT_THRESHOLD = 1024 * 1024; // 1MB threshold for using IndexedDB

// Default configuration
export const DEFAULT_CONFIG: ConfigurationData = {
  "standardMenus": [
    {
      "id": "home",
      "name": "Home",
      "enabled": true,
      "icon": "home",
      "homePageType": "html",
      "homePageValue": "<section class=\"gwk-performance\" aria-labelledby=\"gwk-perf-heading\">\n  <style>\n    /* Gatwick-style theme (colors only) — content/structure unchanged */\n    .gwk-performance {\n      /* Light theme (default) */\n      --bg: #f7fafc;\n      --card: #ffffff;\n      --text: #0f172a;   /* near-navy body text */\n      --muted: #475569;  /* secondary text */\n      --accent: #00A0B2; /* Gatwick teal */\n      --good: #14866d;   /* teal-leaning good */\n      --warn: #f59e0b;   /* amber */\n      --bad:  #ef4444;   /* red */\n\n      /* Subtle teal wash in the background */\n      background:\n        radial-gradient(900px 320px at 15% -20%, #CCECEB 0%, transparent 60%),\n        linear-gradient(180deg, #ffffff, #f4f8f9 55%, #ffffff);\n      color: var(--text);\n      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;\n      padding: clamp(24px, 5vw, 56px);\n      border-radius: 18px;\n      border: 1px solid #e5eaef;\n    }\n\n    /* Dark mode palette */\n    @media (prefers-color-scheme: dark) {\n      .gwk-performance {\n        --bg: #0b1020;\n        --card: #111935;\n        --text: #ecf2ff;\n        --muted: #b9c3e6;\n        --accent: #00A0B2; /* keep teal accent in dark too */\n        --good: #34d399;\n        --warn: #f59e0b;\n        --bad:  #ef4444;\n        background: linear-gradient(180deg, var(--bg), #0d1226 50%, #0b1020);\n        border: 1px solid rgba(255,255,255,.08);\n      }\n    }\n\n    .gwk-wrap { max-width: 1100px; margin: 0 auto; }\n    .gwk-eyebrow {\n      display: inline-flex; gap: 8px; align-items: center;\n      font-size: 13px; letter-spacing: .12em; text-transform: uppercase;\n      color: var(--muted); margin-bottom: 10px;\n    }\n    .gwk-eyebrow .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--accent); }\n    #gwk-perf-heading {\n      margin: 0 0 10px 0; font-weight: 800; line-height: 1.1;\n      font-size: clamp(26px, 4vw, 40px);\n    }\n    .gwk-sub {\n      margin: 0 0 24px 0; color: var(--muted);\n      font-size: clamp(14px, 1.8vw, 16px);\n      max-width: 72ch;\n    }\n\n    .gwk-grid {\n      display: grid; gap: 16px;\n      grid-template-columns: repeat(12, 1fr);\n    }\n    .gwk-card {\n      grid-column: span 12;\n      background: var(--card);\n      border: 1px solid rgba(2,16,28,0.08);\n      border-radius: 16px; padding: 18px;\n    }\n    @media (prefers-color-scheme: dark) {\n      .gwk-card { border-color: rgba(255,255,255,.08); }\n    }\n    @media (min-width: 720px) {\n      .gwk-card.kpi { grid-column: span 4; }\n      .gwk-card.story { grid-column: span 12; }\n    }\n\n    .kpi-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }\n    .kpi-title { font-size: 13px; color: var(--muted); }\n    .kpi-badge {\n      font-size: 11px; padding: 4px 8px; border-radius: 999px;\n      background: rgba(0,160,178,.10); color: var(--accent);\n      border: 1px solid rgba(0,160,178,.25);\n    }\n\n    .kpi-value {\n      font-weight: 800; letter-spacing: -0.02em;\n      font-size: clamp(26px, 4vw, 34px); margin: 6px 0 10px 0;\n    }\n\n    .kpi-bar { width: 100%; height: 8px; background: rgba(2,16,28,.06); border-radius: 999px; overflow: hidden; }\n    @media (prefers-color-scheme: dark) { .kpi-bar { background: rgba(255,255,255,.08); } }\n    .kpi-fill { height: 100%; width: var(--pct, 0%); background: var(--good); }\n\n    .kpi-foot { margin-top: 10px; font-size: 12px; color: var(--muted); display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; }\n\n    .story h3 { margin: 0 0 10px 0; font-size: 18px; }\n    .story p { margin: 0 0 12px 0; color: var(--muted); }\n    .gwk-meta { margin-top: 12px; font-size: 12px; color: var(--muted); display:flex; gap:16px; flex-wrap:wrap; }\n    .gwk-cta {\n      margin-top: 18px; display:inline-flex; align-items:center; gap:10px;\n      padding: 10px 14px; background: var(--accent); color: #001820; border-radius: 12px; font-weight: 700; text-decoration: none;\n      box-shadow: 0 6px 20px rgba(0,160,178,.20);\n    }\n  </style>\n\n  <div class=\"gwk-wrap\">\n    <span class=\"gwk-eyebrow\"><span class=\"dot\" aria-hidden=\"true\"></span> Performance Update</span>\n    <h2 id=\"gwk-perf-heading\">Reliability & On-Time Performance</h2>\n    <p class=\"gwk-sub\">\n      We’re improving punctuality while enhancing the passenger experience through better scheduling,\n      smarter gate management, and closer coordination with airline and air-traffic partners.\n    </p>\n\n    <!-- KPI CARDS -->\n    <div class=\"gwk-grid\" role=\"list\" aria-label=\"Key performance indicators\">\n      <!-- KPI 1 -->\n      <article class=\"gwk-card kpi\" role=\"listitem\" aria-labelledby=\"kpi1-title\">\n        <div class=\"kpi-head\">\n          <span id=\"kpi1-title\" class=\"kpi-title\">Average departure delay (2024)</span>\n          <span class=\"kpi-badge\" aria-label=\"Context: system-wide pressure\">Network pressure</span>\n        </div>\n        <div class=\"kpi-value\" aria-live=\"polite\">~23&nbsp;min</div>\n        <div class=\"kpi-bar\" aria-hidden=\"true\">\n          <div class=\"kpi-fill\" style=\"--pct: 46%; background: var(--warn);\"></div>\n        </div>\n        <div class=\"kpi-foot\">\n          <span>Lower is better</span>\n          <span>Benchmark: ≤15&nbsp;min</span>\n        </div>\n      </article>\n\n      <!-- KPI 2 -->\n      <article class=\"gwk-card kpi\" role=\"listitem\" aria-labelledby=\"kpi2-title\">\n        <div class=\"kpi-head\">\n          <span id=\"kpi2-title\" class=\"kpi-title\">On-time arrivals (within 15 min, 2024)</span>\n          <span class=\"kpi-badge\">Annual snapshot</span>\n        </div>\n        <div class=\"kpi-value\">~40%</div>\n        <div class=\"kpi-bar\" aria-hidden=\"true\">\n          <div class=\"kpi-fill\" style=\"--pct: 40%; background: var(--bad);\"></div>\n        </div>\n        <div class=\"kpi-foot\">\n          <span>Higher is better</span>\n          <span>Threshold: 85–90%+</span>\n        </div>\n      </article>\n\n      <!-- KPI 3 -->\n      <article class=\"gwk-card kpi\" role=\"listitem\" aria-labelledby=\"kpi3-title\">\n        <div class=\"kpi-head\">\n          <span id=\"kpi3-title\" class=\"kpi-title\">Overall punctuality (early 2025)</span>\n          <span class=\"kpi-badge\">Recent improvement</span>\n        </div>\n        <div class=\"kpi-value\">~79%</div>\n        <div class=\"kpi-bar\" aria-hidden=\"true\">\n          <div class=\"kpi-fill\" style=\"--pct: 79%; background: var(--good);\"></div>\n        </div>\n        <div class=\"kpi-foot\">\n          <span>Within 15&nbsp;min of schedule</span>\n          <span>Target: ≥85%</span>\n        </div>\n      </article>\n\n      <!-- Narrative -->\n      <article class=\"gwk-card story\">\n        <h3>What we’re doing</h3>\n        <p>\n          We’ve introduced tighter stand planning, collaborative decision-making with airlines, and\n          upgraded gate management systems. Alongside network partners, we’re mitigating air-traffic\n          constraints and optimising runway and taxiway flows to deliver smoother, more predictable journeys.\n        </p>\n        <p>\n          As these measures bed in, we’re seeing a steady improvement in day-to-day punctuality and a reduction\n          in peak-time variability.\n        </p>\n\n        <div class=\"gwk-meta\" aria-label=\"Attribution\">\n          <span>Last updated: <time datetime=\"2025-10-13\">13 Oct 2025</time></span>\n          <span>Metric basis: “on time” = within 15 minutes of schedule</span>\n        </div>\n\n        <!-- Optional link to your fuller report page -->\n        <a class=\"gwk-cta\" href=\"#full-performance-report\" aria-label=\"View full performance report\">\n          View full performance report →\n        </a>\n      </article>\n    </div>\n  </div>\n</section>\n"
    },
    {
      "id": "favorites",
      "name": "Search",
      "enabled": false,
      "icon": "search",
      "homePageType": "html",
      "homePageValue": "<h1>Favorites</h1>",
      "tagFilter": ""
    },
    {
      "id": "my-reports",
      "name": "My Reports",
      "enabled": false,
      "icon": "my-reports",
      "homePageType": "html",
      "homePageValue": "<h1>My Reports</h1>"
    },
    {
      "id": "spotter",
      "name": "Spotter",
      "enabled": true,
      "icon": "spotter-custom.svg",
      "homePageType": "html",
      "homePageValue": "<h1>Spotter</h1>",
      "spotterModelId": "5ba8363c-4940-4407-92e1-453c85308356",
      "spotterSearchQuery": ""
    },
    {
      "id": "search",
      "name": "Search",
      "enabled": true,
      "icon": "search",
      "homePageType": "html",
      "homePageValue": "<h1>Search</h1>",
      "searchDataSource": "5ba8363c-4940-4407-92e1-453c85308356"
    },
    {
      "id": "full-app",
      "name": "Full App",
      "enabled": false,
      "icon": "full-app",
      "homePageType": "html",
      "homePageValue": "<h1>Full App</h1>"
    },
    {
      "id": "all-content",
      "name": "All Content",
      "enabled": false,
      "icon": "📚",
      "homePageType": "html",
      "homePageValue": "<h1>All Content</h1>",
      "excludeSystemContent": true
    }
  ],
  "customMenus": [
    {
      "id": "custom-1760341867406",
      "name": "RTG",
      "description": "",
      "icon": "analytics",
      "enabled": true,
      "contentSelection": {
        "type": "specific",
        "specificContent": {
          "liveboards": [
            "8c3d50f6-d6fc-4400-9258-aad55b6b6f55"
          ],
          "answers": []
        }
      }
    },
    {
      "id": "custom-1760342080199",
      "name": "Ontime Performance",
      "description": "",
      "icon": "analytics",
      "enabled": true,
      "contentSelection": {
        "type": "specific",
        "specificContent": {
          "liveboards": [
            "32201f81-17cf-4448-9c8f-e2ef7f0754fc"
          ],
          "answers": []
        }
      }
    }
  ],
  "menuOrder": [
    "home",
    "spotter",
    "search",
    "custom-1760342080199",
    "custom-1760341867406"
  ],
  "homePageConfig": {
    "type": "html",
    "value": "<h1>Welcome to TSE Demo Builder</h1>"
  },
  "appConfig": {
    "thoughtspotUrl": "https://techpartners.thoughtspot.cloud/",
    "applicationName": "On time performance",
    "logo": "/ts.png",
    "earlyAccessFlags": "enable-modular-home\nenable-custom-styling",
    "favicon": "https://www.gatwickairport.com/on/demandware.static/-/Sites-Gatwick-Library/default/dwe6a3b12e/images/gatwick-main-logo/gatwick-official-airport-parking.svg",
    "showFooter": true,
    "chatbot": {
      "enabled": false,
      "welcomeMessage": "Hello! I'm your AI assistant. What would you like to know about your data?",
      "position": "bottom-right",
      "primaryColor": "#3b82f6",
      "hoverColor": "#2563eb",
      "selectedModelIds": []
    },
    "authType": "None",
    "faviconSyncEnabled": true
  },
  "fullAppConfig": {
    "showPrimaryNavbar": false,
    "hideHomepageLeftNav": false
  },
  "stylingConfig": {
    "application": {
      "topBar": {
        "backgroundColor": "#ffffff",
        "foregroundColor": "#333333",
        "logoUrl": "https://www.gatwickairport.com/on/demandware.static/-/Sites-Gatwick-Library/default/dwe6a3b12e/images/gatwick-main-logo/gatwick-official-airport-parking.svg"
      },
      "sidebar": {
        "backgroundColor": "#f5f5f5",
        "foregroundColor": "#333333"
      },
      "footer": {
        "backgroundColor": "#ffffff",
        "foregroundColor": "#333333"
      },
      "dialogs": {
        "backgroundColor": "#ffffff",
        "foregroundColor": "#333333"
      },
      "buttons": {
        "primary": {
          "backgroundColor": "#3182ce",
          "foregroundColor": "#ffffff",
          "borderColor": "#3182ce",
          "hoverBackgroundColor": "#2c5aa0",
          "hoverForegroundColor": "#ffffff"
        },
        "secondary": {
          "backgroundColor": "#ffffff",
          "foregroundColor": "#374151",
          "borderColor": "#d1d5db",
          "hoverBackgroundColor": "#f9fafb",
          "hoverForegroundColor": "#374151"
        }
      },
      "backgrounds": {
        "mainBackground": "#f7fafc",
        "contentBackground": "#ffffff",
        "cardBackground": "#ffffff",
        "borderColor": "#e2e8f0"
      },
      "typography": {
        "primaryColor": "#1f2937",
        "secondaryColor": "#6b7280",
        "linkColor": "#3182ce",
        "linkHoverColor": "#2c5aa0"
      },
      "selectedTheme": "default"
    },
    "embeddedContent": {
      "strings": {},
      "stringIDs": {},
      "cssUrl": "",
      "customCSS": {
        "variables": {},
        "rules_UNSTABLE": {}
      }
    },
    "embedFlags": {
      "liveboardEmbed": {
        "hideLiveboardHeader": true,
        "fullHeight": true,
        "dataPanelV2": true,
        "defaultHeight": 600,
        "frameParams": {
          "width": 0,
          "height": 0
        }
      }
    },
    "embedDisplay": {
      "hideTitle": true,
      "hideDescription": true
    }
  },
  "userConfig": {
    "users": [
      {
        "id": "power-user",
        "name": "Power User",
        "description": "Full access - can access all features including Search and Full App",
        "locale": "en",
        "access": {
          "standardMenus": {
            "home": true,
            "favorites": true,
            "my-reports": true,
            "spotter": true,
            "search": true,
            "full-app": true,
            "all-content": true
          },
          "customMenus": [
            "custom-1759847126747",
            "custom-1759850260956",
            "custom-1759915645846",
            "custom-1760341867406",
            "custom-1760342080199"
          ],
          "hiddenActions": {
            "enabled": false,
            "actions": []
          }
        }
      },
      {
        "id": "basic-user",
        "name": "Basic User",
        "description": "Limited access - cannot access Search and Full App",
        "locale": "en",
        "access": {
          "standardMenus": {
            "home": true,
            "favorites": true,
            "my-reports": true,
            "spotter": true,
            "search": false,
            "full-app": false,
            "all-content": true
          },
          "customMenus": [],
          "hiddenActions": {
            "enabled": false,
            "actions": []
          }
        }
      }
    ],
    "currentUserId": "power-user"
  }
};

// Old storage keys for migration
const OLD_STORAGE_KEYS = {
  HOME_PAGE_CONFIG: "tse-demo-builder-home-page-config",
  APP_CONFIG: "tse-demo-builder-app-config",
  STANDARD_MENUS: "tse-demo-builder-standard-menus",
  FULL_APP_CONFIG: "tse-demo-builder-full-app-config",
  CUSTOM_MENUS: "tse-demo-builder-custom-menus",
  MENU_ORDER: "tse-demo-builder-menu-order",
  STYLING_CONFIG: "tse-demo-builder-styling-config",
  USER_CONFIG: "tse-demo-builder-user-config",
};

// IndexedDB utilities
const openIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
  });
};

const saveToIndexedDB = async (
  key: string,
  data: ConfigurationData
): Promise<void> => {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key, data, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save to IndexedDB:", error);
    throw error;
  }
};

const loadFromIndexedDB = async (
  key: string
): Promise<ConfigurationData | null> => {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result?.data as ConfigurationData | undefined;
        resolve(result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to load from IndexedDB:", error);
    return null;
  }
};

const removeFromIndexedDB = async (key: string): Promise<void> => {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn("Failed to remove from IndexedDB:", error);
  }
};

// Check if configuration contains large objects (images, etc.)
const isLargeConfiguration = (config: ConfigurationData): boolean => {
  const serialized = JSON.stringify(config);

  // Check total size
  if (serialized.length > LARGE_OBJECT_THRESHOLD) {
    return true;
  }

  // Check for large data URLs (images)
  const dataUrlPattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;
  const dataUrls = serialized.match(dataUrlPattern);

  if (dataUrls) {
    const totalDataUrlSize = dataUrls.reduce((total, url) => {
      // Estimate size: base64 is ~33% larger than binary
      return total + Math.ceil((url.length * 3) / 4);
    }, 0);

    if (totalDataUrlSize > LARGE_OBJECT_THRESHOLD) {
      return true;
    }
  }

  return false;
};

// Migration function to handle old multi-key storage
const migrateFromOldStorage = (): ConfigurationData | null => {
  if (typeof window === "undefined") return null;

  const oldKeys = OLD_STORAGE_KEYS;

  try {
    // Check if any old keys exist
    const hasOldData = Object.values(oldKeys).some(
      (key) => localStorage.getItem(key) !== null
    );

    if (!hasOldData) {
      return null; // No old data to migrate
    }

    console.log("Found old storage format, migrating to new format...");

    // Load data from old keys
    const standardMenus =
      JSON.parse(localStorage.getItem(oldKeys.STANDARD_MENUS) || "null") ||
      DEFAULT_CONFIG.standardMenus;
    const customMenus =
      JSON.parse(localStorage.getItem(oldKeys.CUSTOM_MENUS) || "null") ||
      DEFAULT_CONFIG.customMenus;
    const menuOrder =
      JSON.parse(localStorage.getItem(oldKeys.MENU_ORDER) || "null") ||
      DEFAULT_CONFIG.menuOrder;
    const homePageConfig =
      JSON.parse(localStorage.getItem(oldKeys.HOME_PAGE_CONFIG) || "null") ||
      DEFAULT_CONFIG.homePageConfig;
    const appConfig =
      JSON.parse(localStorage.getItem(oldKeys.APP_CONFIG) || "null") ||
      DEFAULT_CONFIG.appConfig;
    const fullAppConfig =
      JSON.parse(localStorage.getItem(oldKeys.FULL_APP_CONFIG) || "null") ||
      DEFAULT_CONFIG.fullAppConfig;
    const stylingConfig =
      JSON.parse(localStorage.getItem(oldKeys.STYLING_CONFIG) || "null") ||
      DEFAULT_CONFIG.stylingConfig;
    const userConfig =
      JSON.parse(localStorage.getItem(oldKeys.USER_CONFIG) || "null") ||
      DEFAULT_CONFIG.userConfig;

    const migratedConfig: ConfigurationData = {
      standardMenus,
      customMenus,
      menuOrder,
      homePageConfig,
      appConfig,
      fullAppConfig,
      stylingConfig,
      userConfig,
    };

    // Clean up old keys first to free up space
    Object.values(oldKeys).forEach((key) => localStorage.removeItem(key));

    // Save migrated config using new storage system
    saveToStorage(migratedConfig);

    console.log("Migration completed successfully");
    return migratedConfig;
  } catch (error) {
    console.error("Failed to migrate from old storage format:", error);
    // Clean up old keys on error to prevent future migration attempts
    try {
      Object.values(oldKeys).forEach((key) => localStorage.removeItem(key));
    } catch (cleanupError) {
      console.error("Failed to clean up old keys:", cleanupError);
    }
    return null;
  }
};

// Hybrid storage functions
const loadFromStorage = async (): Promise<ConfigurationData> => {
  if (typeof window === "undefined") return DEFAULT_CONFIG;

  try {
    // First, try to load from localStorage (for backward compatibility)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("Loaded configuration from localStorage:", parsed);
      console.log("Loaded userConfig details:", {
        hasUsers: !!parsed.userConfig?.users,
        usersCount: parsed.userConfig?.users?.length || 0,
        currentUserId: parsed.userConfig?.currentUserId,
      });

      // For existing configurations, only add missing fields from DEFAULT_CONFIG, don't overwrite existing values
      const mergedConfig = {
        ...parsed,
        appConfig: {
          ...DEFAULT_CONFIG.appConfig,
          ...parsed.appConfig,
        },
        fullAppConfig: {
          ...DEFAULT_CONFIG.fullAppConfig,
          ...parsed.fullAppConfig,
        },
        stylingConfig: {
          ...DEFAULT_CONFIG.stylingConfig,
          ...parsed.stylingConfig,
        },
        userConfig: {
          ...DEFAULT_CONFIG.userConfig,
          ...parsed.userConfig,
        },
      };

      // Debug logging for merged config
      console.log("Merged config userConfig details (localStorage):", {
        hasUsers: !!mergedConfig.userConfig?.users,
        usersCount: mergedConfig.userConfig?.users?.length || 0,
        currentUserId: mergedConfig.userConfig?.currentUserId,
      });

      return mergedConfig;
    }

    // Try to migrate from old format
    const migrated = migrateFromOldStorage();
    if (migrated) {
      console.log("Successfully migrated from old storage format");
      return migrated;
    }

    // Try to load from IndexedDB
    const indexedDBData = await loadFromIndexedDB(STORAGE_KEY);
    if (indexedDBData) {
      console.log("Loaded configuration from IndexedDB:", indexedDBData);
      console.log("IndexedDB userConfig details:", {
        hasUsers: !!indexedDBData.userConfig?.users,
        usersCount: indexedDBData.userConfig?.users?.length || 0,
        currentUserId: indexedDBData.userConfig?.currentUserId,
      });

      // For existing configurations, only add missing fields from DEFAULT_CONFIG, don't overwrite existing values
      const mergedConfig = {
        ...indexedDBData,
        appConfig: {
          ...DEFAULT_CONFIG.appConfig,
          ...indexedDBData.appConfig,
        },
        fullAppConfig: {
          ...DEFAULT_CONFIG.fullAppConfig,
          ...indexedDBData.fullAppConfig,
        },
        stylingConfig: {
          ...DEFAULT_CONFIG.stylingConfig,
          ...indexedDBData.stylingConfig,
        },
        userConfig: {
          ...DEFAULT_CONFIG.userConfig,
          ...indexedDBData.userConfig,
        },
      };

      // Debug logging for merged config
      console.log("Merged config userConfig details (IndexedDB):", {
        hasUsers: !!mergedConfig.userConfig?.users,
        usersCount: mergedConfig.userConfig?.users?.length || 0,
        currentUserId: mergedConfig.userConfig?.currentUserId,
      });

      return mergedConfig;
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.error("Failed to load configuration:", error);
    console.log("Using default configuration");
    return DEFAULT_CONFIG;
  }
};

const saveToStorage = async (config: ConfigurationData): Promise<void> => {
  if (typeof window === "undefined") return;

  try {
    const isLarge = isLargeConfiguration(config);

    // Debug logging
    console.log("[ConfigurationService] Saving configuration:", {
      hasUsers: !!config.userConfig?.users,
      usersCount: config.userConfig?.users?.length || 0,
      currentUserId: config.userConfig?.currentUserId,
      isLarge,
    });

    if (isLarge) {
      // Save to IndexedDB for large configurations
      await saveToIndexedDB(STORAGE_KEY, config);

      // Remove from localStorage if it exists there
      try {
        localStorage.removeItem(STORAGE_KEY);
        console.log("[ConfigurationService] Removed from localStorage");
      } catch (error) {
        console.warn("Failed to remove from localStorage:", error);
      }
    } else {
      // Save to localStorage for small configurations
      const serializedValue = JSON.stringify(config);
      localStorage.setItem(STORAGE_KEY, serializedValue);

      // Remove from IndexedDB if it exists there
      try {
        await removeFromIndexedDB(STORAGE_KEY);
      } catch (error) {
        console.warn("Failed to remove from IndexedDB:", error);
      }
    }
    // saveToStorage completed successfully
  } catch (error) {
    console.error("Failed to save configuration:", error);

    // Fallback: try localStorage if IndexedDB fails
    if (error instanceof Error && error.message.includes("IndexedDB")) {
      console.log("IndexedDB failed, trying localStorage fallback");
      try {
        const serializedValue = JSON.stringify(config);
        localStorage.setItem(STORAGE_KEY, serializedValue);
        console.log(
          "Successfully saved configuration to localStorage fallback"
        );
      } catch (fallbackError) {
        console.error("Fallback localStorage save also failed:", fallbackError);
      }
    }
  }
};

// Global flag to prevent storage operations during import
let isImportingConfiguration = false;

export const setIsImportingConfiguration = (importing: boolean) => {
  isImportingConfiguration = importing;
};

// Load all configurations from storage
export const loadAllConfigurations = async (): Promise<ConfigurationData> => {
  return await loadFromStorage();
};

// Save all configurations to storage
export const saveAllConfigurations = async (
  config: ConfigurationData
): Promise<void> => {
  await saveToStorage(config);
};

// Individual save functions for backward compatibility
export const saveStandardMenus = async (
  standardMenus: StandardMenu[],
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, standardMenus };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save standard menus: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveCustomMenus = async (
  customMenus: CustomMenu[],
  onError?: (message: string) => void
) => {
  if (isImportingConfiguration) {
    return;
  }

  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, customMenus };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save custom menus: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveMenuOrder = async (
  menuOrder: string[],
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();
    const updatedConfig = { ...currentConfig, menuOrder };
    await saveToStorage(updatedConfig);
  } catch (error) {
    const message = `Failed to save menu order: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveHomePageConfig = async (
  homePageConfig: HomePageConfig,
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();

    // Check if homePageConfig has actually changed
    const hasChanged =
      JSON.stringify(currentConfig.homePageConfig) !==
      JSON.stringify(homePageConfig);

    if (!hasChanged) {
      return;
    }

    const updatedConfig = { ...currentConfig, homePageConfig };
    await saveToStorage(updatedConfig);
    // saveHomePageConfig completed successfully
  } catch (error) {
    const message = `Failed to save home page config: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveAppConfig = async (
  appConfig: AppConfig,
  onError?: (message: string) => void
) => {
  if (isImportingConfiguration) {
    return;
  }

  try {
    const currentConfig = await loadFromStorage();

    // Check if appConfig has actually changed to prevent unnecessary saves
    const hasChanged =
      JSON.stringify(currentConfig.appConfig) !== JSON.stringify(appConfig);

    if (!hasChanged) {
      return;
    }

    // saveAppConfig called with changes

    // IMPORTANT: Replace the entire appConfig, don't merge with existing
    // This ensures that new fields like faviconSyncEnabled are properly saved
    const updatedConfig = {
      ...currentConfig,
      appConfig: { ...appConfig }, // Use the new appConfig directly
    };

    await saveToStorage(updatedConfig);
    // saveAppConfig completed successfully
  } catch (error) {
    const message = `Failed to save app config: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveFullAppConfig = async (
  fullAppConfig: FullAppConfig,
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();

    // Check if fullAppConfig has actually changed
    const hasChanged =
      JSON.stringify(currentConfig.fullAppConfig) !==
      JSON.stringify(fullAppConfig);

    if (!hasChanged) {
      return;
    }

    const updatedConfig = { ...currentConfig, fullAppConfig };
    await saveToStorage(updatedConfig);
    // saveFullAppConfig completed successfully
  } catch (error) {
    const message = `Failed to save full app config: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveStylingConfig = async (
  stylingConfig: StylingConfig,
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();

    // Check if stylingConfig has actually changed
    const hasChanged =
      JSON.stringify(currentConfig.stylingConfig) !==
      JSON.stringify(stylingConfig);

    if (!hasChanged) {
      return;
    }

    const updatedConfig = { ...currentConfig, stylingConfig };
    await saveToStorage(updatedConfig);
    // saveStylingConfig completed successfully
  } catch (error) {
    const message = `Failed to save styling config: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

export const saveUserConfig = async (
  userConfig: UserConfig,
  onError?: (message: string) => void
) => {
  try {
    const currentConfig = await loadFromStorage();

    // Check if userConfig has actually changed
    const hasChanged =
      JSON.stringify(currentConfig.userConfig) !== JSON.stringify(userConfig);

    if (!hasChanged) {
      return;
    }

    const updatedConfig = { ...currentConfig, userConfig };
    await saveToStorage(updatedConfig);
    console.log("[ConfigurationService] saveUserConfig completed successfully");
  } catch (error) {
    const message = `Failed to save user config: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(message);
    onError?.(message);
  }
};

// Clear all configurations
export const clearAllConfigurations = async () => {
  if (typeof window === "undefined") return;

  try {
    // Clear from both storage systems
    localStorage.removeItem(STORAGE_KEY);
    await removeFromIndexedDB(STORAGE_KEY);

    // Also clear any old keys that might exist
    const oldKeys = OLD_STORAGE_KEYS;
    Object.values(oldKeys).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (keyError) {
        console.warn(`Failed to remove old key ${key}:`, keyError);
      }
    });

    console.log("Cleared all storage configurations");
    return {
      success: true,
      message: "All configurations cleared and defaults restored",
    };
  } catch (error) {
    console.error("Failed to clear storage:", error);
    return {
      success: false,
      message: `Failed to clear configurations: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

// Clear storage and reload defaults
export const clearStorageAndReloadDefaults = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  if (typeof window === "undefined") {
    return {
      success: false,
      message: "Storage not available in server environment",
    };
  }

  try {
    // Clear from both storage systems
    localStorage.removeItem(STORAGE_KEY);
    await removeFromIndexedDB(STORAGE_KEY);

    // Also clear any old keys that might exist
    const oldKeys = OLD_STORAGE_KEYS;
    Object.values(oldKeys).forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (keyError) {
        console.warn(`Failed to remove old key ${key}:`, keyError);
      }
    });

    return {
      success: true,
      message:
        "Storage cleared successfully. Default configurations have been restored.",
    };
  } catch (error) {
    console.error("Failed to clear storage and reload defaults:", error);
    return {
      success: false,
      message: `Failed to clear storage: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

// Storage health check
export const checkStorageHealth = async (): Promise<{
  healthy: boolean;
  currentSize: number;
  quota: number;
  usagePercentage: number;
  message: string;
  storageType: "localStorage" | "indexedDB" | "none";
}> => {
  if (typeof window === "undefined") {
    return {
      healthy: false,
      currentSize: 0,
      quota: 0,
      usagePercentage: 0,
      message: "Storage not available in server environment",
      storageType: "none",
    };
  }

  try {
    // Check localStorage
    const localStorageData = localStorage.getItem(STORAGE_KEY);
    if (localStorageData) {
      const currentSize = localStorageData.length;
      const quota = 5 * 1024 * 1024; // 5MB
      const usagePercentage = (currentSize / quota) * 100;

      return {
        healthy: usagePercentage < 90,
        currentSize,
        quota,
        usagePercentage,
        message: `localStorage usage: ${usagePercentage.toFixed(1)}%`,
        storageType: "localStorage",
      };
    }

    // Check IndexedDB
    const indexedDBData = await loadFromIndexedDB(STORAGE_KEY);
    if (indexedDBData) {
      const serialized = JSON.stringify(indexedDBData);
      const currentSize = serialized.length;
      const quota = 50 * 1024 * 1024; // 50MB for IndexedDB
      const usagePercentage = (currentSize / quota) * 100;

      return {
        healthy: usagePercentage < 90,
        currentSize,
        quota,
        usagePercentage,
        message: `IndexedDB usage: ${usagePercentage.toFixed(1)}%`,
        storageType: "indexedDB",
      };
    }

    return {
      healthy: true,
      currentSize: 0,
      quota: 0,
      usagePercentage: 0,
      message: "No stored configuration found",
      storageType: "none",
    };
  } catch (error) {
    return {
      healthy: false,
      currentSize: 0,
      quota: 0,
      usagePercentage: 0,
      message: "Unable to check storage health",
      storageType: "none",
    };
  }
};

// Load configuration from various sources
export const loadConfigurationFromSource = async (
  source: ConfigurationSource,
  updateFunctions?: ConfigurationUpdateFunctions
): Promise<{
  success: boolean;
  data?: ConfigurationData;
  error?: string;
}> => {
  try {
    let configData: Record<string, unknown>;

    if (source.type === "file") {
      // Load from local file
      const file = source.data as File;
      const text = await file.text();
      configData = JSON.parse(text);
      console.log("Loaded configuration from file:", configData);
    } else {
      // Load from GitHub
      const filename = source.data as string;
      configData = await loadConfigurationFromGitHub(filename);
      console.log("Loaded configuration from GitHub:", configData);
    }

    // Validate basic structure
    if (!configData.version || !configData.timestamp) {
      console.warn("Missing version or timestamp in configuration");
      // Don't fail for missing version/timestamp, just warn
    }

    // Log all fields in the imported configuration for debugging
    console.log("Configuration fields:", Object.keys(configData));

    // Check for missing or unknown fields and log them
    const expectedFields = [
      "standardMenus",
      "customMenus",
      "menuOrder",
      "homePageConfig",
      "appConfig",
      "fullAppConfig",
      "stylingConfig",
      "userConfig",
    ];

    const missingFields = expectedFields.filter((field) => !configData[field]);
    const unknownFields = Object.keys(configData).filter(
      (field) =>
        !expectedFields.includes(field) &&
        field !== "version" &&
        field !== "timestamp" &&
        field !== "description"
    );

    if (missingFields.length > 0) {
      console.log("Missing fields in configuration:", missingFields);
    }

    if (unknownFields.length > 0) {
      console.log("Unknown fields in configuration:", unknownFields);
    }

    // Validate required fields exist
    const requiredFields = [
      "standardMenus",
      "homePageConfig",
      "appConfig",
      "fullAppConfig",
      "stylingConfig",
      "userConfig",
    ];
    for (const field of requiredFields) {
      if (!configData[field]) {
        console.error(`Missing required field: ${field}`);
        return { success: false, error: `Missing required field: ${field}` };
      }
    }

    // Merge with defaults to handle missing fields gracefully
    // Ensure all DEFAULT_CONFIG menus are present in the loaded configuration
    const storedStandardMenus =
      (configData.standardMenus as StandardMenu[]) || [];
    const mergedStandardMenus = [...DEFAULT_CONFIG.standardMenus];

    // Add any stored menus that aren't in DEFAULT_CONFIG
    storedStandardMenus.forEach((storedMenu) => {
      if (
        !mergedStandardMenus.find(
          (defaultMenu) => defaultMenu.id === storedMenu.id
        )
      ) {
        mergedStandardMenus.push(storedMenu);
      }
    });

    // Update stored menus with any new properties from DEFAULT_CONFIG
    mergedStandardMenus.forEach((mergedMenu) => {
      const defaultMenu = DEFAULT_CONFIG.standardMenus.find(
        (m) => m.id === mergedMenu.id
      );
      if (defaultMenu) {
        // Merge properties, keeping stored values but adding new default properties
        Object.assign(mergedMenu, defaultMenu, mergedMenu);
      }
    });

    const mergedConfig: ConfigurationData = {
      standardMenus: mergedStandardMenus,
      customMenus:
        (configData.customMenus as CustomMenu[]) || DEFAULT_CONFIG.customMenus,
      menuOrder: (() => {
        const storedOrder = (configData.menuOrder as string[]) || [];
        const mergedOrder = [...DEFAULT_CONFIG.menuOrder];

        // Add any stored menu IDs that aren't in DEFAULT_CONFIG
        storedOrder.forEach((storedId) => {
          if (!mergedOrder.includes(storedId)) {
            mergedOrder.push(storedId);
          }
        });

        return mergedOrder;
      })(),
      homePageConfig:
        (configData.homePageConfig as HomePageConfig) ||
        DEFAULT_CONFIG.homePageConfig,
      appConfig:
        (configData.appConfig as AppConfig) || DEFAULT_CONFIG.appConfig,
      fullAppConfig:
        (configData.fullAppConfig as FullAppConfig) ||
        DEFAULT_CONFIG.fullAppConfig,
      stylingConfig:
        (configData.stylingConfig as StylingConfig) ||
        DEFAULT_CONFIG.stylingConfig,
      userConfig:
        (configData.userConfig as UserConfig) || DEFAULT_CONFIG.userConfig,
    };

    console.log("Merged configuration:", {
      standardMenus: mergedConfig.standardMenus.length,
      customMenus: mergedConfig.customMenus.length,
      menuOrder: mergedConfig.menuOrder.length,
      hasHomePageConfig: !!mergedConfig.homePageConfig,
      hasAppConfig: !!mergedConfig.appConfig,
      hasFullAppConfig: !!mergedConfig.fullAppConfig,
      hasStylingConfig: !!mergedConfig.stylingConfig,
      hasUserConfig: !!mergedConfig.userConfig,
    });

    // Debug menu order specifically
    console.log("Menu order debug:", {
      finalMenuOrder: mergedConfig.menuOrder,
      allContentIncluded: mergedConfig.menuOrder.includes("all-content"),
      allContentIndex: mergedConfig.menuOrder.indexOf("all-content"),
      defaultMenuOrder: DEFAULT_CONFIG.menuOrder,
      storedMenuOrder: configData.menuOrder,
    });

    // Debug user configuration
    console.log("User configuration details:", {
      users: mergedConfig.userConfig.users?.length || 0,
      currentUserId: mergedConfig.userConfig.currentUserId,
      userConfig: mergedConfig.userConfig,
    });

    // Debug standard menus for models
    console.log(
      "Standard menus with models:",
      mergedConfig.standardMenus.map((menu) => ({
        id: menu.id,
        name: menu.name,
        spotterModelId: menu.spotterModelId,
        searchDataSource: menu.searchDataSource,
        searchTokenString: menu.searchTokenString,
        runSearch: menu.runSearch,
      }))
    );

    // Validate that the imported data has the correct structure
    if (!Array.isArray(mergedConfig.standardMenus)) {
      return { success: false, error: "Invalid standardMenus format" };
    }

    if (!Array.isArray(mergedConfig.customMenus)) {
      return { success: false, error: "Invalid customMenus format" };
    }

    if (!Array.isArray(mergedConfig.menuOrder)) {
      return { success: false, error: "Invalid menuOrder format" };
    }

    // Convert data URLs to IndexedDB references before applying
    const configWithIndexedDB = await convertDataURLsToIndexedDBReferences(
      mergedConfig
    );

    // If update functions are provided, automatically apply the configuration
    if (updateFunctions) {
      console.log("Automatically applying loaded configuration...");
      applyConfiguration(configWithIndexedDB, updateFunctions);
    }

    return { success: true, data: configWithIndexedDB };
  } catch (error) {
    console.error("Error in loadConfigurationFromSource:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to parse configuration file",
    };
  }
};

export const pushConfigurationToGitHub = async (    
  customName?: string,  
  thoughtSpotUser?: { name: string; display_name: string } | null  
): Promise<{ success: boolean; url?: string; error?: string }> => {    
  console.log('[DEBUG] pushConfigurationToGitHub called');    
  try {    
    const config = await loadFromStorage();    
    console.log('[DEBUG] Config loaded from storage');    
  
    // Use ThoughtSpot user display name if available  
    let username = 'unknown-user';  
    if (thoughtSpotUser?.display_name) {  
      username = thoughtSpotUser.display_name.replace(/\\s+/g, '-'); // Replace spaces with hyphens  
    } else {  
      const currentUser = config.userConfig?.users?.find(    
        u => u.id === config.userConfig?.currentUserId    
      );    
      username = currentUser?.name || 'unknown-user';  
    }      
    const exportableConfig = await convertIndexedDBReferencesToDataURLs(config);    
    console.log('[DEBUG] Config converted to exportable format');    
       
    const configWithMetadata = {    
      version: "1.0.0",    
      timestamp: new Date().toISOString(),    
      description: "7Dxperts TSE Demo Builder Configuration Export",    
      ...exportableConfig,    
    };    
   
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);    
    const filename = customName    
      ? `${username}-${customName}-${timestamp}.json`    
      : `${username}-${timestamp}.json`;  
      console.log('[DEBUG] Calling /api/push-config with filename:', filename);
 
    // Call API route  
    const response = await fetch('/api/push-config', {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json',  
      },  
      body: JSON.stringify({  
        filename,  
        content: JSON.stringify(configWithMetadata, null, 2),  
        commitMessage: `Update configuration: ${filename}`,  
      }),  
    });  
    console.log('[DEBUG] Response status:', response.status);  
    console.log('[DEBUG] Response ok:', response.ok);  
 
    const result = await response.json();  
    console.log('[DEBUG] Response body:', result);
 
    if (!response.ok) {
      console.error('[DEBUG] Push to GitHub failed:', result.error);
      return { success: false, error: result.error || 'Failed to push to GitHub' };
    }
 
    return { success: true, url: result.url };
  } catch (error) {
    console.error('[DEBUG] Error in pushConfigurationToGitHub:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DEBUG] Fetch failed: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const publishDeployment = async (  
  
  customName?: string  
): Promise<{ success: boolean; branchUrl?: string; deploymentUrl?: string; error?: string }> => {  
    console.log("Publish Triggered")

  try {  
    const config = await loadFromStorage();  
    const exportableConfig = await convertIndexedDBReferencesToDataURLs(config);  
      
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);  
    const branchName = customName   
      ? `deploy-${customName}-${timestamp}`  
      : `deploy-${timestamp}`;  
  
    const response = await fetch('/api/publish-deployment', {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json',  
      },  
      body: JSON.stringify({  
        configuration: exportableConfig,  
        branchName  
      }),  
    });  
  
    const result = await response.json();  
  
    if (!response.ok) {  
      return { success: false, error: result.error || 'Failed to publish deployment' };  
    }  
  
    return {   
      success: true,   
      branchUrl: result.branchUrl,  
      deploymentUrl: result.deploymentUrl   
    };  
  } catch (error) {  
    return {  
      success: false,  
      error: error instanceof Error ? error.message : 'Unknown error',  
    };  
  }  
};

// Update functions interface
export interface ConfigurationUpdateFunctions {
  updateStandardMenu: (
    id: string,
    field: string,
    value: string | boolean,
    skipFaviconUpdate?: boolean
  ) => void;
  addCustomMenu: (menu: CustomMenu) => void;
  clearCustomMenus?: () => void;
  updateHomePageConfig: (config: HomePageConfig) => void;
  setIsImportingConfiguration?: (isImporting: boolean) => void;
  updateAppConfig: (config: AppConfig, bypassClusterWarning?: boolean) => void;
  updateFullAppConfig: (config: FullAppConfig) => void;
  updateStylingConfig: (config: StylingConfig) => void;
  updateUserConfig: (config: UserConfig) => void;
  setMenuOrder?: (order: string[]) => void;
}

// Save configuration directly to storage (synchronous approach)
export const saveConfigurationToStorage = async (
  config: ConfigurationData
): Promise<void> => {
  console.log("=== Saving Configuration to Storage ===");
  console.log("Configuration to save:", {
    standardMenus: config.standardMenus.length,
    customMenus: config.customMenus.length,
    menuOrder: config.menuOrder.length,
    hasHomePageConfig: !!config.homePageConfig,
    hasAppConfig: !!config.appConfig,
    hasFullAppConfig: !!config.fullAppConfig,
    hasStylingConfig: !!config.stylingConfig,
    hasUserConfig: !!config.userConfig,
  });

  try {
    // Save the entire configuration at once
    await saveToStorage(config);
    console.log("Configuration saved to storage successfully");
  } catch (error) {
    console.error("Failed to save configuration to storage:", error);
    throw error;
  }
};

// Apply configuration to the app state (legacy approach - kept for backward compatibility)
export const applyConfiguration = async (
  config: ConfigurationData,
  updateFunctions: ConfigurationUpdateFunctions
) => {
  console.log("=== Applying Configuration ===");
  console.log("Configuration to apply:", {
    standardMenus: config.standardMenus.length,
    customMenus: config.customMenus.length,
    menuOrder: config.menuOrder.length,
    hasHomePageConfig: !!config.homePageConfig,
    hasAppConfig: !!config.appConfig,
    hasFullAppConfig: !!config.fullAppConfig,
    hasStylingConfig: !!config.stylingConfig,
    hasUserConfig: !!config.userConfig,
  });

  // Set import flag to prevent auto-save loops
  if (updateFunctions.setIsImportingConfiguration) {
    updateFunctions.setIsImportingConfiguration(true);
  }

  // Apply app config first
  console.log("Applying app config:", config.appConfig);
  console.log("About to call updateAppConfig with bypassClusterWarning=true");
  console.trace("[applyConfiguration] Call stack before updateAppConfig:");
  updateFunctions.updateAppConfig(config.appConfig, true); // Bypass cluster warning when loading from config
  console.log("updateAppConfig call completed");

  // Apply styling config with safety checks
  console.log("=== Applying Styling Configuration ===");
  console.log("Styling config to apply:", config.stylingConfig);

  // Ensure the styling config has proper structure
  const safeStylingConfig = {
    ...config.stylingConfig,
    embeddedContent: {
      strings: config.stylingConfig.embeddedContent?.strings || {},
      stringIDs: config.stylingConfig.embeddedContent?.stringIDs || {},
      cssUrl: config.stylingConfig.embeddedContent?.cssUrl || "",
      customCSS: {
        variables:
          config.stylingConfig.embeddedContent?.customCSS?.variables || {},
        rules_UNSTABLE:
          config.stylingConfig.embeddedContent?.customCSS?.rules_UNSTABLE || {},
      },
    },
  };

  console.log("Safe styling config structure:", {
    hasApplication: !!safeStylingConfig.application,
    hasEmbeddedContent: !!safeStylingConfig.embeddedContent,
    hasEmbedFlags: !!safeStylingConfig.embedFlags,
    applicationKeys: safeStylingConfig.application
      ? Object.keys(safeStylingConfig.application)
      : [],
    embeddedContentKeys: safeStylingConfig.embeddedContent
      ? Object.keys(safeStylingConfig.embeddedContent)
      : [],
  });
  updateFunctions.updateStylingConfig(safeStylingConfig);
  console.log("=== Styling Configuration Applied ===");

  // Apply user config early to ensure proper access control
  console.log("Applying user config:", config.userConfig);
  updateFunctions.updateUserConfig(config.userConfig);

  // Apply standard menus - batch updates to reduce save operations
  console.log("Applying standard menus:", config.standardMenus.length);
  config.standardMenus.forEach((menu, index) => {
    if (menu.id && menu.name) {
      console.log(`Applying standard menu ${index + 1}:`, menu.name, menu.id);

      // Apply all updates for this menu - the debounced save mechanism will batch them
      updateFunctions.updateStandardMenu(menu.id, "name", menu.name);
      updateFunctions.updateStandardMenu(menu.id, "enabled", menu.enabled);
      updateFunctions.updateStandardMenu(
        menu.id,
        "icon",
        menu.icon,
        menu.id === "home"
      );

      if (menu.homePageType) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "homePageType",
          menu.homePageType
        );
      }
      if (menu.homePageValue) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "homePageValue",
          menu.homePageValue
        );
      }
      if (menu.modelId) {
        updateFunctions.updateStandardMenu(menu.id, "modelId", menu.modelId);
      }
      if (menu.contentId) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "contentId",
          menu.contentId
        );
      }

      if (menu.namePattern) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "namePattern",
          menu.namePattern
        );
      }
      if (menu.spotterModelId) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "spotterModelId",
          menu.spotterModelId
        );
      }
      if (menu.spotterSearchQuery) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "spotterSearchQuery",
          menu.spotterSearchQuery
        );
      }
      if (menu.searchDataSource) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "searchDataSource",
          menu.searchDataSource
        );
      }
      if (menu.searchTokenString) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "searchTokenString",
          menu.searchTokenString
        );
      }
      if (menu.runSearch !== undefined) {
        updateFunctions.updateStandardMenu(
          menu.id,
          "runSearch",
          menu.runSearch
        );
      }

      // Special handling for home menu icon to ensure we use the correct values from config
      if (menu.id === "home" && menu.icon) {
        console.log(`[Config Import] Updating home menu icon to: ${menu.icon}`);
        console.log(
          `[Config Import] Current app config from config file:`,
          config.appConfig
        );
        // Directly update app config with the icon from the config file
        const currentAppConfig = config.appConfig;
        const updatedAppConfig = {
          ...currentAppConfig,
          favicon: menu.icon,
          logo: menu.icon,
        };
        console.log(`[Config Import] Updated app config:`, updatedAppConfig);
        console.log(
          `[Config Import] About to call updateAppConfig for home menu icon`
        );
        console.trace(
          "[Config Import] Call stack before updateAppConfig for home menu:"
        );
        updateFunctions.updateAppConfig(updatedAppConfig, true);
        console.log(
          `[Config Import] updateAppConfig call completed for home menu icon`
        );

        // Also update the TopBar logo in styling config
        const currentStylingConfig = config.stylingConfig;
        const updatedStylingConfig = {
          ...currentStylingConfig,
          application: {
            ...currentStylingConfig.application,
            topBar: {
              ...currentStylingConfig.application.topBar,
              logoUrl: menu.icon,
            },
          },
        };
        updateFunctions.updateStylingConfig(updatedStylingConfig);
      }
    } else {
      console.warn(`Skipping invalid standard menu at index ${index}:`, menu);
    }
  });

  // Apply custom menus - clear existing ones first, then add new ones
  console.log("Applying custom menus:", config.customMenus.length);

  // Clear existing custom menus first to avoid duplicates
  if (updateFunctions.clearCustomMenus) {
    console.log("Clearing existing custom menus before applying new ones");
    updateFunctions.clearCustomMenus();
  } else {
    console.log(
      "clearCustomMenus function not available, will rely on addCustomMenu to handle duplicates"
    );
  }

  // Apply all custom menus from the configuration
  console.log("About to apply custom menus:", config.customMenus);

  // Apply custom menus synchronously to ensure they're all processed
  for (let index = 0; index < config.customMenus.length; index++) {
    const menu = config.customMenus[index];
    if (menu.id && menu.name) {
      console.log(`Applying custom menu ${index + 1}:`, menu.name, menu.id);
      try {
        updateFunctions.addCustomMenu(menu);
        console.log(`Successfully applied custom menu: ${menu.name}`);
      } catch (error) {
        console.error(`Failed to apply custom menu ${menu.name}:`, error);
      }
    } else {
      console.warn(`Skipping invalid custom menu at index ${index}:`, menu);
    }
  }
  console.log("Finished applying custom menus");

  // Add a longer delay to ensure storage operations complete
  console.log("Waiting for storage operations to complete...");
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Apply menu order if available
  if (config.menuOrder.length > 0 && updateFunctions.setMenuOrder) {
    console.log("Applying menu order:", config.menuOrder);

    // Filter out menu IDs that don't exist in standard or custom menus
    const allMenuIds = [
      ...config.standardMenus.map((menu) => menu.id),
      ...config.customMenus.map((menu) => menu.id),
    ];

    const validMenuOrder = config.menuOrder.filter((menuId) => {
      const exists = allMenuIds.includes(menuId);
      if (!exists) {
        console.warn(
          `Menu ID "${menuId}" in menu order not found in standard or custom menus`
        );
      }
      return exists;
    });

    console.log("Valid menu order (filtered):", validMenuOrder);
    updateFunctions.setMenuOrder(validMenuOrder);
  } else {
    console.log(
      "Menu order not applied (no setMenuOrder function or empty order)"
    );
  }

  // Apply home page config
  console.log("Applying home page config:", config.homePageConfig);
  updateFunctions.updateHomePageConfig(config.homePageConfig);

  // Apply full app config
  console.log("Applying full app config:", config.fullAppConfig);
  updateFunctions.updateFullAppConfig(config.fullAppConfig);

  console.log("=== Configuration Applied Successfully ===");

  // Clear import flag after a delay to allow state updates to complete
  setTimeout(() => {
    if (updateFunctions.setIsImportingConfiguration) {
      updateFunctions.setIsImportingConfiguration(false);
      console.log(
        "[Config Service] Configuration import completed, auto-save re-enabled"
      );
    }
  }, 1000);
};

// Helper function to convert data URLs to IndexedDB references
const convertDataURLsToIndexedDBReferences = async (
  config: ConfigurationData
): Promise<ConfigurationData> => {
  try {
    const convertedConfig = { ...config };

    // Convert appConfig.logo if it's a data URL
    if (convertedConfig.appConfig?.logo?.startsWith("data:image")) {
      try {
        const { saveImageToIndexedDB, generateImageId } = await import(
          "../components/ImageUpload"
        );
        const imageId = generateImageId();
        await saveImageToIndexedDB(imageId, convertedConfig.appConfig.logo);
        convertedConfig.appConfig.logo = `indexeddb://${imageId}`;
        console.log(
          "Converted appConfig.logo from data URL to IndexedDB reference"
        );
      } catch (error) {
        console.warn("Failed to convert appConfig.logo from data URL:", error);
      }
    }

    // Convert stylingConfig.application.topBar.logoUrl if it's a data URL
    if (
      convertedConfig.stylingConfig?.application?.topBar?.logoUrl?.startsWith(
        "data:image"
      )
    ) {
      try {
        const { saveImageToIndexedDB, generateImageId } = await import(
          "../components/ImageUpload"
        );
        const imageId = generateImageId();
        await saveImageToIndexedDB(
          imageId,
          convertedConfig.stylingConfig.application.topBar.logoUrl
        );
        convertedConfig.stylingConfig.application.topBar.logoUrl = `indexeddb://${imageId}`;
        console.log(
          "Converted topBar.logoUrl from data URL to IndexedDB reference"
        );
      } catch (error) {
        console.warn("Failed to convert topBar.logoUrl from data URL:", error);
      }
    }

    // Convert favicon if it's a data URL
    if (convertedConfig.appConfig?.favicon?.startsWith("data:image")) {
      try {
        const { saveImageToIndexedDB, generateImageId } = await import(
          "../components/ImageUpload"
        );
        const imageId = generateImageId();
        await saveImageToIndexedDB(imageId, convertedConfig.appConfig.favicon);
        convertedConfig.appConfig.favicon = `indexeddb://${imageId}`;
        console.log("Converted favicon from data URL to IndexedDB reference");
      } catch (error) {
        console.warn("Failed to convert favicon from data URL:", error);
      }
    }

    // Convert any standard menu icons that are data URLs
    if (convertedConfig.standardMenus) {
      for (const menu of convertedConfig.standardMenus) {
        if (menu.icon?.startsWith("data:image")) {
          try {
            const { saveImageToIndexedDB, generateImageId } = await import(
              "../components/ImageUpload"
            );
            const imageId = generateImageId();
            await saveImageToIndexedDB(imageId, menu.icon);
            menu.icon = `indexeddb://${imageId}`;
            console.log(
              `Converted menu ${menu.id} icon from data URL to IndexedDB reference`
            );
          } catch (error) {
            console.warn(
              `Failed to convert menu ${menu.id} icon from data URL:`,
              error
            );
          }
        }

        // Convert homePageValue if it's a data URL and homePageType is image
        if (
          menu.homePageType === "image" &&
          menu.homePageValue?.startsWith("data:image")
        ) {
          try {
            const { saveImageToIndexedDB, generateImageId } = await import(
              "../components/ImageUpload"
            );
            const imageId = generateImageId();
            await saveImageToIndexedDB(imageId, menu.homePageValue);
            menu.homePageValue = `indexeddb://${imageId}`;
            console.log(
              `Converted menu ${menu.id} homePageValue from data URL to IndexedDB reference`
            );
          } catch (error) {
            console.warn(
              `Failed to convert menu ${menu.id} homePageValue from data URL:`,
              error
            );
          }
        }
      }
    }

    // Convert any custom menu icons that are data URLs
    if (convertedConfig.customMenus) {
      for (const menu of convertedConfig.customMenus) {
        if (menu.icon?.startsWith("data:image")) {
          try {
            const { saveImageToIndexedDB, generateImageId } = await import(
              "../components/ImageUpload"
            );
            const imageId = generateImageId();
            await saveImageToIndexedDB(imageId, menu.icon);
            menu.icon = `indexeddb://${imageId}`;
            console.log(
              `Converted custom menu ${menu.id} icon from data URL to IndexedDB reference`
            );
          } catch (error) {
            console.warn(
              `Failed to convert custom menu ${menu.id} icon from data URL:`,
              error
            );
          }
        }
      }
    }

    return convertedConfig;
  } catch (error) {
    console.error("Error converting data URLs to IndexedDB references:", error);
    return config; // Return original config if conversion fails
  }
};

// Helper function to convert IndexedDB references to data URLs
const convertIndexedDBReferencesToDataURLs = async (
  config: ConfigurationData
): Promise<ConfigurationData> => {
  try {
    const convertedConfig = { ...config };

    // Convert appConfig.logo if it's an IndexedDB reference
    if (convertedConfig.appConfig?.logo?.startsWith("indexeddb://")) {
      try {
        const { getImageFromIndexedDB } = await import(
          "../components/ImageUpload"
        );
        const imageId = convertedConfig.appConfig.logo.replace(
          "indexeddb://",
          ""
        );
        const imageData = await getImageFromIndexedDB(imageId);
        if (imageData) {
          convertedConfig.appConfig.logo = imageData;
          console.log("Converted appConfig.logo from IndexedDB to data URL");
        }
      } catch (error) {
        console.warn("Failed to convert appConfig.logo from IndexedDB:", error);
      }
    }

    // Convert stylingConfig.application.topBar.logoUrl if it's an IndexedDB reference
    if (
      convertedConfig.stylingConfig?.application?.topBar?.logoUrl?.startsWith(
        "indexeddb://"
      )
    ) {
      try {
        const { getImageFromIndexedDB } = await import(
          "../components/ImageUpload"
        );
        const imageId =
          convertedConfig.stylingConfig.application.topBar.logoUrl.replace(
            "indexeddb://",
            ""
          );
        const imageData = await getImageFromIndexedDB(imageId);
        if (imageData) {
          convertedConfig.stylingConfig.application.topBar.logoUrl = imageData;
          console.log("Converted topBar.logoUrl from IndexedDB to data URL");
        }
      } catch (error) {
        console.warn("Failed to convert topBar.logoUrl from IndexedDB:", error);
      }
    }

    // Convert favicon if it's an IndexedDB reference
    if (convertedConfig.appConfig?.favicon?.startsWith("indexeddb://")) {
      try {
        const { getImageFromIndexedDB } = await import(
          "../components/ImageUpload"
        );
        const imageId = convertedConfig.appConfig.favicon.replace(
          "indexeddb://",
          ""
        );
        const imageData = await getImageFromIndexedDB(imageId);
        if (imageData) {
          convertedConfig.appConfig.favicon = imageData;
          console.log("Converted favicon from IndexedDB to data URL");
        }
      } catch (error) {
        console.warn("Failed to convert favicon from IndexedDB:", error);
      }
    }

    // Convert any standard menu icons that are IndexedDB references
    if (convertedConfig.standardMenus) {
      for (const menu of convertedConfig.standardMenus) {
        if (menu.icon?.startsWith("indexeddb://")) {
          try {
            const { getImageFromIndexedDB } = await import(
              "../components/ImageUpload"
            );
            const imageId = menu.icon.replace("indexeddb://", "");
            const imageData = await getImageFromIndexedDB(imageId);
            if (imageData) {
              menu.icon = imageData;
              console.log(
                `Converted menu ${menu.id} icon from IndexedDB to data URL`
              );
            }
          } catch (error) {
            console.warn(
              `Failed to convert menu ${menu.id} icon from IndexedDB:`,
              error
            );
          }
        }

        // Convert homePageValue if it's an IndexedDB reference and homePageType is image
        if (
          menu.homePageType === "image" &&
          menu.homePageValue?.startsWith("indexeddb://")
        ) {
          try {
            const { getImageFromIndexedDB } = await import(
              "../components/ImageUpload"
            );
            const imageId = menu.homePageValue.replace("indexeddb://", "");
            const imageData = await getImageFromIndexedDB(imageId);
            if (imageData) {
              menu.homePageValue = imageData;
              console.log(
                `Converted menu ${menu.id} homePageValue from IndexedDB to data URL`
              );
            }
          } catch (error) {
            console.warn(
              `Failed to convert menu ${menu.id} homePageValue from IndexedDB:`,
              error
            );
          }
        }
      }
    }

    // Convert any custom menu icons that are IndexedDB references
    if (convertedConfig.customMenus) {
      for (const menu of convertedConfig.customMenus) {
        if (menu.icon?.startsWith("indexeddb://")) {
          try {
            const { getImageFromIndexedDB } = await import(
              "../components/ImageUpload"
            );
            const imageId = menu.icon.replace("indexeddb://", "");
            const imageData = await getImageFromIndexedDB(imageId);
            if (imageData) {
              menu.icon = imageData;
              console.log(
                `Converted custom menu ${menu.id} icon from IndexedDB to data URL`
              );
            }
          } catch (error) {
            console.warn(
              `Failed to convert custom menu ${menu.id} icon from IndexedDB:`,
              error
            );
          }
        }
      }
    }

    return convertedConfig;
  } catch (error) {
    console.error("Error converting IndexedDB references:", error);
    return config; // Return original config if conversion fails
  }
};

// Export configuration as JSON file
export const exportConfiguration = async (
  config: ConfigurationData,
  customName?: string
): Promise<void> => {
  try {
    console.log("Starting configuration export...");

    // Convert any IndexedDB references to data URLs before exporting
    const configToExport = await convertIndexedDBReferencesToDataURLs(config);

    const exportData = {
      ...configToExport,
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      description: "TSE Demo Builder Configuration Export",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Use custom name if provided, otherwise use default naming
    const fileName = customName
      ? `${customName}.json`
      : `tse-demo-builder-config-${
          new Date().toISOString().split("T")[0]
        }.json`;

    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Configuration exported successfully with embedded images");
  } catch (error) {
    console.error("Error exporting configuration:", error);
  }
};

// Simplified configuration loading function
export const loadConfigurationSimplified = async (
  source: ConfigurationSource,
  onProgress?: (message: string, progress?: number) => void
): Promise<{ success: boolean; error?: string }> => {
  try {
    onProgress?.("Starting configuration load...", 10);

    // Step 1: Clear current configuration from storage
    onProgress?.("Clearing current configuration...", 20);
    await clearStorageCompletely();

    // Step 2: Load configuration from source
    onProgress?.("Loading configuration from source...", 40);
    let configData: Record<string, unknown>;

    if (source.type === "file") {
      const file = source.data as File;
      const text = await file.text();
      configData = JSON.parse(text);
      console.log("Loaded configuration from file:", configData);
    } else {
      const filename = source.data as string;
      configData = await loadConfigurationFromGitHub(filename);
      console.log("Loaded configuration from GitHub:", configData);
    }

    onProgress?.("Validating configuration...", 60);

    // Step 3: Validate and merge configuration
    const mergedConfig: ConfigurationData = {
      standardMenus:
        (configData.standardMenus as StandardMenu[]) ||
        DEFAULT_CONFIG.standardMenus,
      customMenus:
        (configData.customMenus as CustomMenu[]) || DEFAULT_CONFIG.customMenus,
      menuOrder: (() => {
        const storedOrder = (configData.menuOrder as string[]) || [];
        const mergedOrder = [...DEFAULT_CONFIG.menuOrder];

        // Add any stored menu IDs that aren't in DEFAULT_CONFIG
        storedOrder.forEach((storedId) => {
          if (!mergedOrder.includes(storedId)) {
            mergedOrder.push(storedId);
          }
        });

        return mergedOrder;
      })(),
      homePageConfig:
        (configData.homePageConfig as HomePageConfig) ||
        DEFAULT_CONFIG.homePageConfig,
      appConfig:
        (configData.appConfig as AppConfig) || DEFAULT_CONFIG.appConfig,
      fullAppConfig:
        (configData.fullAppConfig as FullAppConfig) ||
        DEFAULT_CONFIG.fullAppConfig,
      stylingConfig:
        (configData.stylingConfig as StylingConfig) ||
        DEFAULT_CONFIG.stylingConfig,
      userConfig:
        (configData.userConfig as UserConfig) || DEFAULT_CONFIG.userConfig,
    };

    onProgress?.("Saving configuration to storage...", 80);

    // Step 4: Convert data URLs to IndexedDB references before saving
    const configWithIndexedDB = await convertDataURLsToIndexedDBReferences(
      mergedConfig
    );

    // Step 5: Save configuration to storage
    await saveToStorage(configWithIndexedDB);

    onProgress?.("Configuration loaded successfully!", 100);

    // Step 5: Check if we're on a custom menu page and redirect if needed
    const currentPath = window.location.pathname;
    const isOnCustomMenu = currentPath.startsWith("/custom/");

    if (isOnCustomMenu) {
      // Redirect to first available standard menu
      setTimeout(() => {
        redirectFromCustomMenu(mergedConfig.standardMenus);
      }, 500);
    } else {
      // Not on a custom menu, just reload the page
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in loadConfigurationSimplified:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

// Helper function to redirect from custom menu to first available standard menu
export const redirectFromCustomMenu = (standardMenus: StandardMenu[]): void => {
  const currentPath = window.location.pathname;
  const isOnCustomMenu = currentPath.startsWith("/custom/");

  if (isOnCustomMenu) {
    // Find the first available standard menu to redirect to
    const firstStandardMenu = standardMenus.find((menu) => menu.enabled);
    if (firstStandardMenu) {
      const routeMap: { [key: string]: string } = {
        home: "/",
        favorites: "/favorites",
        "my-reports": "/my-reports",
        spotter: "/spotter",
        search: "/search",
        "full-app": "/full-app",
        "all-content": "/all-content",
      };

      const redirectRoute = routeMap[firstStandardMenu.id] || "/";
      console.log(`Redirecting from custom menu to: ${redirectRoute}`);

      // Redirect to the first available standard menu
      window.location.href = redirectRoute;
    } else {
      // Fallback to home if no standard menus are available
      window.location.href = "/";
    }
  }
};

// Helper function to completely clear storage
const clearStorageCompletely = async (): Promise<void> => {
  try {
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);

      // Clear old storage keys if they exist
      const oldKeys = [
        "tse-demo-builder-standard-menus",
        "tse-demo-builder-custom-menus",
        "tse-demo-builder-menu-order",
        "tse-demo-builder-home-page-config",
        "tse-demo-builder-app-config",
        "tse-demo-builder-full-app-config",
        "tse-demo-builder-styling-config",
        "tse-demo-builder-user-config",
      ];

      oldKeys.forEach((key) => localStorage.removeItem(key));
    }

    // Clear IndexedDB
    try {
      await removeFromIndexedDB(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear IndexedDB:", error);
    }

    console.log("Storage cleared completely");
  } catch (error) {
    console.error("Error clearing storage:", error);
    throw error;
  }
};
