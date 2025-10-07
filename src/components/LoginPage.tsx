"use client";  
  
import { useState, useEffect } from "react";  
import { getCurrentUser } from "../services/thoughtspotApi";  
  
interface LoginPageProps {  
  thoughtspotUrl: string;  
  onLoginSuccess: () => void;  
  onConfigureSettings: () => void;  
}  
  
export default function LoginPage({  
  thoughtspotUrl,  
  onLoginSuccess,  
  onConfigureSettings,  
}: LoginPageProps) {  
  const [isChecking, setIsChecking] = useState(false);  
  const [error, setError] = useState<string | null>(null);  
  const [logoUrl, setLogoUrl] = useState<string>("/logo.png");  
  const [isLogoLoading, setIsLogoLoading] = useState(true);  
  
  // Load logo from configuration (similar to TopBar implementation)  
  useEffect(() => {  
    const loadLogo = async () => {  
      try {  
        // Load styling config from localStorage  
        const configStr = localStorage.getItem("tse-demo-builder-config");  
        if (configStr) {  
          const config = JSON.parse(configStr);  
          const storedLogoUrl = config?.stylingConfig?.application?.topBar?.logoUrl;  
            
          if (storedLogoUrl && storedLogoUrl !== "/logo.png") {  
            // Handle IndexedDB references  
            if (storedLogoUrl.startsWith("indexeddb://")) {  
              const imageId = storedLogoUrl.replace("indexeddb://", "");  
              const { getImageFromIndexedDB } = await import("../components/ImageUpload");  
              const imageData = await getImageFromIndexedDB(imageId);  
                
              if (imageData) {  
                setLogoUrl(imageData);  
              }  
            } else {  
              setLogoUrl(storedLogoUrl);  
            }  
          }  
        }  
      } catch (err) {  
        console.error("Failed to load logo:", err);  
      } finally {  
        setIsLogoLoading(false);  
      }  
    };  
  
    loadLogo();  
  }, []);  
  
  const handleLogin = async () => {  
    if (!thoughtspotUrl) {  
      setError("No ThoughtSpot URL configured. Please configure settings first.");  
      return;  
    }  
  
    setIsChecking(true);  
    setError(null);  
  
    try {  
      const user = await getCurrentUser();  
  
      if (user) {  
        onLoginSuccess();  
      } else {  
        setError("Please log into ThoughtSpot first, then return here to continue.");  
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
        minHeight: "100vh",  
        backgroundColor: "#080808ff",  
        padding: "20px",  
      }}  
    >  
      <div  
        style={{  
          maxWidth: "440px",  
          width: "100%",  
          padding: "48px",  
          backgroundColor: "white",  
          borderRadius: "12px",  
          boxShadow: "0 10px 25px rgba(255, 255, 255, 1), 0 4px 10px rgba(255, 255, 255, 1)",  
          textAlign: "center",  
          animation: "fadeIn 0.4s ease-in-out",  
        }}  
      >  
        {/* Logo Section */}  
        <div  
          style={{  
            marginBottom: "32px",  
            display: "flex",  
            justifyContent: "center",  
            alignItems: "center",  
          }}  
        >  
          {isLogoLoading ? (  
            <div  
              style={{  
                height: "120px",  
                width: "120px",  
                backgroundColor: "#f3f4f6",  
                borderRadius: "12px",  
                display: "flex",  
                alignItems: "center",  
                justifyContent: "center",  
                animation: "pulse 1.5s ease-in-out infinite",  
              }}  
            >  
              <span style={{ fontSize: "14px", color: "#9ca3af" }}>Loading...</span>  
            </div>  
          ) : (  
            <img  
              src={logoUrl}  
              alt="Application Logo"  
              style={{  
                height: "120px",  
                width: "auto",  
                maxWidth: "100%",  
                objectFit: "contain",  
                filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06))",  
              }}  
              onError={(e) => {  
                console.error("Logo failed to load, using fallback");  
                (e.target as HTMLImageElement).src = "/logo.png";  
              }}  
            />  
          )}  
        </div>  
  
        {/* Title and Subtitle */}  
        <h1  
          style={{  
            margin: "0 0 8px",  
            color: "#1f2937",  
            fontSize: "28px",  
            fontWeight: "700",  
            letterSpacing: "-0.02em",  
          }}  
        >  
          7Dxperts TSE Demo Builder  
        </h1>  
        <p  
          style={{  
            margin: "0 0 36px",  
            color: "#6b7280",  
            fontSize: "15px",  
            lineHeight: "1.6",  
          }}  
        >  
          Please authenticate with ThoughtSpot to continue  
        </p>  
  
        {/* Error Message */}  
        {error && (  
          <div  
            style={{  
              padding: "14px 16px",  
              marginBottom: "24px",  
              backgroundColor: "#fef3c7",  
              border: "1px solid #f59e0b",  
              borderRadius: "8px",  
              color: "#92400e",  
              fontSize: "14px",  
              textAlign: "left",  
              display: "flex",  
              alignItems: "flex-start",  
              gap: "10px",  
              animation: "slideDown 0.3s ease-out",  
            }}  
          >  
            <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>  
            <span style={{ flex: 1 }}>{error}</span>  
          </div>  
        )}  
  
        {/* Action Buttons */}  
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>  
          {thoughtspotUrl ? (  
            <>  
              <button  
                onClick={() => window.open(thoughtspotUrl, "_blank")}  
                style={{  
                  padding: "14px 28px",  
                  backgroundColor: "#3182ce",  
                  color: "white",  
                  border: "none",  
                  borderRadius: "8px",  
                  cursor: "pointer",  
                  fontSize: "15px",  
                  fontWeight: "600",  
                  transition: "all 0.2s ease",  
                  boxShadow: "0 2px 4px rgba(49, 130, 206, 0.2)",  
                }}  
                onMouseEnter={(e) => {  
                  e.currentTarget.style.backgroundColor = "#2c5aa0";  
                  e.currentTarget.style.transform = "translateY(-1px)";  
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(49, 130, 206, 0.3)";  
                }}  
                onMouseLeave={(e) => {  
                  e.currentTarget.style.backgroundColor = "#3182ce";  
                  e.currentTarget.style.transform = "translateY(0)";  
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(49, 130, 206, 0.2)";  
                }}  
              >  
                 Open ThoughtSpot to Login
              </button>  
              <button  
                onClick={handleLogin}  
                disabled={isChecking}  
                style={{  
                  padding: "14px 28px",  
                  backgroundColor: isChecking ? "#cbd5e0" : "#38a169",  
                  color: "white",  
                  border: "none",  
                  borderRadius: "8px",  
                  cursor: isChecking ? "not-allowed" : "pointer",  
                  fontSize: "15px",  
                  fontWeight: "600",  
                  transition: "all 0.2s ease",  
                  opacity: isChecking ? 0.7 : 1,  
                  boxShadow: isChecking ? "none" : "0 2px 4px rgba(56, 161, 105, 0.2)",  
                  position: "relative",  
                }}  
                onMouseEnter={(e) => {  
                  if (!isChecking) {  
                    e.currentTarget.style.backgroundColor = "#2f855a";  
                    e.currentTarget.style.transform = "translateY(-1px)";  
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(56, 161, 105, 0.3)";  
                  }  
                }}  
                onMouseLeave={(e) => {  
                  if (!isChecking) {  
                    e.currentTarget.style.backgroundColor = "#38a169";  
                    e.currentTarget.style.transform = "translateY(0)";  
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(56, 161, 105, 0.2)";  
                  }  
                }}  
              >  
                {isChecking ? (  
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>  
                    <span  
                      style={{  
                        display: "inline-block",  
                        width: "16px",  
                        height: "16px",  
                        border: "2px solid white",  
                        borderTopColor: "transparent",  
                        borderRadius: "50%",  
                        animation: "spin 0.8s linear infinite",  
                      }}  
                    />  
                    Checking...  
                  </span>  
                ) : (  
                  "✓ I'm Logged In"  
                )}  
              </button>  
            </>  
          ) : (  
            <button  
              onClick={onConfigureSettings}  
              style={{  
                padding: "14px 28px",  
                backgroundColor: "#6b7280",  
                color: "white",  
                border: "none",  
                borderRadius: "8px",  
                cursor: "pointer",  
                fontSize: "15px",  
                fontWeight: "600",  
                transition: "all 0.2s ease",  
                boxShadow: "0 2px 4px rgba(107, 114, 128, 0.2)",  
              }}  
              onMouseEnter={(e) => {  
                e.currentTarget.style.backgroundColor = "#4b5563";  
                e.currentTarget.style.transform = "translateY(-1px)";  
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(107, 114, 128, 0.3)";  
              }}  
              onMouseLeave={(e) => {  
                e.currentTarget.style.backgroundColor = "#6b7280";  
                e.currentTarget.style.transform = "translateY(0)";  
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(107, 114, 128, 0.2)";  
              }}  
            >  
              ⚙️ Configure Settings  
            </button>  
          )}  
        </div>  
  
        {/* Footer Text */}  
        <p  
          style={{  
            marginTop: "32px",  
            fontSize: "13px",  
            color: "#9ca3af",  
            lineHeight: "1.5",  
          }}  
        >  
          Need help? Contact your administrator  
        </p>  
      </div>  
  
      {/* CSS Animations */}  
      <style jsx>{`  
        @keyframes fadeIn {  
          from {  
            opacity: 0;  
            transform: translateY(10px);  
          }  
          to {  
            opacity: 1;  
            transform: translateY(0);  
          }  
        }  
  
        @keyframes slideDown {  
          from {  
            opacity: 0;  
            transform: translateY(-10px);  
          }  
          to {  
            opacity: 1;  
            transform: translateY(0);  
          }  
        }  
  
        @keyframes pulse {  
          0%, 100% {  
            opacity: 1;  
          }  
          50% {  
            opacity: 0.5;  
          }  
        }  
  
        @keyframes spin {  
          to {  
            transform: rotate(360deg);  
          }  
        }  
      `}</style>  
    </div>  
  );  
}