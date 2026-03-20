"use client";

import React from "react";

interface AuthCardLayoutProps {
  children: React.ReactNode;
  backgroundColor: string;
}

export default function AuthCardLayout({
  children,
  backgroundColor,
}: AuthCardLayoutProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor,
      }}
    >
      <div
        style={{
          backgroundColor: "#1E2833",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          height: "72.93px",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <img
          src="/7dx_top.png"
          alt="7dxperts"
          style={{
            height: "50px",
            width: "auto",
          }}
        />
        <div
          style={{
            width: "1px",
            height: "24px",
            backgroundColor: "#4a5568",
          }}
        />
        <img
          src="/TS_top.png"
          alt="ThoughtSpot"
          style={{
            height: "55px",
            width: "auto",
          }}
        />
      </div>

      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          padding: "40px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 7px 10px rgba(255, 255, 255, 1)",
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}
