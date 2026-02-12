import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";

const SECURITY_QUESTIONS = [
  "¿Cuál es el nombre de tu primera mascota?",
  "¿En qué ciudad naciste?",
  "¿Cuál es el nombre de tu mejor amigo de la infancia?",
  "¿Cuál fue tu primer trabajo?",
  "¿Cuál es tu comida favorita?",
  "¿Cuál es el nombre de tu escuela primaria?",
  "¿Cuál es tu película favorita?",
  "¿Cuál es el segundo nombre de tu madre?",
];

type Step =
  | "verify"
  | "security-question"
  | "new-password"
  | "set-question"
  | "success";

function PageWrapper({ children }: { children: React.ReactNode }) {
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
        {children}
      </div>
    </div>
  );
}

function ErrorAlert({ error }: { error: string }) {
  if (!error) return null;
  return (
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
  );
}

function SubmitButton({
  text,
  loadingText,
  loading,
}: {
  text: string;
  loadingText: string;
  loading: boolean;
}) {
  return (
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </span>
      ) : (
        text
      )}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("verify");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [newQuestionAnswer, setNewQuestionAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSecurityQuestion, setHasSecurityQuestion] = useState(false);
  const navigate = useNavigate();

  // Password strength checks
  const passwordChecks = {
    length: newPassword.length >= 8,
    lower: /[a-z]/.test(newPassword),
    upper: /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
  };
  const allChecks = Object.values(passwordChecks).every(Boolean);

  // Step 1: Verify identity
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!employeeNumber.trim() || !email.trim()) {
      setError("Completa todos los campos.");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyIdentity(employeeNumber, email);
      const data = res.data;
      if (data.hasSecurityQuestion) {
        setHasSecurityQuestion(true);
        setSecurityQuestion(data.securityQuestion);
        setStep("security-question");
      } else {
        setHasSecurityQuestion(false);
        setStep("new-password");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al verificar la identidad.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2a: Answer security question
  const handleAnswerQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!securityAnswer.trim()) {
      setError("Ingresa tu respuesta.");
      return;
    }
    setLoading(true);
    try {
      await authAPI.verifySecurityAnswer(employeeNumber, securityAnswer);
      setStep("new-password");
    } catch (err: any) {
      setError(err.response?.data?.message || "Respuesta incorrecta.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!allChecks) {
      setError("La contraseña no cumple con todos los requisitos.");
      return;
    }
    setLoading(true);
    try {
      if (hasSecurityQuestion) {
        await authAPI.resetPasswordWithAnswer(
          employeeNumber,
          securityAnswer,
          newPassword,
        );
        setStep("success");
      } else {
        await authAPI.resetPasswordFirstTime(
          employeeNumber,
          email,
          newPassword,
        );
        setStep("set-question");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Error al restablecer la contraseña.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Set security question (first time only)
  const handleSetQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedQuestion || !newQuestionAnswer.trim()) {
      setError("Selecciona una pregunta e ingresa tu respuesta.");
      return;
    }
    setLoading(true);
    try {
      await authAPI.setSecurityQuestion(
        employeeNumber,
        selectedQuestion,
        newQuestionAnswer,
      );
      setStep("success");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Error al configurar la pregunta de seguridad.",
      );
    } finally {
      setLoading(false);
    }
  };

  // === SUCCESS SCREEN ===
  if (step === "success") {
    return (
      <PageWrapper>
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-[#0F2456] mb-4">
          ¡Contraseña actualizada!
        </h1>
        <p className="text-gray-600 text-center text-sm mb-6">
          Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar
          sesión con tu nueva contraseña.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-gradient-to-r from-[#1A3A7A] to-[#0F2456] hover:from-[#0F2456] hover:to-[#091A3F] text-white font-bold py-3 px-4 rounded-xl transition duration-300 text-lg shadow-lg hover:shadow-xl"
        >
          Ir al inicio de sesión
        </button>
      </PageWrapper>
    );
  }

  // === SET SECURITY QUESTION (after first reset) ===
  if (step === "set-question") {
    return (
      <PageWrapper>
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-[#0F2456] mb-2">
          Pregunta de seguridad
        </h1>
        <p className="text-gray-500 text-center text-sm mb-6">
          Configura una pregunta de seguridad para poder recuperar tu contraseña
          en el futuro.
        </p>
        <ErrorAlert error={error} />
        <form onSubmit={handleSetQuestion} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#0F2456] mb-2">
              Selecciona una pregunta
            </label>
            <select
              value={selectedQuestion}
              onChange={(e) => setSelectedQuestion(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700 bg-white"
              required
            >
              <option value="">-- Selecciona una pregunta --</option>
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0F2456] mb-2">
              Tu respuesta
            </label>
            <input
              type="text"
              value={newQuestionAnswer}
              onChange={(e) => setNewQuestionAnswer(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400"
              placeholder="Ingresa tu respuesta"
              required
            />
          </div>
          <SubmitButton
            text="Guardar pregunta"
            loadingText="Guardando..."
            loading={loading}
          />
        </form>
      </PageWrapper>
    );
  }

  // === NEW PASSWORD ===
  if (step === "new-password") {
    return (
      <PageWrapper>
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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-[#0F2456] mb-2">
          Nueva contraseña
        </h1>
        <p className="text-gray-500 text-center text-sm mb-6">
          Crea una contraseña segura para tu cuenta.
        </p>
        <ErrorAlert error={error} />
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#0F2456] mb-2">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700"
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700"
              placeholder="Repite tu nueva contraseña"
              required
            />
          </div>
          {/* Password requirements */}
          {newPassword && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Requisitos:
              </p>
              {[
                { check: passwordChecks.length, label: "Mínimo 8 caracteres" },
                { check: passwordChecks.lower, label: "Una letra minúscula" },
                { check: passwordChecks.upper, label: "Una letra mayúscula" },
                { check: passwordChecks.number, label: "Un número" },
                {
                  check: passwordChecks.special,
                  label: "Un carácter especial",
                },
              ].map(({ check, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  <span className={check ? "text-green-500" : "text-gray-400"}>
                    {check ? "✓" : "○"}
                  </span>
                  <span className={check ? "text-green-700" : "text-gray-500"}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
          <SubmitButton
            text="Restablecer contraseña"
            loadingText="Actualizando..."
            loading={loading}
          />
        </form>
        <div className="text-center mt-4">
          <button
            onClick={() => {
              setStep("verify");
              setError("");
            }}
            className="text-[#1A3A7A] hover:text-[#0F2456] font-semibold text-sm transition hover:underline"
          >
            ← Volver
          </button>
        </div>
      </PageWrapper>
    );
  }

  // === SECURITY QUESTION ANSWER ===
  if (step === "security-question") {
    return (
      <PageWrapper>
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-[#0F2456] mb-2">
          Pregunta de seguridad
        </h1>
        <p className="text-gray-500 text-center text-sm mb-2">
          Responde tu pregunta de seguridad para continuar.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-[#0F2456] font-semibold text-sm">
            {securityQuestion}
          </p>
        </div>
        <ErrorAlert error={error} />
        <form onSubmit={handleAnswerQuestion} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#0F2456] mb-2">
              Tu respuesta
            </label>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400"
              placeholder="Ingresa tu respuesta"
              required
            />
          </div>
          <SubmitButton
            text="Verificar respuesta"
            loadingText="Verificando..."
            loading={loading}
          />
        </form>
        <div className="text-center mt-4">
          <button
            onClick={() => {
              setStep("verify");
              setError("");
              setSecurityAnswer("");
            }}
            className="text-[#1A3A7A] hover:text-[#0F2456] font-semibold text-sm transition hover:underline"
          >
            ← Volver
          </button>
        </div>
      </PageWrapper>
    );
  }

  // === VERIFY IDENTITY (default step) ===
  return (
    <PageWrapper>
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
        Ingresa tu número de empleado y correo electrónico registrado para
        verificar tu identidad.
      </p>
      <ErrorAlert error={error} />
      <form onSubmit={handleVerify} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#0F2456] mb-2">
            Número de empleado
          </label>
          <input
            type="text"
            value={employeeNumber}
            onChange={(e) => setEmployeeNumber(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400"
            placeholder="Ingresa tu número de empleado"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0F2456] mb-2">
            Correo electrónico
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A3A7A] focus:border-transparent outline-none transition text-gray-700 placeholder-gray-400"
            placeholder="Ingresa tu correo registrado"
            required
          />
        </div>
        <SubmitButton
          text="Verificar identidad"
          loadingText="Verificando..."
          loading={loading}
        />
      </form>
      <div className="text-center mt-6">
        <a
          href="/login"
          className="text-[#1A3A7A] hover:text-[#0F2456] font-semibold text-sm transition hover:underline"
        >
          ← Volver al inicio de sesión
        </a>
      </div>
    </PageWrapper>
  );
}
