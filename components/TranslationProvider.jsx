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
  const [lang, setLang] = useState(getInitialLang());
  const [translations, setTranslations] = useState({});

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
