import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { suggestionsAPI } from "../services/api";

export default function SuggestionsPage() {
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!suggestion.trim()) {
      setError("Por favor escribe tu sugerencia.");
      return;
    }

    setLoading(true);
    try {
      await suggestionsAPI.create(suggestion.trim());
      setSuccess(true);
      setSuggestion("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al enviar la sugerencia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#113780] to-[#0C2A5C]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="text-white/80 hover:text-white transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-white">
              Buzón de sugerencias
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-12 pb-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ¡Gracias por tu sugerencia!
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Tu sugerencia ha sido enviada exitosamente. Valoramos tu
                opinión.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setSuccess(false)}
                  className="bg-[#113780] hover:bg-[#0C2A5C] text-white font-semibold py-2.5 px-6 rounded-xl transition"
                >
                  Enviar otra
                </button>
                <button
                  onClick={() => navigate("/home")}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-6 rounded-xl transition"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#113780]/10 flex items-center justify-center text-2xl flex-shrink-0">
                  📬
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Comparte tu sugerencia
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Tu opinión nos ayuda a mejorar
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-red-600 text-sm flex items-center gap-3">
                  <svg
                    className="h-5 w-5 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sugerencia
                  </label>
                  <textarea
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400 resize-none"
                    placeholder="Escribe tu sugerencia aquí..."
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {suggestion.length}/2000
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !suggestion.trim()}
                  className="w-full bg-gradient-to-r from-[#1A3A7A] to-[#0F2456] hover:from-[#0F2456] hover:to-[#091A3F] text-white font-bold py-3 px-4 rounded-xl transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    "Enviar sugerencia"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
