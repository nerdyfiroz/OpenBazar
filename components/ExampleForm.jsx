import React from "react";
import { useTranslation } from "./TranslationProvider";

const ExampleForm = () => {
  const { t } = useTranslation();
  return (
    <form style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300 }}>
      <label>
        {t("form.name")}
        <input type="text" name="name" />
      </label>
      <label>
        {t("form.email")}
        <input type="email" name="email" />
      </label>
      <label>
        {t("form.message")}
        <textarea name="message" />
      </label>
      <button type="submit">{t("buttons.submit")}</button>
    </form>
  );
};

export default ExampleForm;
