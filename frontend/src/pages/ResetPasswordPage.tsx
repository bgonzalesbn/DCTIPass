import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../services/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password strength indicators
  const hasMinLength = newPassword.length >= 8;
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;
  const allValid =
    hasMinLength &&
    hasLowercase &&
    hasUppercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError("No se proporcionó un token válido.");
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await authAPI.validateResetToken(token);
        if (response.data.valid) {
          setTokenValid(true);
        } else {
          setTokenError(response.data.message || "Token no válido o expirado.");
        }
      } catch {
        setTokenError("El enlace no es válido o ha expirado.");
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!allValid) {
      setError("La contraseña no cumple con todos los requisitos.");
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg = error.response?.data?.message;
      if (Array.isArray(msg)) {
        setError(msg[0]);
      } else {
        setError(
          msg || "Error al restablecer la contraseña. Intenta de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="min-h-screen bg-[#2B4C8C] flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-white mx-auto mb-4"
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
          <p className="text-white text-lg">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!tokenValid && !success) {
    return (
      <div className="min-h-screen bg-[#2B4C8C] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-[#0F2456] mb-4">
            Enlace no válido
          </h1>

          <p className="text-gray-600 text-center text-sm mb-6">{tokenError}</p>

          <button
            onClick={() => navigate("/forgot-password")}
            className="w-full bg-gradient-to-r from-[#1A3A7A] to-[#0F2456] hover:from-[#0F2456] hover:to-[#091A3F] text-white font-bold py-3 px-4 rounded-xl transition duration-300 text-lg shadow-lg hover:shadow-xl mb-3"
          >
            Solicitar nuevo enlace
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full border-2 border-[#1A3A7A] text-[#1A3A7A] font-bold py-3 px-4 rounded-xl transition duration-300 hover:bg-[#EEF2F9] text-lg"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#2B4C8C] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-[#0F2456] mb-4">
            ¡Contraseña actualizada!
          </h1>

          <p className="text-gray-600 text-center text-sm mb-6 leading-relaxed">
            Tu contraseña ha sido restablecida exitosamente. Ahora puedes
            iniciar sesión con tu nueva contraseña.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-blue-700 text-xs leading-relaxed">
              <strong>📱 Siguiente paso:</strong> Ve a la aplicación principal e
              inicia sesión con tu número de empleado y tu nueva contraseña para
              verificar que todo funciona correctamente.
            </p>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="w-full bg-gradient-to-r from-[#1A3A7A] to-[#0F2456] hover:from-[#0F2456] hover:to-[#091A3F] text-white font-bold py-3 px-4 rounded-xl transition duration-300 text-lg shadow-lg hover:shadow-xl"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-[#2B4C8C] flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
        <h1 className="text-2xl font-bold text-center text-[#0F2456] mb-2">
          Nueva contraseña
        </h1>
        <p className="text-gray-500 text-center text-sm mb-6">
          Ingresa tu nueva contraseña. Asegúrate de que cumpla con todos los
          requisitos de seguridad.
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
            <label className="block text-sm font-semibold text-[#0F2456] mb-2">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400"
              placeholder="Ingresa tu nueva contraseña"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0F2456] mb-2">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400"
              placeholder="Confirma tu nueva contraseña"
              required
            />
          </div>

          {/* Password requirements */}
          {newPassword.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Requisitos de la contraseña:
              </p>
              <Requirement met={hasMinLength} text="Mínimo 8 caracteres" />
              <Requirement met={hasLowercase} text="Al menos una minúscula" />
              <Requirement met={hasUppercase} text="Al menos una mayúscula" />
              <Requirement met={hasNumber} text="Al menos un número" />
              <Requirement
                met={hasSpecial}
                text="Al menos un carácter especial (!@#$%...)"
              />
              {confirmPassword.length > 0 && (
                <Requirement
                  met={passwordsMatch}
                  text="Las contraseñas coinciden"
                />
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !allValid}
            className="w-full bg-gradient-to-r from-[#1A3A7A] to-[#0F2456] hover:from-[#0F2456] hover:to-[#091A3F] text-white font-bold py-3 px-4 rounded-xl transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed text-lg shadow-lg hover:shadow-xl mt-2"
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
                Restableciendo...
              </span>
            ) : (
              "Restablecer contraseña"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <svg
          className="h-4 w-4 text-green-500 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 text-gray-400 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
      <span
        className={`text-xs ${met ? "text-green-600 font-medium" : "text-gray-500"}`}
      >
        {text}
      </span>
    </div>
  );
}
