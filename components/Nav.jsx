import React from "react";
import { useTranslation } from "./TranslationProvider";
import LanguageSwitcher from "./LanguageSwitcher";

const Nav = () => {
  const { t } = useTranslation();
  return (
    <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <a href="/">{t("nav.home")}</a>
      <a href="/about">{t("nav.about")}</a>
      <a href="/contact">{t("nav.contact")}</a>
      <a href="/policies">{t("nav.policies")}</a>
      <LanguageSwitcher />
    </nav>
  );
};

export default Nav;
