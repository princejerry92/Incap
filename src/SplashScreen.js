// src/pages/SplashScreen.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Modal from "react-modal";

// Replace with your actual logo asset path
import logo from "./assets/Dylan log3.jpg";

Modal.setAppElement("#root");

export default function SplashScreen() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("resize", handleResize);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
      navigate('/get-started');
    }, 3000); // Splash duration
      return () => clearTimeout(timer);
    }
  }, [isOnline, isMobile, navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f1f0e9ff",
      }}
    >
      <motion.img
        src={logo}
        alt="Incap FX Logo"
        style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.25)",
        }}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        style={{ marginTop: 20, fontWeight: "bold", fontSize: "1.5rem" }}
      >
        Incap FX
      </motion.h1>

      <Modal
        isOpen={!isOnline}
        contentLabel="Offline Warning"
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            padding: "20px",
            borderRadius: "12px",
          },
        }}
      >
        <h2>No Internet Connection</h2>
        <p>Please check your connection and try again.</p>
        <button onClick={() => setIsOnline(navigator.onLine)}>Retry</button>
      </Modal>
    </div>
  );
}
