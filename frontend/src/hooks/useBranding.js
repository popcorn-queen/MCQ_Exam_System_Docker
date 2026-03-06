import { useState, useEffect } from "react";

const DEFAULTS = {
  background:     "#fefee3",
  cardBg:         "#ffffff",
  textDark:       "#353535",
  textMuted:      "#6b6b6b",
  btnPrimary:     "#577590",
  btnConfirm:     "#90be6d",
  btnNavigate:    "#43aa8b",
  btnDestructive: "#f94144",
  btnCancel:      "#bcb8b1",
  btnNeutral:     "#f9c74f",
  btnGhost:       "#faf9f9",
  shadow:         "#353535",
  border:         "#353535",
};

export default function useBranding() {
  const [branding, setBranding] = useState({
    schoolName: "",
    logoFile: null,
    theme: DEFAULTS,
  });

  useEffect(() => {
    fetch("/config.json")
      .then(r => r.json())
      .then(data => {
        setBranding(data);
        applyTheme(data.theme || {});
      })
      .catch(() => applyTheme(DEFAULTS));
  }, []);

  return branding;
}

function applyTheme(t) {
  const root = document.documentElement;
  const set = (v, val) => val && root.style.setProperty(v, val);

  set("--theme-bg",             t.background);
  set("--theme-card-bg",        t.cardBg);
  set("--theme-text-dark",      t.textDark);
  set("--theme-text-muted",     t.textMuted);
  set("--theme-btn-primary",    t.btnPrimary);
  set("--theme-btn-confirm",    t.btnConfirm);
  set("--theme-btn-navigate",   t.btnNavigate);
  set("--theme-btn-destructive",t.btnDestructive);
  set("--theme-btn-cancel",     t.btnCancel);
  set("--theme-btn-neutral",    t.btnNeutral);
  set("--theme-btn-ghost",      t.btnGhost);
  set("--theme-shadow",         t.shadow);
  set("--theme-border",         t.border);

  if (t.background) document.body.style.backgroundColor = t.background;
}