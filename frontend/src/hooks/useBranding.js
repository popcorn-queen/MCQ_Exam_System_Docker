import { useState, useEffect } from "react";

export default function useBranding() {
  const [branding, setBranding] = useState({ schoolName: "", logoFile: null, bgColor: "#f8f9fa" });

  useEffect(() => {
    fetch("/config.json")
      .then(r => r.json())
      .then(data => setBranding(data))
      .catch(() => {});
  }, []);

  return branding;
}