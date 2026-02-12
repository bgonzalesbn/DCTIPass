import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    if (!email.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);

    try {
      await authAPI.requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        error.response?.data?.message ||
          "Error al enviar la solicitud. Intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#2B4C8C] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* SVG Pattern */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="networkGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.03)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.01)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#networkGradient)" />
        </svg>

        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-[#0F2456] mb-4">
            ¡Revisa tu correo!
          </h1>

          <p className="text-gray-600 text-center text-sm mb-6 leading-relaxed">
            Si existe una cuenta asociada a{" "}
            <strong className="text-[#0F2456]">{email}</strong>, recibirás un
            enlace para restablecer tu contraseña.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-blue-700 text-xs leading-relaxed">
              <strong>⏰ Importante:</strong> El enlace expirará en 1 hora. Si
              no ves el correo, revisa tu carpeta de spam o correo no deseado.
            </p>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gradient-to-r from-[#1A3A7A] to-[#0F2456] hover:from-[#0F2456] hover:to-[#091A3F] text-white font-bold py-3 px-4 rounded-xl transition duration-300 text-lg shadow-lg hover:shadow-xl"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2B4C8C] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* SVG Pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="networkGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.03)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.01)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#networkGradient)" />
      </svg>

      {/* Logo */}
      <div className="relative z-10 mb-6 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full overflow-hidden shadow-xl border-4 border-white/20 bg-[#2B4C8C] flex items-center justify-center">
          <img
            src="/dcti-pass-logo.png"
            alt="DCTI Pass"
            className="w-full h-full object-contain scale-125"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8">
        {/* Lock Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#EEF2F9] rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-[#113780]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-[#0F2456] mb-2">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="text-gray-500 text-center text-sm mb-6">
          Ingresa el correo electrónico con el que te registraste y te
          enviaremos un enlace para restablecerla.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
            <label className="block text-sm font-semibold text-[#0F2456] mb-3">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400"
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#1A3A7A] to-[#0F2456] hover:from-[#0F2456] hover:to-[#091A3F] text-white font-bold py-3 px-4 rounded-xl transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enviando...
              </span>
            ) : (
              "Enviar enlace de recuperación"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <a
            href="/login"
            className="text-[#1A3A7A] hover:text-[#0F2456] font-semibold text-sm transition hover:underline"
          >
            ← Volver al inicio de sesión
          </a>
        </div>
      </div>
    </div>
  );
}
