import { useState, useRef, useEffect } from 'react';
import { Sparkles, Gift, RefreshCw } from 'lucide-react';

interface ScratchCardProps {
  onScratchComplete: (prize: any) => void;
  prize?: any;
  isScratched?: boolean;
  isLoading?: boolean;
}

export function ScratchCard({ onScratchComplete, prize, isScratched: alreadyScratched, isLoading }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(alreadyScratched || false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !isScratched) {
      initCanvas();
    }
  }, []);

  useEffect(() => {
    if (alreadyScratched) {
      setIsScratched(true);
    }
  }, [alreadyScratched]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Fill with scratch overlay
    ctx.fillStyle = '#8B5CF6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add pattern
    ctx.fillStyle = '#7C3AED';
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 10 + 5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪙 SCRATCH ME!', canvas.width / 2, canvas.height / 2);
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentPixels++;
      }
    }

    const percentage = (transparentPixels / (pixels.length / 4)) * 100;
    setScratchPercentage(percentage);

    // Auto-reveal when 50% scratched
    if (percentage > 50 && !isScratched) {
      revealPrize();
    }
  };

  const revealPrize = () => {
    setIsScratched(true);
    setShowConfetti(true);
    
    // Clear canvas completely
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    // Hide confetti after 3 seconds
    setTimeout(() => setShowConfetti(false), 3000);

    if (prize) {
      onScratchComplete(prize);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isScratched || isLoading) return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    scratch(pos.x, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isScratched || isLoading) return;
    const pos = getMousePos(e);
    scratch(pos.x, pos.y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isScratched || isLoading) return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    scratch(pos.x, pos.y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isScratched || isLoading) return;
    e.preventDefault();
    const pos = getMousePos(e);
    scratch(pos.x, pos.y);
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
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

      {/* Scratch Card Container */}
      <div className="relative w-full h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl overflow-hidden shadow-lg">
        {/* Prize Content (Hidden under scratch layer) */}
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          {isScratched && prize ? (
            <div className="text-center p-6">
              {prize.image && (
                <img
                  src={prize.image}
                  alt={prize.name}
                  className="w-24 h-24 mx-auto mb-4 object-contain"
                />
              )}
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {prize.name}
                </h3>
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </div>
              {prize.type === 'coupon' && (
                <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-semibold">
                  ₹{prize.couponValue} OFF
                </div>
              )}
              {prize.isGrandPrize && (
                <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-semibold mt-2">
                  🏆 GRAND PRIZE
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-6">
              <Gift className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600 font-medium">Scratch to reveal your prize!</p>
            </div>
          )}
        </div>

        {/* Scratch Layer */}
        {!isScratched && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-pointer touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}

        {/* Progress indicator */}
        {!isScratched && scratchPercentage > 0 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
            {Math.round(scratchPercentage)}% scratched
          </div>
        )}
      </div>

      {/* Instructions */}
      {!isScratched && (
        <p className="text-center text-gray-600 mt-4 text-sm">
          Scratch the card to reveal your prize! (50% to auto-reveal)
        </p>
      )}
    </div>
  );
}
