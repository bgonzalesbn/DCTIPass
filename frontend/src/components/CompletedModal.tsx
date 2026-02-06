import { useEffect, useState } from "react";

interface Sticker {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface CompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCorrect: boolean;
  sticker?: Sticker | null;
  pointsEarned: number;
  explanation?: string;
  subActivityName: string;
  alreadyCompleted?: boolean;
}

export default function CompletedModal({
  isOpen,
  onClose,
  isCorrect,
  sticker,
  pointsEarned,
  explanation,
  subActivityName,
  alreadyCompleted = false,
}: CompletedModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && isCorrect && !alreadyCompleted) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isCorrect, alreadyCompleted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-10px",
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-2 h-2 sm:w-3 sm:h-3 ${
                  [
                    "bg-yellow-400",
                    "bg-blue-400",
                    "bg-green-400",
                    "bg-pink-400",
                    "bg-purple-400",
                  ][Math.floor(Math.random() * 5)]
                } ${Math.random() > 0.5 ? "rounded-full" : "rotate-45"}`}
              />
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto transform transition-all">
        {isCorrect ? (
          <>
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 sm:p-8 text-center relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />

              <div className="relative z-10">
                {alreadyCompleted ? (
                  <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">✅</div>
                ) : (
                  <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 animate-bounce">
                    🎉
                  </div>
                )}
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                  {alreadyCompleted
                    ? "¡Ya completaste este reto!"
                    : "¡Respuesta Correcta!"}
                </h2>
                <p className="text-green-100 text-sm sm:text-base">
                  {alreadyCompleted
                    ? "Ya habías ganado este sticker anteriormente"
                    : `Has completado "${subActivityName}"`}
                </p>
              </div>
            </div>

            {/* Sticker Display */}
            <div className="p-5 sm:p-8 text-center">
              {sticker && (
                <div className="mb-4 sm:mb-6">
                  <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3">
                    {alreadyCompleted
                      ? "Tu sticker:"
                      : "¡Has ganado un sticker!"}
                  </p>
                  <div className="relative inline-block">
                    {/* Glow effect */}
                    {!alreadyCompleted && (
                      <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse" />
                    )}
                    <div className="relative bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-4 border-yellow-400 shadow-lg">
                      {sticker.imageUrl ? (
                        <img
                          src={sticker.imageUrl}
                          alt={sticker.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-5xl sm:text-6xl">
                          🏆
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mt-3 sm:mt-4">
                    {sticker.name}
                  </h3>
                  {sticker.description && (
                    <p className="text-gray-600 text-xs sm:text-sm mt-1">
                      {sticker.description}
                    </p>
                  )}
                </div>
              )}

              {!alreadyCompleted && pointsEarned > 0 && (
                <div className="bg-[#113780]/10 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl sm:text-2xl">⭐</span>
                    <span className="text-xl sm:text-2xl font-bold text-[#113780]">
                      +{pointsEarned} puntos
                    </span>
                  </div>
                </div>
              )}

              {explanation && !alreadyCompleted && (
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
                  <div className="flex items-start gap-2">
                    <span className="text-lg sm:text-xl flex-shrink-0">💡</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-blue-800 text-xs sm:text-sm">
                        Información adicional:
                      </p>
                      <p className="text-blue-700 text-xs sm:text-sm mt-1">
                        {explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-[#113780] text-white rounded-lg font-semibold hover:bg-[#0C2A5C] transition text-sm sm:text-base"
              >
                ¡Genial! Continuar
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Error Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-5 sm:p-8 text-center">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">😔</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
                Respuesta Incorrecta
              </h2>
              <p className="text-red-100 text-sm sm:text-base">
                No te preocupes, puedes intentarlo de nuevo
              </p>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-8 text-center">
              {explanation && (
                <div className="bg-amber-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
                  <div className="flex items-start gap-2">
                    <span className="text-lg sm:text-xl flex-shrink-0">📚</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-amber-800 text-xs sm:text-sm">
                        Pista:
                      </p>
                      <p className="text-amber-700 text-xs sm:text-sm mt-1">
                        {explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Revisa el contenido de la subactividad e intenta nuevamente.
              </p>

              <button
                onClick={onClose}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-[#113780] text-white rounded-lg font-semibold hover:bg-[#0C2A5C] transition text-sm sm:text-base"
              >
                Entendido
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
