"use client";

import { useState } from "react";
import { loginToThoughtSpot } from "../services/thoughtspotApi";
import { AppConfig } from "@/types/thoughtspot";

interface LoginPageProps {
  thoughtspotUrl: string;
  onLoginSuccess: () => void;
  onConfigureSettings: () => void;
  updateAppConfig: (config: AppConfig) => void;  
  appConfig: AppConfig;
}

export default function LoginPage({
  thoughtspotUrl,
  onLoginSuccess,
  onConfigureSettings,
  updateAppConfig,
  appConfig,
}: LoginPageProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localThoughtSpotUrl, setLocalThoughtSpotUrl] = useState(thoughtspotUrl || '');  
  const [isSavingUrl, setIsSavingUrl] = useState(false);

  const handleSaveUrl = async () => {  
  if (!localThoughtSpotUrl) {  
    setError("Please enter a ThoughtSpot URL");  
    return;  
  }  
  
  setIsSavingUrl(true);  
  setError(null);  
  
  try {  
    // Import configuration service  
    const { saveAppConfig, loadAllConfigurations } = await import("../services/configurationService");  
    const { setThoughtSpotBaseUrl } = await import("../services/thoughtspotApi");  
      
    // Load current config  
    const currentConfig = await loadAllConfigurations();  
      
    // Update with new URL  
    const updatedAppConfig = {  
      ...currentConfig.appConfig,  
      thoughtspotUrl: localThoughtSpotUrl  
    };  
      
    // Save to storage  
    await saveAppConfig(updatedAppConfig);  
      
    // Update API base URL  
    setThoughtSpotBaseUrl(localThoughtSpotUrl);  
      
    // Reload to apply changes  
    window.location.reload();  
  } catch (err) {  
    console.error("Failed to save URL:", err);  
    setError("Failed to save ThoughtSpot URL. Please try again.");  
  } finally {  
    setIsSavingUrl(false);  
  }  
};

  const handleLogin = async () => {
    if (!thoughtspotUrl) {
      setError("No ThoughtSpot URL configured. Please configure settings first.");
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const loggedIn = await loginToThoughtSpot(username, password);
        
      if (loggedIn) {
        onLoginSuccess();
      } else {
        setError("Login failed. Please check your username and password.");
      }
    } catch (err) {
      console.error("Login check failed:", err);
      setError("Unable to verify ThoughtSpot session. Please check your connection.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f7fafc",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          padding: "40px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: "0 0 10px", color: "#2d3748", fontSize: "24px" }}>
          7dxperts TSE Demo Builder
        </h1>
        <p style={{ margin: "0 0 30px", color: "#718096", fontSize: "14px" }}>
          Please authenticate with ThoughtSpot to continue
        </p>

        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "20px",
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "4px",
              color: "#92400e",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}
        <div style={{ marginBottom: "24px" }}>  
  <label   
    style={{   
      display: "block",   
      marginBottom: "8px",   
      fontWeight: "500",  
      color: "#374151",  
      fontSize: "14px"  
    }}  
  >  
    ThoughtSpot URL  
  </label>  
  <div style={{ display: "flex", gap: "8px" }}>  
    <input  
      type="url"  
      value={localThoughtSpotUrl}  
      onChange={(e) => setLocalThoughtSpotUrl(e.target.value)}  
      placeholder="https://your-instance.thoughtspot.cloud"  
      style={{  
        flex: 1,  
        padding: "10px 12px",  
        border: "1px solid #d1d5db",  
        borderRadius: "6px",  
        fontSize: "14px",  
      }}  
    />  
    <button  
      onClick={handleSaveUrl}  
      disabled={isSavingUrl || localThoughtSpotUrl === thoughtspotUrl}  
      style={{  
        padding: "10px 16px",  
        backgroundColor: "#3182ce",  
        color: "white",  
        border: "none",  
        borderRadius: "6px",  
        cursor: isSavingUrl || localThoughtSpotUrl === thoughtspotUrl ? "not-allowed" : "pointer",  
        fontSize: "14px",  
        fontWeight: "500",  
        opacity: isSavingUrl || localThoughtSpotUrl === thoughtspotUrl ? 0.6 : 1,  
      }}  
    >  
      {isSavingUrl ? "Saving..." : "Save"}  
    </button>  
  </div>  
  <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>  
    Enter your ThoughtSpot instance URL and save before logging in  
  </p>  
</div>

        <form
          onSubmit={(e) => {
            e.preventDefault(); 
            handleLogin();     
          }}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {localThoughtSpotUrl ? (  
            <>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  padding: "12px",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  padding: "12px",
                  border: "1px solid #cbd5e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={handleLogin}
                disabled={isChecking}
                style={{
                  padding: "12px 24px",
                  backgroundColor: isChecking ? "#cbd5e0" : "#38a169",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isChecking ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {isChecking ? "Logging in..." : "Login"}
              </button>
            </>
          ) : (
           <p style={{ color: "#6b7280", textAlign: "center" }}>  
              Please enter and save your ThoughtSpot URL first  
           </p>  
          )}
        </form>
      </div>
    </div>
  );
}  
