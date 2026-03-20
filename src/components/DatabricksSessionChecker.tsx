"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentDatabricksUser } from "../services/databricksApi";
import { useDatabricksAuth } from "./DatabricksAuthContext";

export default function DatabricksSessionChecker({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { databricksUser, setDatabricksUser } = useDatabricksAuth();
  const [isChecking, setIsChecking] = useState(databricksUser === null);

  const checkSession = async () => {
    setIsChecking(true);
    const user = await getCurrentDatabricksUser();

    if (user) {
      setDatabricksUser(user);
      setIsChecking(false);
      return;
    }

    setIsChecking(false);
    router.replace("/databricks-login");
  };

  useEffect(() => {
    if (pathname === "/databricks-login") {
      return;
    }

    if (databricksUser) {
      return;
    }

    void checkSession();
  }, []);

  if (pathname === "/databricks-login") {
    return <>{children}</>;
  }

  if (databricksUser) {
    return <>{children}</>;
  }

  if (isChecking) {
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
            textAlign: "center",
            padding: "40px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid #e2e8f0",
              borderTop: "4px solid #3182ce",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px",
            }}
          />
          <h2 style={{ margin: "0 0 10px", color: "#2d3748" }}>
            Checking Session...
          </h2>
          <p style={{ margin: 0, color: "#718096" }}>
            Verifying your Databricks connection
          </p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return null;
}
