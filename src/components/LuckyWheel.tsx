import { useState, useRef, useEffect } from 'react';
import { Sparkles, RotateCw, Gift } from 'lucide-react';

interface LuckyWheelProps {
  segments: Array<{
    prizeId: string;
    probability: number;
    color: string;
  }>;
  onSpinComplete: (prize: any, segment: number) => void;
  isSpun?: boolean;
  isLoading?: boolean;
  prize?: any;
}

export function LuckyWheel({ segments, onSpinComplete, isSpun: alreadySpun, isLoading, prize }: LuckyWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinWheel = () => {
    if (isSpinning || alreadySpun || isLoading) return;

    setIsSpinning(true);
    
    // Calculate random rotation (minimum 5 full spins + random segment)
    const segmentAngle = 360 / segments.length;
    const randomSegment = Math.floor(Math.random() * segments.length);
    const spins = 5 + Math.random() * 3; // 5-8 full spins
    const targetRotation = spins * 360 + (randomSegment * segmentAngle);
    
    setRotation(prev => prev + targetRotation);

    // Call completion after animation
    setTimeout(() => {
      setIsSpinning(false);
      setShowConfetti(true);
      
      if (prize) {
        onSpinComplete(prize, randomSegment);
      }
      
      setTimeout(() => setShowConfetti(false), 3000);
    }, 5000); // 5 second spin animation
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center">
        <RotateCw className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-bounce"
              style={{
                backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][i % 6],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Wheel Container */}
      <div className="relative w-full h-96 flex items-center justify-center">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-10">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-500 drop-shadow-lg"></div>
        </div>

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative w-80 h-80 rounded-full overflow-hidden shadow-2xl border-8 border-yellow-500"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          {segments.map((segment, index) => {
            const angle = (index / segments.length) * 360;
            const skew = 90 - 360 / segments.length;
            
            return (
              <div
                key={index}
                className="absolute w-1/2 h-1/2 origin-bottom-right"
                style={{
                  transform: `rotate(${angle}deg) skewY(-${skew}deg)`,
                  backgroundColor: segment.color
                }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    transform: `skewY(${skew}deg) rotate(${360 / segments.length / 2}deg)`
                  }}
                >
                  <span className="text-white font-bold text-xs text-center px-2">
                    {segment.probability}%
                  </span>
                </div>
              </div>
            );
          })}

          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-yellow-500">
            {alreadySpun && prize ? (
              <Gift className="w-8 h-8 text-purple-600" />
            ) : (
              <Sparkles className="w-8 h-8 text-yellow-500" />
            )}
          </div>
        </div>

        {/* Spin Button */}
        {!alreadySpun && !isSpinning && (
          <button
            onClick={spinWheel}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-16 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:from-yellow-600 hover:to-orange-600 transition-all hover:scale-105 flex items-center gap-2"
          >
            <RotateCw className="w-6 h-6" />
            SPIN TO WIN!
          </button>
        )}

        {/* Prize Display (after spin) */}
        {alreadySpun && prize && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-16 bg-white px-6 py-4 rounded-xl shadow-xl text-center min-w-[200px]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-gray-900">You Won!</span>
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            {prize.image && (
              <img
                src={prize.image}
                alt={prize.name}
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
            )}
            <h3 className="font-semibold text-purple-600">{prize.name}</h3>
            {prize.isGrandPrize && (
              <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold mt-2">
                🏆 GRAND PRIZE
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      {!alreadySpun && !isSpinning && (
        <p className="text-center text-gray-600 mt-24 text-sm">
          Click the button to spin the wheel and win exciting prizes!
        </p>
      )}
    </div>
  );
}
