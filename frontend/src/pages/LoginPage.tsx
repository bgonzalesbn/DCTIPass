import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

export default function LoginPage() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Error en el login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
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
              stroke="rgba(59, 130, 246, 0.1)"
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
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
            <stop offset="100%" stopColor="rgba(147, 51, 234, 0.1)" />
          </linearGradient>
        </defs>

        {/* Grid de fondo */}
        <rect width="100%" height="100%" fill="url(#networkGradient)" />

        {/* Nodos y líneas de conectividad */}
        <circle cx="10%" cy="15%" r="2" fill="rgba(59, 130, 246, 0.6)" />
        <circle cx="85%" cy="25%" r="2" fill="rgba(147, 51, 234, 0.6)" />
        <circle cx="15%" cy="80%" r="2" fill="rgba(59, 130, 246, 0.5)" />
        <circle cx="90%" cy="75%" r="2" fill="rgba(147, 51, 234, 0.5)" />
        <circle cx="50%" cy="10%" r="3" fill="rgba(59, 130, 246, 0.7)" />

        {/* Líneas conectando nodos */}
        <line
          x1="10%"
          y1="15%"
          x2="50%"
          y2="10%"
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth="1"
        />
        <line
          x1="50%"
          y1="10%"
          x2="85%"
          y2="25%"
          stroke="rgba(147, 51, 234, 0.3)"
          strokeWidth="1"
        />
        <line
          x1="85%"
          y1="25%"
          x2="90%"
          y2="75%"
          stroke="rgba(59, 130, 246, 0.25)"
          strokeWidth="1"
        />
        <line
          x1="90%"
          y1="75%"
          x2="15%"
          y2="80%"
          stroke="rgba(147, 51, 234, 0.25)"
          strokeWidth="1"
        />
        <line
          x1="15%"
          y1="80%"
          x2="10%"
          y2="15%"
          stroke="rgba(59, 130, 246, 0.2)"
          strokeWidth="1"
        />
      </svg>

      {/* Elementos de compañerismo - personas conectadas */}
      <div className="absolute top-20 left-10 w-12 h-12 bg-blue-400 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute top-32 left-20 w-10 h-10 bg-purple-400 rounded-full opacity-20 blur-lg"></div>
      <div className="absolute bottom-32 right-12 w-14 h-14 bg-blue-400 rounded-full opacity-15 blur-xl"></div>
      <div className="absolute bottom-16 right-32 w-12 h-12 bg-purple-400 rounded-full opacity-20 blur-lg"></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10">
        {/* Header con Logo Circular */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1A3A7A] to-[#0F2456] rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">◯</span>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-[#0F2456] mb-8">
          Iniciar sesión
        </h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-600 text-sm">
            {error}
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
