import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuckyWheel } from '../components/LuckyWheel';
import { Trophy, CheckCircle, QrCode, Clock, Calendar } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
  tagline: string;
  luckyWheelThreshold: number;
  endDate: string;
}

interface Prize {
  _id: string;
  name: string;
  description: string;
  image: string;
  type: 'coupon' | 'physical' | 'better_luck';
  couponValue: number;
  couponCode: string;
  couponExpiryDays: number;
  isGrandPrize: boolean;
}

interface LuckyWheelData {
  _id: string;
  campaignId: Campaign;
  orderId: string;
  prizeId: Prize;
  uniqueToken: string;
  isSpun: boolean;
  isClaimed: boolean;
  isCollected: boolean;
  expiresAt: string;
  qrCode: string;
  collectionOTP: string;
  wheelSegments: Array<{
    prizeId: string;
    probability: number;
    color: string;
  }>;
  landedSegment: number | null;
  createdAt: string;
}

export function LuckyWheelPage() {
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [luckyWheels, setLuckyWheels] = useState<LuckyWheelData[]>([]);
  const [selectedWheel, setSelectedWheel] = useState<LuckyWheelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchCampaign();
    fetchLuckyWheels();
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
      if (data.success && data.campaign.enableLuckyWheel) {
        setCampaign(data.campaign);
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLuckyWheels = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/mega-deal/lucky-wheels', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLuckyWheels(data.luckyWheels);
      }
    } catch (error) {
      console.error('Error fetching lucky wheels:', error);
    }
  };

  const handleSpinComplete = async () => {
    setSpinning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/mega-deal/lucky-wheel/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ luckyWheelId: selectedWheel?._id })
      });
      const data = await response.json();
      if (data.success) {
        fetchLuckyWheels();
      }
    } catch (error) {
      console.error('Error spinning wheel:', error);
    } finally {
      setSpinning(false);
    }
  };

  const handleClaimPrize = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/mega-deal/lucky-wheel/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          luckyWheelId: selectedWheel?._id,
          pickupStore: selectedStore 
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowClaimModal(false);
        setShowSuccess(true);
        fetchLuckyWheels();
        setTimeout(() => setShowSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Error claiming prize:', error);
    } finally {
      setClaiming(false);
    }
  };

  const handleGenerateOTP = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/mega-deal/lucky-wheel/generate-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ luckyWheelId: selectedWheel?._id })
      });
      const data = await response.json();
      if (data.success) {
        alert('New OTP generated! Valid for 15 minutes.');
      }
    } catch (error) {
      console.error('Error generating OTP:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Lucky Wheel Not Available</h2>
          <p className="text-gray-600">Check back later for exciting lucky wheel offers!</p>
          <button
            onClick={() => navigate('/shop')}
            className="mt-6 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="w-8 h-8" />
            <h1 className="text-4xl md:text-5xl font-bold">Lucky Wheel</h1>
          </div>
          <p className="text-xl mb-6">Spin to Win Amazing Prizes!</p>
          
          {/* Countdown Timer */}
          <div className="flex justify-center gap-4 mb-6">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="bg-white bg-opacity-20 rounded-lg px-4 py-3 min-w-[80px]">
                <div className="text-3xl font-bold">{value}</div>
                <div className="text-sm capitalize">{unit}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Shop ₹{campaign.luckyWheelThreshold}+ to unlock lucky wheel spins</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Lucky Wheels Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Your Lucky Wheels</h2>

          {luckyWheels.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 mb-4">No lucky wheels yet</p>
              <p className="text-gray-500 text-sm mb-6">Complete eligible orders (₹{campaign.luckyWheelThreshold}+) to unlock lucky wheel spins</p>
              <button
                onClick={() => navigate('/shop')}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {luckyWheels.map((wheel) => (
                <div
                  key={wheel._id}
                  className="border border-gray-200 rounded-xl p-6 hover:border-orange-300 transition cursor-pointer"
                  onClick={() => setSelectedWheel(wheel)}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Order: #{wheel.orderId.slice(-6)}</span>
                    <div className="flex items-center gap-2">
                      {wheel.isSpun ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                      {wheel.isClaimed && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </div>

                  {/* Lucky Wheel */}
                  {selectedWheel?._id === wheel._id ? (
                    <LuckyWheel
                      segments={wheel.wheelSegments}
                      onSpinComplete={() => handleSpinComplete()}
                      isSpun={wheel.isSpun}
                      isLoading={spinning}
                      prize={wheel.prizeId}
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>
                  )}

                  {/* Prize Info (shown after spinning) */}
                  {wheel.isSpun && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {wheel.prizeId.isGrandPrize && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">
                            🏆 GRAND PRIZE
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold">{wheel.prizeId.name}</h3>
                      {wheel.prizeId.type === 'coupon' && wheel.isClaimed && (
                        <div className="mt-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-semibold">
                          Coupon: {wheel.prizeId.couponCode}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {wheel.isSpun && !wheel.isClaimed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWheel(wheel);
                        setShowClaimModal(true);
                      }}
                      className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                    >
                      Claim Prize
                    </button>
                  )}

                  {wheel.isClaimed && wheel.prizeId.type === 'physical' && !wheel.isCollected && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Pickup Details</span>
                      </div>
                      <p className="text-sm text-blue-700 mb-2">QR Code: {wheel.qrCode}</p>
                      <p className="text-sm text-blue-700 mb-3">OTP: {wheel.collectionOTP}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateOTP();
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Generate New OTP
                      </button>
                    </div>
                  )}

                  {wheel.isCollected && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-900 font-semibold">Prize Collected</span>
                    </div>
                  )}

                  {/* Expiry */}
                  <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires: {new Date(wheel.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="font-semibold mb-2">Shop ₹{campaign.luckyWheelThreshold}+</h3>
              <p className="text-gray-600 text-sm">Shop for ₹{campaign.luckyWheelThreshold} or more in a single order</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="font-semibold mb-2">Get Delivered</h3>
              <p className="text-gray-600 text-sm">After successful delivery, unlock your lucky wheel spin</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎰</span>
              </div>
              <h3 className="font-semibold mb-2">Spin & Win</h3>
              <p className="text-gray-600 text-sm">Spin the wheel to win exciting prizes and grand rewards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Modal */}
      {showClaimModal && selectedWheel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Claim Your Prize</h3>
            
            <div className="mb-4 p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                {selectedWheel.prizeId.image && (
                  <img src={selectedWheel.prizeId.image} alt={selectedWheel.prizeId.name} className="w-16 h-16 object-contain" />
                )}
                <div>
                  <h4 className="font-semibold">{selectedWheel.prizeId.name}</h4>
                  {selectedWheel.prizeId.isGrandPrize && (
                    <span className="text-yellow-600 text-sm">🏆 Grand Prize</span>
                  )}
                </div>
              </div>
            </div>

            {selectedWheel.prizeId.type === 'coupon' ? (
              <div className="mb-4">
                <p className="text-gray-600 mb-2">Your coupon will be credited automatically:</p>
                <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg font-semibold text-center">
                  {selectedWheel.prizeId.couponCode} - ₹{selectedWheel.prizeId.couponValue} OFF
                </div>
                <p className="text-sm text-gray-500 mt-2">Valid for {selectedWheel.prizeId.couponExpiryDays} days</p>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Pickup Store</label>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a store...</option>
                  <option value="store1">Mahir & Friends - Delhi</option>
                  <option value="store2">Mahir & Friends - Mumbai</option>
                  <option value="store3">Mahir & Friends - Bangalore</option>
                  <option value="store4">Mahir & Friends - Jaipur</option>
                </select>
                <div className="flex items-start gap-2 mt-3 text-sm text-gray-600">
                  <p>Bring your ID and order confirmation for verification. You'll receive an OTP at pickup.</p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowClaimModal(false);
                  setSelectedStore('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClaimPrize}
                disabled={claiming || (selectedWheel.prizeId.type !== 'coupon' && !selectedStore)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
              >
                {claiming ? 'Claiming...' : 'Claim Prize'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Prize Claimed Successfully!</p>
            <p className="text-sm">Check your email for details.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LuckyWheelPage;
