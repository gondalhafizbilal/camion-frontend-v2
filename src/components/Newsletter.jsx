"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { API_ENDPOINTS } from "@/services/api/api";
import { apiFetch } from "@/services/api/apiClient";

const Newsletter = () => {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await apiFetch(API_ENDPOINTS.NEWS_LETTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
        setEmail("");
      } else {
        const data = await response.json();
        setError(data.message || "Something went wrong!");
      }
    } catch (error) {
      setError("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t("subscribeToNewsletter")}
          </h2>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t("latestNewsUpdates")}
          </p>
        </div>

        <div className="mt-8 max-w-md mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center">
              <input
                type="email"
                placeholder={t("enterYourEmail")}
                className="w-full px-4 py-3 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#B92123] bg-gray-800 text-white placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button
                type="submit"
                className="bg-[#B92123] hover:bg-[#e14a5c] text-white px-4 py-3 rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#B92123]"
                disabled={loading}
              >
                {loading ? t("subscribing") : t("subscribe")}
              </button>
            </div>

            {success && (
              <p className="mt-4 text-green-500">{t("thankYouForSubscribing")}</p>
            )}

            {error && <p className="mt-4 text-red-500">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
