import React, { createContext, useContext, useEffect, useState } from "react";

const TranslationContext = createContext();

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "bn", label: "BN" }
];

function getInitialLang() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("lang") || "en";
  }
  return "en";
}

export const TranslationProvider = ({ children }) => {
  const [lang, setLang] = useState("en"); // Default for server to prevent hydration mismatch
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    // Read from localStorage on client mount if it wasn't done yet
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lang");
      if (stored && stored !== lang) {
        setLang(stored);
      }
    }
  }, []);

  useEffect(() => {
    import(`../locales/${lang}.json`).then((mod) => setTranslations(mod));
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", lang);
    }
  }, [lang]);

  const t = (key) => {
    return key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : key), translations);
  };

  return (
    <TranslationContext.Provider value={{ lang, setLang, t, LANGUAGES }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
