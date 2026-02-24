interface FinalSurveyLoginModalProps {
  open: boolean;
  questions: string[];
  likertOptions: { value: number; label: string }[];
  answers: number[];
  submitting: boolean;
  feedback: { type: "success" | "error"; message: string } | null;
  onAnswerChange: (questionIndex: number, value: number) => void;
  onSubmit: () => void;
}

export default function FinalSurveyLoginModal({
  open,
  questions,
  likertOptions,
  answers,
  submitting,
  feedback,
  onAnswerChange,
  onSubmit,
}: FinalSurveyLoginModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-emerald-100 p-5 sm:p-7">
        <div className="text-center mb-6">
          <p className="text-sm uppercase tracking-widest text-emerald-500 font-semibold">
            Encuesta final IT Experience
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            Antes de continuar, completa tu encuesta final
          </h2>
          <p className="text-gray-500 mt-2">
            Tus respuestas permiten cerrar tu participación y habilitar la
            insignia de IT Experience.
          </p>
        </div>

        <div className="space-y-5">
          {questions.map((question, questionIndex) => (
            <div
              key={question}
              className="border border-gray-100 rounded-2xl p-4 sm:p-5"
            >
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {questionIndex + 1}. {question}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                {likertOptions.map((option) => {
                  const isSelected = answers[questionIndex] === option.value;
                  return (
                    <button
                      type="button"
                      key={`${questionIndex}-${option.value}`}
                      onClick={() =>
                        onAnswerChange(questionIndex, option.value)
                      }
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition flex flex-col items-center justify-center text-center shadow-sm ${isSelected ? "bg-emerald-500 text-white border-emerald-500 shadow-lg" : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300"}`}
                    >
                      <span className="text-xl font-bold">{option.value}</span>
                      <span className="text-[11px] leading-tight mt-1 opacity-80">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {feedback && (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}
          >
            {feedback.message}
          </div>
        )}

        <button
          onClick={onSubmit}
          disabled={submitting}
          className={`w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-4 rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center gap-2 ${submitting ? "opacity-70 cursor-not-allowed" : "hover:from-emerald-600 hover:to-teal-600"}`}
        >
          {submitting ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Enviando encuesta...
            </>
          ) : (
            <>
              <span>Enviar encuesta final</span>
              <span>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
