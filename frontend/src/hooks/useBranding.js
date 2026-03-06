import { useState, useEffect } from "react";

export default function useBranding() {
  const [branding, setBranding] = useState({
    schoolName: "",
    logoFile: null,
    bgColor: "#f8f9fa",
    theme: { primary: "#0d6efd", secondary: "#6c757d", background: "#f8f9fa" }
  });

  useEffect(() => {
    fetch("/config.json")
      .then(r => r.json())
      .then(data => {
        setBranding(data);
        // Inject theme as CSS variables on :root
        const t = data.theme || {};
        const root = document.documentElement;
        if (t.primary) {
          root.style.setProperty("--theme-primary", t.primary);
          root.style.setProperty("--bs-primary", t.primary);
          root.style.setProperty("--bs-primary-rgb", hexToRgb(t.primary));
        }
        if (t.secondary) {
          root.style.setProperty("--theme-secondary", t.secondary);
          root.style.setProperty("--bs-secondary", t.secondary);
          root.style.setProperty("--bs-secondary-rgb", hexToRgb(t.secondary));
        }
        if (t.background) {
          root.style.setProperty("--theme-bg", t.background);
          document.body.style.backgroundColor = t.background;
        }
      })
      .catch(() => {});
  }, []);

  return branding;
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}