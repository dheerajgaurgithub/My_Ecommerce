import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';

export function StoreSelectionPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  useEffect(() => {
    fetchNearbyStores();
  }, []);

  const fetchNearbyStores = async () => {
    try {
      setLoading(true);
      let stores: any[] = [];

      try {
        // Get delivery partner data to find their location
        const partnerResponse = await api.get<{ success: boolean; data: any }>('/delivery-partners/profile');
        const partner = partnerResponse.data;

        let queryParams = '';

        // Use partner's location if available
        if (partner?.address?.coordinates?.latitude && partner?.address?.coordinates?.longitude) {
          queryParams = `?lat=${partner.address.coordinates.latitude}&lng=${partner.address.coordinates.longitude}`;
        }
        // Otherwise use city/district
        else if (partner?.address?.city) {
          queryParams = `?city=${encodeURIComponent(partner.address.city)}&district=${encodeURIComponent(partner.address.state || '')}&pincode=${encodeURIComponent(partner.address.pincode || '')}`;
        }

        const response = await api.get<{ success: boolean; stores: any[]; count: number }>(`/stores/nearby${queryParams}`);

        if (response.success) {
          stores = response.stores || [];
        }
      } catch (error) {
        console.error('Error fetching nearby stores with location, falling back to all active stores:', error);
        // Fallback to getting all active stores
        const activeResponse = await api.get<{ success: boolean; stores: any[] }>('/stores/active');
        if (activeResponse.success) {
          stores = activeResponse.stores || [];
        }
      }

      setStores(stores);

      // If only one store available, auto-select it
      if (stores.length === 1) {
        await selectStore(stores[0]._id);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      showToast('Failed to load stores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectStore = async (storeId: string) => {
    try {
      setSelecting(true);
      setSelectedStore(storeId);
      
      await api.post('/delivery-partners/select-store', { storeId });
      
      showToast('Store selected successfully!', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error selecting store:', error);
      showToast('Failed to select store', 'error');
      setSelectedStore(null);
    } finally {
      setSelecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">Finding nearby stores...</p>
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No Stores Available</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            There are no stores available in your area yet. Please contact support or check back later.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Select Your Store
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Choose the store where you'll be picking up deliveries
          </p>
        </div>

        <div className="grid gap-4">
          {stores.map((store) => (
            <div
              key={store._id}
              className={`card p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedStore === store._id ? 'ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-900/20' : ''
              }`}
              onClick={() => !selecting && selectStore(store._id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                      {store.name}
                    </h3>
                    {selectedStore === store._id && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{store.fullAddress || `${store.address.street}, ${store.address.city}, ${store.address.state} - ${store.address.pincode}`}</span>
                    </div>
                    
                    {store.distance && (
                      <div className="flex items-center gap-2">
                        <span className="text-brand-600 dark:text-brand-400 font-medium">
                          {store.distance.toFixed(1)} km away
                        </span>
                      </div>
                    )}
                    
                    {store.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{store.operating_hours || '9:00 AM - 9:00 PM'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4">
                  <ArrowRight className="w-5 h-5 text-neutral-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
