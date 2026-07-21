import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [phone, setPhone] = useState('');
  const [locationData, setLocationData] = useState({ latitude: 0, longitude: 0, google_maps_link: '' });
  const [locationLoading, setLocationLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if user is not logged in or already has phone and location
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.phone && user.location) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationData({
            latitude,
            longitude,
            google_maps_link: `https://www.google.com/maps?q=${latitude},${longitude}`
          });
          setLocationLoading(false);
          showToast('Location captured successfully', 'success');
        },
        (error) => {
          setLocationLoading(false);
          showToast('Failed to get location. Please enable location access.', 'error');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      setLocationLoading(false);
      showToast('Geolocation is not supported by your browser', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!phone || phone.trim().length < 10) {
      showToast('Please enter a valid mobile number (at least 10 digits)', 'error');
      setLoading(false);
      return;
    }

    if (!locationData.latitude || !locationData.longitude || !locationData.google_maps_link) {
      showToast('Please capture your location to continue', 'error');
      setLoading(false);
      return;
    }

    try {
      const response = await api.put<{ success: boolean; user: any }>('/users/me', {
        phone,
        location: locationData.google_maps_link,
        latitude: locationData.latitude,
        longitude: locationData.longitude
      });

      if (response.success) {
        setUser(response.user);
        showToast('Profile updated successfully!', 'success');
        navigate('/');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-neutral-50 dark:bg-neutral-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-3xl font-bold text-neutral-900 dark:text-white">
            MAHIR <span className="text-brand-600">& FRIENDS</span>
          </Link>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">Complete your profile to continue</p>
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            Welcome, {user?.name}!
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            Please add your mobile number and location to complete your profile
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Mobile Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="Enter your mobile number"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 block">Your Location *</label>
              <div className="space-y-2">
                <button 
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                  className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
                >
                  <MapPin size={16} />
                  {locationLoading ? 'Getting Location...' : 'Get Current Location'}
                </button>
                <input 
                  className="input" 
                  placeholder="Google Maps Link *" 
                  value={locationData.google_maps_link} 
                  onChange={(e) => setLocationData({ ...locationData, google_maps_link: e.target.value })} 
                />
                {locationData.google_maps_link && (
                  <a 
                    href={locationData.google_maps_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Open in Google Maps →
                  </a>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2">
              {loading ? 'Saving...' : 'Complete Profile'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
