const { notFound } = require("next/navigation");

module.exports = {
  locales: ["ar", "en"],
  defaultLocale: "ar",
  async getMessages(locale) {
    try {
      return (await import(`./messages/${locale}.json`)).default;
    } catch (error) {
      notFound();
    }
  },
  onError(error) {
    if (error.code === "MISSING_MESSAGE") {
      // Concisely log just the missing key
      console.warn(`Missing translation key: ${error.originalMessage}`);
    } else {
      // Log other errors with more detail
      console.error("next-intl error:", error);
    }
  },
};
