import { useState } from "react";

interface Sticker {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  options: string[];
  onAnswer: (answer: string) => void;
  loading?: boolean;
  subActivityName: string;
  sticker?: Sticker;
}

export default function QuestionModal({
  isOpen,
  onClose,
  question,
  options,
  onAnswer,
  loading = false,
  subActivityName,
  sticker,
}: QuestionModalProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedAnswer) {
      onAnswer(selectedAnswer);
      setSelectedAnswer(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#113780] to-[#0C2A5C] p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center gap-3 sm:gap-4">
            {sticker?.imageUrl ? (
              <img
                src={sticker.imageUrl}
                alt={sticker.name}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl">❓</span>
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Reto Disponible
              </h2>
              <p className="text-blue-200 text-xs sm:text-sm truncate">
                {subActivityName}
              </p>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="text-xl sm:text-2xl">🎯</span>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Pregunta:
              </h3>
            </div>
            <p className="text-gray-700 text-base sm:text-lg bg-gray-50 p-3 sm:p-4 rounded-lg">
              {question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <p className="font-medium text-gray-700 text-sm sm:text-base">
              Selecciona tu respuesta:
            </p>
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedAnswer(option)}
                disabled={loading}
                className={`w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  selectedAnswer === option
                    ? "border-[#113780] bg-[#113780]/10 text-[#113780]"
                    : "border-gray-200 hover:border-[#113780]/50 hover:bg-gray-50"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedAnswer === option
                        ? "border-[#113780] bg-[#113780]"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedAnswer === option && (
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium text-sm sm:text-base">
                    {option}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 text-sm sm:text-base order-2 sm:order-1"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer || loading}
              className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#113780] text-white rounded-lg font-semibold hover:bg-[#0C2A5C] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Enviar Respuesta</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
