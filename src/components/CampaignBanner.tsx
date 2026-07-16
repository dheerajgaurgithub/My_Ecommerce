import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Calendar, ArrowRight } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
  tagline: string;
  bannerImage: string;
  minimumPurchaseAmount: number;
  endDate: string;
  enableLuckyWheel: boolean;
  luckyWheelThreshold: number;
}

export function CampaignBanner() {
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchCampaign();
  }, []);

  useEffect(() => {
    if (campaign?.endDate) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(campaign.endDate).getTime();
        const distance = end - now;

        if (distance > 0) {
          setTimeLeft({
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [campaign]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/mega-deal/campaign/active');
      const data = await response.json();
      if (data.success) {
        setCampaign(data.campaign);
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 animate-pulse">
        <div className="h-8 bg-white bg-opacity-20 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-white bg-opacity-20 rounded w-1/3"></div>
      </div>
    );
  }

  if (!campaign) {
    // Show demo banner for testing when no active campaign exists
    return (
      <div className="relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"></div>
        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-6 h-6 text-yellow-300" />
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                  MEGA DEAL
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Mahir & Friends Mega Deal Festival 2026
              </h2>
              <p className="text-lg text-purple-100 mb-4">
                Shop More. Scratch More. Win More.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-purple-100">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Shop ₹5,000+</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  <span>+ Lucky Wheel at ₹10,000+</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-4">
              <button
                onClick={() => navigate('/mega-deal')}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-lg"
              >
                Participate Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400 opacity-10 rounded-full blur-3xl"></div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background Image with Overlay */}
      {campaign.bannerImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${campaign.bannerImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-pink-900 opacity-90"></div>
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"></div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-6 h-6 text-yellow-300" />
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                MEGA DEAL
              </span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {campaign.name}
            </h2>
            
            <p className="text-lg text-purple-100 mb-4">
              {campaign.tagline}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-purple-100">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Shop ₹{campaign.minimumPurchaseAmount}+</span>
              </div>
              {campaign.enableLuckyWheel && (
                <div className="flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  <span>+ Lucky Wheel at ₹{campaign.luckyWheelThreshold}+</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            {/* Countdown Timer */}
            <div className="flex gap-2">
              {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px] text-center">
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-purple-100 capitalize">{unit}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/mega-deal')}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-lg"
            >
              Participate Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400 opacity-10 rounded-full blur-3xl"></div>
    </div>
  );
}
