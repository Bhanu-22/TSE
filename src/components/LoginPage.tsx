"use client";  
  
import { useState } from "react";  
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
          7Dxperts TSE Demo Builder  
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
  
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>  
          {thoughtspotUrl ? (  
            <>  
              <button  
                onClick={() => window.open(thoughtspotUrl, "_blank")}  
                style={{  
                  padding: "12px 24px",  
                  backgroundColor: "#3182ce",  
                  color: "white",  
                  border: "none",  
                  borderRadius: "4px",  
                  cursor: "pointer",  
                  fontSize: "14px",  
                  fontWeight: "500",  
                }}  
              >  
                Open ThoughtSpot  
              </button>  
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
                {isChecking ? "Checking..." : "I'm Logged In"}  
              </button>  
            </>  
          ) : (  
            <button  
              onClick={onConfigureSettings}  
              style={{  
                padding: "12px 24px",  
                backgroundColor: "#6b7280",  
                color: "white",  
                border: "none",  
                borderRadius: "4px",  
                cursor: "pointer",  
                fontSize: "14px",  
                fontWeight: "500",  
              }}  
            >  
              Configure Settings  
            </button>  
          )}  
        </div>  
      </div>  
    </div>  
  );  
}