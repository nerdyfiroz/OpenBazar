import React, { createContext, useContext, useEffect, useState } from "react";

const TranslationContext = createContext();

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "bn", label: "BN" }
];

const ALLOWED_LANGUAGE_CODES = new Set(LANGUAGES.map((item) => item.code));

const normalizeLang = (value) => {
  const next = String(value || '').trim().toLowerCase();
  return ALLOWED_LANGUAGE_CODES.has(next) ? next : 'en';
};

function getInitialLang() {
  if (typeof window !== "undefined") {
    return normalizeLang(localStorage.getItem("lang"));
  }
  return "en";
}

export const TranslationProvider = ({ children }) => {
  const [lang, setLangState] = useState("en"); // Default for server to prevent hydration mismatch
  const [translations, setTranslations] = useState({});

  const setLang = (value) => {
    setLangState(normalizeLang(value));
  };

  useEffect(() => {
    // Read from localStorage on client mount if it wasn't done yet
    if (typeof window !== "undefined") {
      const stored = normalizeLang(localStorage.getItem("lang"));
      if (stored && stored !== lang) {
        setLang(stored);
      }
    }
  }, [lang]);

  useEffect(() => {
    import(`../locales/${normalizeLang(lang)}.json`)
      .then((mod) => setTranslations(mod))
      .catch(() => {
        setLang('en');
      });
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", normalizeLang(lang));
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
