import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Gift, Settings, Users, TrendingUp, Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
  tagline: string;
  description: string;
  bannerImage: string;
  minimumPurchaseAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  enableLuckyWheel: boolean;
  luckyWheelThreshold: number;
  enableReferralBonus: boolean;
  referralBonusAmount: number;
  showLiveWinners: boolean;
  enableDailyFlashPrizes: boolean;
  dailyFlashTime: string;
}

interface Prize {
  _id: string;
  campaignId: string;
  name: string;
  description: string;
  image: string;
  type: 'coupon' | 'physical' | 'better_luck';
  couponValue: number;
  couponCode: string;
  couponExpiryDays: number;
  inventory: number;
  used: number;
  probability: number;
  isGrandPrize: boolean;
  requiresVerification: boolean;
  requiresStorePickup: boolean;
  isDailyFlash: boolean;
  dailyFlashQuantity: number;
  dailyFlashUsed: number;
}

export function MegaDealAdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'prizes' | 'scratch-cards'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [loading, setLoading] = useState(false);

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    tagline: '',
    description: '',
    bannerImage: '',
    minimumPurchaseAmount: 5000,
    startDate: '',
    endDate: '',
    isActive: false,
    enableLuckyWheel: false,
    luckyWheelThreshold: 10000,
    enableReferralBonus: false,
    referralBonusAmount: 200,
    showLiveWinners: true,
    enableDailyFlashPrizes: false,
    dailyFlashTime: '20:00'
  });

  const [prizeForm, setPrizeForm] = useState({
    campaignId: '',
    name: '',
    description: '',
    image: '',
    type: 'physical' as 'coupon' | 'physical' | 'better_luck',
    couponValue: 0,
    couponCode: '',
    couponExpiryDays: 30,
    inventory: 10,
    probability: 5,
    isGrandPrize: false,
    requiresVerification: true,
    requiresStorePickup: true,
    isDailyFlash: false,
    dailyFlashQuantity: 0
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchPrizes(selectedCampaign._id);
    }
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://mahirandfriends.onrender.com/api/mega-deal/admin/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchPrizes = async (campaignId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://mahirandfriends.onrender.com/api/mega-deal/admin/campaign/${campaignId}/prizes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPrizes(data.prizes);
      }
    } catch (error) {
      console.error('Error fetching prizes:', error);
    }
  };

  const handleCreateCampaign = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://mahirandfriends.onrender.com/api/mega-deal/admin/campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(campaignForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowCampaignModal(false);
        fetchCampaigns();
        resetCampaignForm();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCampaign = async () => {
    if (!editingCampaign) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://mahirandfriends.onrender.com/api/mega-deal/admin/campaign/${editingCampaign._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(campaignForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowCampaignModal(false);
        setEditingCampaign(null);
        fetchCampaigns();
        resetCampaignForm();
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrize = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://mahirandfriends.onrender.com/api/mega-deal/admin/prize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prizeForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowPrizeModal(false);
        if (selectedCampaign) {
          fetchPrizes(selectedCampaign._id);
        }
        resetPrizeForm();
      }
    } catch (error) {
      console.error('Error creating prize:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrize = async () => {
    if (!editingPrize) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://mahirandfriends.onrender.com/api/mega-deal/admin/prize/${editingPrize._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prizeForm)
      });
      const data = await response.json();
      if (data.success) {
        setShowPrizeModal(false);
        setEditingPrize(null);
        if (selectedCampaign) {
          fetchPrizes(selectedCampaign._id);
        }
        resetPrizeForm();
      }
    } catch (error) {
      console.error('Error updating prize:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      tagline: '',
      description: '',
      bannerImage: '',
      minimumPurchaseAmount: 5000,
      startDate: '',
      endDate: '',
      isActive: false,
      enableLuckyWheel: false,
      luckyWheelThreshold: 10000,
      enableReferralBonus: false,
      referralBonusAmount: 200,
      showLiveWinners: true,
      enableDailyFlashPrizes: false,
      dailyFlashTime: '20:00'
    });
  };

  const resetPrizeForm = () => {
    setPrizeForm({
      campaignId: selectedCampaign?._id || '',
      name: '',
      description: '',
      image: '',
      type: 'physical',
      couponValue: 0,
      couponCode: '',
      couponExpiryDays: 30,
      inventory: 10,
      probability: 5,
      isGrandPrize: false,
      requiresVerification: true,
      requiresStorePickup: true,
      isDailyFlash: false,
      dailyFlashQuantity: 0
    });
  };

  const openCampaignModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setCampaignForm({
        name: campaign.name,
        tagline: campaign.tagline,
        description: campaign.description,
        bannerImage: campaign.bannerImage,
        minimumPurchaseAmount: campaign.minimumPurchaseAmount,
        startDate: campaign.startDate.split('T')[0],
        endDate: campaign.endDate.split('T')[0],
        isActive: campaign.isActive,
        enableLuckyWheel: campaign.enableLuckyWheel,
        luckyWheelThreshold: campaign.luckyWheelThreshold,
        enableReferralBonus: campaign.enableReferralBonus,
        referralBonusAmount: campaign.referralBonusAmount,
        showLiveWinners: campaign.showLiveWinners,
        enableDailyFlashPrizes: campaign.enableDailyFlashPrizes,
        dailyFlashTime: campaign.dailyFlashTime
      });
    } else {
      setEditingCampaign(null);
      resetCampaignForm();
    }
    setShowCampaignModal(true);
  };

  const openPrizeModal = (prize?: Prize) => {
    if (prize) {
      setEditingPrize(prize);
      setPrizeForm({
        campaignId: prize.campaignId,
        name: prize.name,
        description: prize.description,
        image: prize.image,
        type: prize.type,
        couponValue: prize.couponValue,
        couponCode: prize.couponCode,
        couponExpiryDays: prize.couponExpiryDays,
        inventory: prize.inventory,
        probability: prize.probability,
        isGrandPrize: prize.isGrandPrize,
        requiresVerification: prize.requiresVerification,
        requiresStorePickup: prize.requiresStorePickup,
        isDailyFlash: prize.isDailyFlash,
        dailyFlashQuantity: prize.dailyFlashQuantity
      });
    } else {
      setEditingPrize(null);
      resetPrizeForm();
    }
    setShowPrizeModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mega Deal Campaign Management</h1>
            <p className="text-gray-600 mt-1">Manage scratch card campaigns, prizes, and winners</p>
          </div>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Back to Admin
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'campaigns'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Campaigns
            </div>
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'prizes'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Prizes
            </div>
          </button>
          <button
            onClick={() => setActiveTab('scratch-cards')}
            className={`px-4 py-3 font-medium transition ${
              activeTab === 'scratch-cards'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Scratch Cards
            </div>
          </button>
        </div>

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Campaigns</h2>
              <button
                onClick={() => openCampaignModal()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Plus className="w-4 h-4" />
                Create Campaign
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No campaigns created yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition cursor-pointer"
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              campaign.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {campaign.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{campaign.tagline}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>Min: ₹{campaign.minimumPurchaseAmount}</span>
                          <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCampaignModal(campaign);
                          }}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prizes Tab */}
        {activeTab === 'prizes' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Prizes</h2>
                {selectedCampaign && (
                  <p className="text-gray-600 text-sm mt-1">Campaign: {selectedCampaign.name}</p>
                )}
              </div>
              {selectedCampaign && (
                <button
                  onClick={() => openPrizeModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Prize
                </button>
              )}
            </div>

            {!selectedCampaign ? (
              <div className="text-center py-12 text-gray-500">
                <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a campaign to view prizes</p>
              </div>
            ) : prizes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No prizes added to this campaign</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {prizes.map((prize) => (
                  <div key={prize._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          prize.isGrandPrize
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {prize.isGrandPrize ? 'Grand Prize' : prize.type}
                      </span>
                      <button
                        onClick={() => openPrizeModal(prize)}
                        className="p-1 text-gray-600 hover:text-purple-600 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-semibold">{prize.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{prize.description}</p>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <span className="text-gray-500">
                        {prize.used}/{prize.inventory} used
                      </span>
                      <span className="text-purple-600 font-medium">
                        {prize.probability}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scratch Cards Tab */}
        {activeTab === 'scratch-cards' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">All Scratch Cards</h2>
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Scratch card management coming soon</p>
            </div>
          </div>
        )}

        {/* Campaign Modal */}
        {showCampaignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">
                    {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCampaignModal(false);
                      setEditingCampaign(null);
                      resetCampaignForm();
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Mahir & Friends Mega Deal Festival 2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={campaignForm.tagline}
                    onChange={(e) => setCampaignForm({ ...campaignForm, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Shop More. Scratch More. Win More."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Campaign description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    value={campaignForm.bannerImage}
                    onChange={(e) => setCampaignForm({ ...campaignForm, bannerImage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Purchase (₹)</label>
                    <input
                      type="number"
                      value={campaignForm.minimumPurchaseAmount}
                      onChange={(e) => setCampaignForm({ ...campaignForm, minimumPurchaseAmount: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daily Flash Time</label>
                    <input
                      type="time"
                      value={campaignForm.dailyFlashTime}
                      onChange={(e) => setCampaignForm({ ...campaignForm, dailyFlashTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={campaignForm.startDate}
                      onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={campaignForm.endDate}
                      onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Active Campaign</label>
                    <input
                      type="checkbox"
                      checked={campaignForm.isActive}
                      onChange={(e) => setCampaignForm({ ...campaignForm, isActive: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Lucky Wheel</label>
                    <input
                      type="checkbox"
                      checked={campaignForm.enableLuckyWheel}
                      onChange={(e) => setCampaignForm({ ...campaignForm, enableLuckyWheel: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  {campaignForm.enableLuckyWheel && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lucky Wheel Threshold (₹)</label>
                      <input
                        type="number"
                        value={campaignForm.luckyWheelThreshold}
                        onChange={(e) => setCampaignForm({ ...campaignForm, luckyWheelThreshold: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Referral Bonus</label>
                    <input
                      type="checkbox"
                      checked={campaignForm.enableReferralBonus}
                      onChange={(e) => setCampaignForm({ ...campaignForm, enableReferralBonus: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  {campaignForm.enableReferralBonus && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referral Bonus Amount (₹)</label>
                      <input
                        type="number"
                        value={campaignForm.referralBonusAmount}
                        onChange={(e) => setCampaignForm({ ...campaignForm, referralBonusAmount: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Show Live Winners</label>
                    <input
                      type="checkbox"
                      checked={campaignForm.showLiveWinners}
                      onChange={(e) => setCampaignForm({ ...campaignForm, showLiveWinners: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Enable Daily Flash Prizes</label>
                    <input
                      type="checkbox"
                      checked={campaignForm.enableDailyFlashPrizes}
                      onChange={(e) => setCampaignForm({ ...campaignForm, enableDailyFlashPrizes: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCampaignModal(false);
                    setEditingCampaign(null);
                    resetCampaignForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : editingCampaign ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prize Modal */}
        {showPrizeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">
                    {editingPrize ? 'Edit Prize' : 'Add Prize'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowPrizeModal(false);
                      setEditingPrize(null);
                      resetPrizeForm();
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prize Name</label>
                  <input
                    type="text"
                    value={prizeForm.name}
                    onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Smart Watch"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={prizeForm.description}
                    onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={2}
                    placeholder="Prize description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={prizeForm.image}
                    onChange={(e) => setPrizeForm({ ...prizeForm, image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com/prize.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prize Type</label>
                  <select
                    value={prizeForm.type}
                    onChange={(e) => setPrizeForm({ ...prizeForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="physical">Physical Prize</option>
                    <option value="coupon">Coupon</option>
                    <option value="better_luck">Better Luck Next Time</option>
                  </select>
                </div>

                {prizeForm.type === 'coupon' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Value (₹)</label>
                      <input
                        type="number"
                        value={prizeForm.couponValue}
                        onChange={(e) => setPrizeForm({ ...prizeForm, couponValue: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                      <input
                        type="text"
                        value={prizeForm.couponCode}
                        onChange={(e) => setPrizeForm({ ...prizeForm, couponCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="MEGADEAL100"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inventory</label>
                    <input
                      type="number"
                      value={prizeForm.inventory}
                      onChange={(e) => setPrizeForm({ ...prizeForm, inventory: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Probability (%)</label>
                    <input
                      type="number"
                      value={prizeForm.probability}
                      onChange={(e) => setPrizeForm({ ...prizeForm, probability: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Grand Prize</label>
                    <input
                      type="checkbox"
                      checked={prizeForm.isGrandPrize}
                      onChange={(e) => setPrizeForm({ ...prizeForm, isGrandPrize: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Requires Verification</label>
                    <input
                      type="checkbox"
                      checked={prizeForm.requiresVerification}
                      onChange={(e) => setPrizeForm({ ...prizeForm, requiresVerification: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Requires Store Pickup</label>
                    <input
                      type="checkbox"
                      checked={prizeForm.requiresStorePickup}
                      onChange={(e) => setPrizeForm({ ...prizeForm, requiresStorePickup: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Daily Flash Prize</label>
                    <input
                      type="checkbox"
                      checked={prizeForm.isDailyFlash}
                      onChange={(e) => setPrizeForm({ ...prizeForm, isDailyFlash: e.target.checked })}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </div>

                  {prizeForm.isDailyFlash && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Daily Flash Quantity</label>
                      <input
                        type="number"
                        value={prizeForm.dailyFlashQuantity}
                        onChange={(e) => setPrizeForm({ ...prizeForm, dailyFlashQuantity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPrizeModal(false);
                    setEditingPrize(null);
                    resetPrizeForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={editingPrize ? handleUpdatePrize : handleCreatePrize}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : editingPrize ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
