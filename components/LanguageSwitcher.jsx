import React from "react";
import { useTranslation } from "./TranslationProvider";

const LanguageSwitcher = () => {
  const { lang, setLang, LANGUAGES } = useTranslation();

  return (
    <div style={{ display: "flex", gap: 8 }}>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          style={{
            fontWeight: lang === l.code ? "bold" : "normal",
            textDecoration: lang === l.code ? "underline" : "none",
            background: "none",
            border: "none",
            cursor: "pointer"
          }}
          aria-label={l.label}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
