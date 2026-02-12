import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

const DIRECTION_OPTIONS = [
  "Operación de Soluciones",
  "Entrega de Soluciones",
  "Gestión y Mejora",
  "Arquitectura",
  "Estrategia Digital",
  "Supervisión y Control Digital",
  "Staff DCTI",
];

export default function RegisterPage() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [direction, setDirection] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [surveyQ1, setSurveyQ1] = useState<number | null>(null);
  const [surveyQ2, setSurveyQ2] = useState<number | null>(null);
  const [surveyQ3, setSurveyQ3] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    if (!employeeNumber.trim()) {
      setError("Número de empleado es requerido");
      return false;
    }
    if (!email.trim()) {
      setError("Email es requerido");
      return false;
    }
    if (!email.includes("@")) {
      setError("Email inválido");
      return false;
    }
    if (!firstName.trim()) {
      setError("Nombre es requerido");
      return false;
    }
    if (!lastName.trim()) {
      setError("Apellido es requerido");
      return false;
    }
    if (!direction.trim()) {
      setError("Dirección es requerida");
      return false;
    }
    if (password.length < 6) {
      setError("Contraseña debe tener mínimo 6 caracteres");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    if (surveyQ1 === null || surveyQ2 === null || surveyQ3 === null) {
      setError("Debes completar todas las preguntas de la encuesta");
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const hobbiesArray = hobbies
        .split(",")
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      const response = await authAPI.register({
        employeeNumber,
        email,
        firstName,
        lastName,
        direction,
        hobbies: hobbiesArray,
        password,
        survey_question_1: surveyQ1!,
        survey_question_2: surveyQ2!,
        survey_question_3: surveyQ3!,
      });

      // Guardar token y datos del usuario
      localStorage.setItem("token", response.data.accessToken);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("userEmail", response.data.email);

      navigate("/home");
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Error en el registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#113780] to-[#0A1F45] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-5 sm:p-8 max-h-[95vh] overflow-y-auto">
        <div className="text-center mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#113780] mb-1 sm:mb-2">
            DCTI Pass
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Crear Nueva Cuenta
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-red-600 text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition text-sm sm:text-base"
                placeholder="Juan"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Apellido
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition text-sm sm:text-base"
                placeholder="Pérez"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Número de Empleado
            </label>
            <input
              type="text"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition text-sm sm:text-base"
              placeholder="12345"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition text-sm sm:text-base"
              placeholder="juan@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Dirección
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition text-sm sm:text-base bg-white"
              required
            >
              <option value="">Selecciona una dirección</option>
              {DIRECTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Hobbies (separados por coma)
            </label>
            <input
              type="text"
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition text-sm sm:text-base"
              placeholder="Ej: Leer, Programar, Deportes"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition text-sm sm:text-base"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition text-sm sm:text-base"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Encuesta General */}
          <div className="border-t border-gray-200 pt-4 mt-2">
            <h3 className="text-sm sm:text-base font-semibold text-[#113780] mb-1">
              Encuesta Inicial
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              En una escala del 1 al 5, califica las siguientes preguntas:
            </p>

            {[
              {
                key: 1,
                value: surveyQ1,
                setter: setSurveyQ1,
                text: "¿Entiendo cómo las direcciones de TI se conectan para generar valor?",
              },
              {
                key: 2,
                value: surveyQ2,
                setter: setSurveyQ2,
                text: "¿Tengo claridad de cómo mi trabajo impacta a otras áreas dentro de TI?",
              },
              {
                key: 3,
                value: surveyQ3,
                setter: setSurveyQ3,
                text: "¿Me siento parte de un sistema integrado dentro de TI?",
              },
            ].map((q) => (
              <div key={q.key} className="mb-5">
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  {q.key}. {q.text}
                </p>
                <div className="flex justify-between gap-1">
                  {[
                    { score: 1, label: "Totalmente en desacuerdo" },
                    { score: 2, label: "En desacuerdo" },
                    { score: 3, label: "Neutral" },
                    { score: 4, label: "De acuerdo" },
                    { score: 5, label: "Totalmente de acuerdo" },
                  ].map((opt) => (
                    <button
                      key={opt.score}
                      type="button"
                      onClick={() => q.setter(opt.score)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border-2 transition text-center ${
                        q.value === opt.score
                          ? "border-[#113780] bg-[#113780]/10 text-[#113780]"
                          : "border-gray-200 hover:border-gray-300 text-gray-500"
                      }`}
                    >
                      <span className="text-sm sm:text-base font-bold">
                        {opt.score}
                      </span>
                      <span className="text-[9px] sm:text-[10px] leading-tight">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#113780] hover:bg-[#0C2A5C] text-white font-semibold py-2 sm:py-2.5 rounded-lg transition disabled:opacity-50 text-sm sm:text-base"
          >
            {loading ? "Registrando..." : "Crear Cuenta"}
          </button>
        </form>

        <div className="text-center mt-4 sm:mt-6">
          <p className="text-gray-600 text-xs sm:text-sm">
            ¿Ya tienes cuenta?{" "}
            <a
              href="/login"
              className="text-[#113780] hover:text-[#0C2A5C] font-semibold"
            >
              Iniciar Sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
