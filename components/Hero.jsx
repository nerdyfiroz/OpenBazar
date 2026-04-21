import React from "react";
import { useTranslation } from "./TranslationProvider";

const Hero = () => {
  const { t } = useTranslation();
  return (
    <section style={{ padding: 32, textAlign: "center" }}>
      <h1>{t("hero.title")}</h1>
      <p>{t("hero.subtitle")}</p>
    </section>
  );
};

export default Hero;
