import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Trophy, QrCode, Calendar, Clock, CheckCircle, Copy } from 'lucide-react';

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

interface ScratchCardData {
  _id: string;
  prizeId: Prize;
  uniqueToken: string;
  isScratched: boolean;
  isClaimed: boolean;
  isCollected: boolean;
  expiresAt: string;
  qrCode: string;
  collectionOTP: string;
  createdAt: string;
  isFromReferral: boolean;
}

interface LuckyWheelData {
  _id: string;
  prizeId: Prize;
  uniqueToken: string;
  isSpun: boolean;
  isClaimed: boolean;
  isCollected: boolean;
  expiresAt: string;
  qrCode: string;
  collectionOTP: string;
  createdAt: string;
}

export function MyRewardsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'scratch-cards' | 'lucky-wheels'>('scratch-cards');
  const [scratchCards, setScratchCards] = useState<ScratchCardData[]>([]);
  const [luckyWheels, setLuckyWheels] = useState<LuckyWheelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch scratch cards
      const scratchResponse = await fetch('http://localhost:5000/api/mega-deal/scratch-cards', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const scratchData = await scratchResponse.json();
      if (scratchData.success) {
        setScratchCards(scratchData.scratchCards);
      }

      // Fetch lucky wheels
      const wheelResponse = await fetch('http://localhost:5000/api/mega-deal/lucky-wheels', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const wheelData = await wheelResponse.json();
      if (wheelData.success) {
        setLuckyWheels(wheelData.luckyWheels);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateOTP = async (type: 'scratch' | 'wheel', id: string) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'scratch' 
        ? '/api/mega-deal/scratch-card/generate-otp'
        : '/api/mega-deal/lucky-wheel/generate-otp';
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [type === 'scratch' ? 'scratchCardId' : 'luckyWheelId']: id })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('New OTP generated! Valid for 15 minutes.');
        fetchRewards();
      }
    } catch (error) {
      console.error('Error generating OTP:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Rewards</h1>
          <p className="text-gray-600">View and manage your scratch cards and lucky wheel prizes</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('scratch-cards')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'scratch-cards'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Scratch Cards
              <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                {scratchCards.length}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('lucky-wheels')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'lucky-wheels'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Lucky Wheels
              <span className="bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
                {luckyWheels.length}
              </span>
            </div>
          </button>
        </div>

        {/* Scratch Cards Tab */}
        {activeTab === 'scratch-cards' && (
          <div className="space-y-4">
            {scratchCards.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Scratch Cards Yet</h3>
                <p className="text-gray-600 mb-4">Complete eligible orders to unlock scratch cards!</p>
                <button
                  onClick={() => navigate('/shop')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              scratchCards.map((card) => (
                <div key={card._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {card.prizeId.image && (
                          <img
                            src={card.prizeId.image}
                            alt={card.prizeId.name}
                            className="w-16 h-16 object-contain rounded-lg"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{card.prizeId.name}</h3>
                            {card.prizeId.isGrandPrize && (
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">
                                🏆 GRAND PRIZE
                              </span>
                            )}
                            {card.isFromReferral && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                REFERRAL BONUS
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{card.prizeId.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {card.isScratched ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                        {card.isClaimed && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        card.isScratched ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {card.isScratched ? 'Scratched' : 'Not Scratched'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        card.isClaimed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {card.isClaimed ? 'Claimed' : 'Not Claimed'}
                      </span>
                      {card.isCollected && (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                          Collected
                        </span>
                      )}
                    </div>

                    {/* Coupon Details */}
                    {card.isClaimed && card.prizeId.type === 'coupon' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 mb-1">Your Coupon Code:</p>
                            <div className="flex items-center gap-2">
                              <code className="text-lg font-bold text-green-800">{card.prizeId.couponCode}</code>
                              <button
                                onClick={() => copyToClipboard(card.prizeId.couponCode)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            {copiedCode === card.prizeId.couponCode && (
                              <span className="text-xs text-green-600">Copied!</span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-700">₹{card.prizeId.couponValue}</p>
                            <p className="text-xs text-green-600">Valid for {card.prizeId.couponExpiryDays} days</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pickup Details */}
                    {card.isClaimed && card.prizeId.type === 'physical' && !card.isCollected && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <QrCode className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Pickup Details</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-blue-600 mb-1">QR Code:</p>
                            <p className="font-mono text-blue-900">{card.qrCode}</p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-600 mb-1">OTP:</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-blue-900">{card.collectionOTP}</p>
                              <button
                                onClick={() => generateOTP('scratch', card._id)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Generate New
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expiry */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Expires: {new Date(card.expiresAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Received: {new Date(card.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Lucky Wheels Tab */}
        {activeTab === 'lucky-wheels' && (
          <div className="space-y-4">
            {luckyWheels.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Lucky Wheels Yet</h3>
                <p className="text-gray-600 mb-4">Shop for ₹10,000+ to unlock a lucky wheel spin!</p>
                <button
                  onClick={() => navigate('/shop')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              luckyWheels.map((wheel) => (
                <div key={wheel._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {wheel.prizeId.image && (
                          <img
                            src={wheel.prizeId.image}
                            alt={wheel.prizeId.name}
                            className="w-16 h-16 object-contain rounded-lg"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{wheel.prizeId.name}</h3>
                            {wheel.prizeId.isGrandPrize && (
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">
                                🏆 GRAND PRIZE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{wheel.prizeId.description}</p>
                        </div>
                      </div>
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

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        wheel.isSpun ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {wheel.isSpun ? 'Spun' : 'Not Spun'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        wheel.isClaimed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {wheel.isClaimed ? 'Claimed' : 'Not Claimed'}
                      </span>
                      {wheel.isCollected && (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                          Collected
                        </span>
                      )}
                    </div>

                    {/* Coupon Details */}
                    {wheel.isClaimed && wheel.prizeId.type === 'coupon' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 mb-1">Your Coupon Code:</p>
                            <div className="flex items-center gap-2">
                              <code className="text-lg font-bold text-green-800">{wheel.prizeId.couponCode}</code>
                              <button
                                onClick={() => copyToClipboard(wheel.prizeId.couponCode)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            {copiedCode === wheel.prizeId.couponCode && (
                              <span className="text-xs text-green-600">Copied!</span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-700">₹{wheel.prizeId.couponValue}</p>
                            <p className="text-xs text-green-600">Valid for {wheel.prizeId.couponExpiryDays} days</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pickup Details */}
                    {wheel.isClaimed && wheel.prizeId.type === 'physical' && !wheel.isCollected && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <QrCode className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Pickup Details</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-blue-600 mb-1">QR Code:</p>
                            <p className="font-mono text-blue-900">{wheel.qrCode}</p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-600 mb-1">OTP:</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-blue-900">{wheel.collectionOTP}</p>
                              <button
                                onClick={() => generateOTP('wheel', wheel._id)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Generate New
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expiry */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Expires: {new Date(wheel.expiresAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Received: {new Date(wheel.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyRewardsPage;
