import { useState, useEffect } from 'react';
import { Trophy, Sparkles, CheckCircle } from 'lucide-react';

interface Winner {
  name: string;
  location: string;
  prize: string;
  wonAt: string;
}

interface LiveWinnersProps {
  limit?: number;
  showHeader?: boolean;
}

export function LiveWinners({ limit = 5, showHeader = true }: LiveWinnersProps) {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
    // Refresh every 30 seconds
    const interval = setInterval(fetchWinners, 30000);
    return () => clearInterval(interval);
  }, [limit]);

  const fetchWinners = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/mega-deal/winners/recent?limit=${limit}`);
      const data = await response.json();
      if (data.success) {
        setWinners(data.winners);
      }
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-bold text-gray-900">Recent Winners</h3>
          </div>
        )}
        <div className="space-y-3">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (winners.length === 0) {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h3 className="text-xl font-bold text-gray-900">Recent Winners</h3>
          </div>
        )}
        <div className="text-center py-8 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No winners yet. Be the first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6">
      {showHeader && (
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-yellow-600" />
          <h3 className="text-xl font-bold text-gray-900">Recent Winners</h3>
          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            LIVE
          </span>
        </div>
      )}

      <div className="space-y-3">
        {winners.map((winner, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {winner.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 truncate">{winner.name}</h4>
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              </div>
              <p className="text-sm text-gray-500">{winner.location}</p>
              <div className="flex items-center gap-1 mt-1">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-purple-600">{winner.prize}</span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400">
                {new Date(winner.wonAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500">
          Winners are updated in real-time. Start shopping to win!
        </p>
      </div>
    </div>
  );
}
