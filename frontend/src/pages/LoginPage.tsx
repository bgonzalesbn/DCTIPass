import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

export default function LoginPage() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.login(employeeNumber, password);

      // Guardar token y usuario
      localStorage.setItem("token", response.data.accessToken);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("userEmail", response.data.email);

      navigate("/home");
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      if (error.response?.status === 401) {
        setError(
          "Credenciales incorrectas. Verifica tu número de empleado y contraseña.",
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Error en el login. Intenta de nuevo.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2B4C8C] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* SVG Pattern de nodos de red y tecnología */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Líneas de conectividad de red */}
        <defs>
          <pattern
            id="grid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          </pattern>
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

        {/* Grid de fondo */}
        <rect width="100%" height="100%" fill="url(#networkGradient)" />

        {/* Nodos y líneas de conectividad */}
        <circle cx="10%" cy="15%" r="2" fill="rgba(255, 255, 255, 0.15)" />
        <circle cx="85%" cy="25%" r="2" fill="rgba(255, 255, 255, 0.12)" />
        <circle cx="15%" cy="80%" r="2" fill="rgba(255, 255, 255, 0.1)" />
        <circle cx="90%" cy="75%" r="2" fill="rgba(255, 255, 255, 0.1)" />
        <circle cx="50%" cy="10%" r="3" fill="rgba(255, 255, 255, 0.15)" />

        {/* Líneas conectando nodos */}
        <line
          x1="10%"
          y1="15%"
          x2="50%"
          y2="10%"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />
        <line
          x1="50%"
          y1="10%"
          x2="85%"
          y2="25%"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="1"
        />
        <line
          x1="85%"
          y1="25%"
          x2="90%"
          y2="75%"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="1"
        />
        <line
          x1="90%"
          y1="75%"
          x2="15%"
          y2="80%"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth="1"
        />
        <line
          x1="15%"
          y1="80%"
          x2="10%"
          y2="15%"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
        />
      </svg>

      {/* Logo DCTI Pass - círculo con ilustración + texto */}
      <div className="relative z-10 mb-6 flex flex-col items-center">
        <div className="w-28 h-28 rounded-full overflow-hidden shadow-xl border-4 border-white/20 bg-[#2B4C8C]">
          <img
            src="/dcti-pass-logo.jpg"
            alt="DCTI Pass"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-white text-2xl font-bold mt-3 tracking-wider drop-shadow-md">
          DCTI Pass
        </h2>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-8">
        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-[#0F2456] mb-8">
          Iniciar sesión
        </h1>

        {/* Error Message */}
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

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email/Employee Number Field */}
          <div>
            <label className="block text-sm font-semibold text-[#0F2456] mb-3">
              Número de empleado
            </label>
            <input
              type="text"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400"
              placeholder="Ingrese su número"
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-[#0F2456] mb-3">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400"
              placeholder="Ingrese su contraseña"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#1A3A7A] to-[#0F2456] hover:from-[#0F2456] hover:to-[#091A3F] text-white font-bold py-3 px-4 rounded-xl transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed mt-8 text-lg shadow-lg hover:shadow-xl"
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
                Cargando...
              </span>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            ¿No tienes cuenta?{" "}
            <a
              href="/register"
              className="text-[#1A3A7A] hover:text-[#0F2456] font-semibold transition hover:underline"
            >
              Registrarse
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
