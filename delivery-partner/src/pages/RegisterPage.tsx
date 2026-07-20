import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Car, Camera, ArrowLeft, ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { api } from '../lib/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  const [nearestStore, setNearestStore] = useState<any>(null);
  const [availableServiceAreas, setAvailableServiceAreas] = useState<any[]>([]);
  const [checkingLocation, setCheckingLocation] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      setCheckingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setLocationPermission('granted');
          checkServiceAvailability(latitude, longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationPermission('denied');
          setCheckingLocation(false);
          showToast('Location access denied. Please enable location to check service availability.', 'error');
        }
      );
    } else {
      setLocationPermission('denied');
      setCheckingLocation(false);
      showToast('Geolocation is not supported by your browser', 'error');
    }
  };

  const checkServiceAvailability = async (lat: number, lng: number) => {
    try {
      const response = await api.get<{ 
        success: boolean; 
        store?: any; 
        distance?: number;
        serviceRadius?: number;
        availableServiceAreas?: any[];
        availableStores?: any[];
      }>(`/stores/nearest?lat=${lat}&lng=${lng}`);
      if (response.success && response.store) {
        setNearestStore(response.store);
        setServiceAvailable(true);
        setAvailableServiceAreas(response.availableStores || []);
      } else {
        setServiceAvailable(false);
        setAvailableServiceAreas(response.availableServiceAreas || []);
      }
    } catch (error) {
      console.error('Error checking service availability:', error);
      setServiceAvailable(false);
    } finally {
      setCheckingLocation(false);
    }
  };

  const [formData, setFormData] = useState({
    password: '',
    personalDetails: {
      fullName: '',
      contactNumber: '',
      email: '',
      dateOfBirth: '',
      gender: ''
    },
    vehicleDetails: {
      vehicleType: '',
      vehicleNumber: '',
      vehicleModel: '',
      vehicleColor: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    },
    kycDetails: {
      aadharNumber: '',
      panNumber: '',
      selfie: ''
    },
    bankDetails: {
      accountNumber: '',
      accountHolderName: '',
      ifscCode: '',
      bankName: ''
    }
  });

  const handleInputChange = (section: string, field: string, value: string) => {
    if (section === 'password') {
      setFormData(prev => ({ ...prev, password: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as any),
          [field]: value
        }
      }));
    }
  };

  const handleImageUpload = (section: string, field: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleInputChange(section, field, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!serviceAvailable) {
      showToast('Service is not available in your area. Registration not allowed.', 'error');
      return;
    }
    
    setLoading(true);
    const { error } = await signUp({
      ...formData,
      address: {
        ...formData.address,
        coordinates: currentLocation
      }
    });
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Registration submitted successfully! Please wait for admin approval.', 'success');
      navigate('/login');
    }
    setLoading(false);
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Service Availability Banner */}
        {checkingLocation && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Checking service availability in your area...</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Please allow location access</p>
            </div>
          </div>
        )}

        {locationPermission === 'denied' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">Location access required</p>
              <p className="text-sm text-red-700 dark:text-red-300">Please enable location to check service availability</p>
              <button
                onClick={requestLocationPermission}
                className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                Enable Location
              </button>
            </div>
          </div>
        )}

        {serviceAvailable === true && nearestStore && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">Service available in your area!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Nearest pickup store: {nearestStore.name} ({nearestStore.address?.city}, {nearestStore.address?.state})
              </p>
            </div>
          </div>
        )}

        {serviceAvailable === false && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Service not available in your area</p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  We're not currently serving your location. We'll let you know when we expand!
                </p>
              </div>
            </div>
            {availableServiceAreas.length > 0 && (
              <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  Available service areas:
                </p>
                <div className="space-y-2">
                  {availableServiceAreas.map((area, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {area.city}, {area.state}
                        {area.district && ` (${area.district} district)`}
                        {area.serviceRadius && ` - within ${area.serviceRadius}km radius`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold mb-2">Become a Delivery Partner</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Join our delivery network and start earning
          </p>
        </div>

        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step >= s
                    ? 'bg-brand-600 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step > s ? 'bg-brand-600' : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6 shadow-sm">
          {step === 1 && <PersonalDetailsStep formData={formData} onChange={handleInputChange} />}
          {step === 2 && <VehicleDetailsStep formData={formData} onChange={handleInputChange} />}
          {step === 3 && <AddressStep formData={formData} onChange={handleInputChange} />}
          {step === 4 && <KYCDetailsStep formData={formData} onChange={handleInputChange} onImageUpload={handleImageUpload} />}

          <div className="flex justify-between mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>
            {step === 4 ? (
              <button
                onClick={handleSubmit}
                disabled={loading || !serviceAvailable}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : serviceAvailable === false ? 'Service Not Available' : 'Submit Application'}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white hover:bg-brand-700"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalDetailsStep({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Personal Details</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={formData.personalDetails.fullName}
              onChange={(e) => onChange('personalDetails', 'fullName', e.target.value)}
              className="input pl-12"
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Contact Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="tel"
              value={formData.personalDetails.contactNumber}
              onChange={(e) => onChange('personalDetails', 'contactNumber', e.target.value)}
              className="input pl-12"
              placeholder="Enter your contact number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="email"
              value={formData.personalDetails.email}
              onChange={(e) => onChange('personalDetails', 'email', e.target.value)}
              className="input pl-12"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => onChange('password', 'password', e.target.value)}
            className="input"
            placeholder="Create a password for login"
            minLength={6}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date of Birth</label>
            <input
              type="date"
              value={formData.personalDetails.dateOfBirth}
              onChange={(e) => onChange('personalDetails', 'dateOfBirth', e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <select
              value={formData.personalDetails.gender}
              onChange={(e) => onChange('personalDetails', 'gender', e.target.value)}
              className="input"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleDetailsStep({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Vehicle Details</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Vehicle Type</label>
          <div className="relative">
            <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <select
              value={formData.vehicleDetails.vehicleType}
              onChange={(e) => onChange('vehicleDetails', 'vehicleType', e.target.value)}
              className="input pl-12"
            >
              <option value="">Select Vehicle Type</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="car">Car</option>
              <option value="van">Van</option>
              <option value="bicycle">Bicycle</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Vehicle Number</label>
          <input
            type="text"
            value={formData.vehicleDetails.vehicleNumber}
            onChange={(e) => onChange('vehicleDetails', 'vehicleNumber', e.target.value)}
            className="input"
            placeholder="e.g., MH 12 AB 1234"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Vehicle Model</label>
            <input
              type="text"
              value={formData.vehicleDetails.vehicleModel}
              onChange={(e) => onChange('vehicleDetails', 'vehicleModel', e.target.value)}
              className="input"
              placeholder="e.g., Honda Activa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Vehicle Color</label>
            <input
              type="text"
              value={formData.vehicleDetails.vehicleColor}
              onChange={(e) => onChange('vehicleDetails', 'vehicleColor', e.target.value)}
              className="input"
              placeholder="e.g., Red"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AddressStep({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Address Details</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Street Address</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <textarea
              value={formData.address.street}
              onChange={(e) => onChange('address', 'street', e.target.value)}
              className="input pl-12 min-h-[100px]"
              placeholder="Enter your street address"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">City</label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => onChange('address', 'city', e.target.value)}
              className="input"
              placeholder="Enter city"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">State</label>
            <input
              type="text"
              value={formData.address.state}
              onChange={(e) => onChange('address', 'state', e.target.value)}
              className="input"
              placeholder="Enter state"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pincode</label>
            <input
              type="text"
              value={formData.address.pincode}
              onChange={(e) => onChange('address', 'pincode', e.target.value)}
              className="input"
              placeholder="Enter pincode"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Landmark (Optional)</label>
            <input
              type="text"
              value={formData.address.landmark}
              onChange={(e) => onChange('address', 'landmark', e.target.value)}
              className="input"
              placeholder="Nearby landmark"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function KYCDetailsStep({ formData, onChange, onImageUpload }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">KYC Details</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Aadhar Number</label>
          <input
            type="text"
            value={formData.kycDetails.aadharNumber}
            onChange={(e) => onChange('kycDetails', 'aadharNumber', e.target.value)}
            className="input"
            placeholder="Enter 12-digit Aadhar number"
            maxLength={12}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">PAN Number</label>
          <input
            type="text"
            value={formData.kycDetails.panNumber}
            onChange={(e) => onChange('kycDetails', 'panNumber', e.target.value)}
            className="input"
            placeholder="Enter PAN number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Selfie</label>
          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-6 text-center">
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e) => e.target.files?.[0] && onImageUpload('kycDetails', 'selfie', e.target.files[0])}
              className="hidden"
              id="selfie"
            />
            <label htmlFor="selfie" className="cursor-pointer">
              <Camera className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Take a selfie or upload photo
              </p>
              {formData.kycDetails.selfie && (
                <p className="text-xs text-green-600 mt-2">Selfie uploaded</p>
              )}
            </label>
          </div>
        </div>

        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Bank details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Account Number</label>
              <input
                type="text"
                value={formData.bankDetails.accountNumber}
                onChange={(e) => onChange('bankDetails', 'accountNumber', e.target.value)}
                className="input"
                placeholder="Enter account number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Account Holder Name</label>
              <input
                type="text"
                value={formData.bankDetails.accountHolderName}
                onChange={(e) => onChange('bankDetails', 'accountHolderName', e.target.value)}
                className="input"
                placeholder="Name as per bank account"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">IFSC Code</label>
                <input
                  type="text"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) => onChange('bankDetails', 'ifscCode', e.target.value)}
                  className="input"
                  placeholder="Enter IFSC code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankDetails.bankName}
                  onChange={(e) => onChange('bankDetails', 'bankName', e.target.value)}
                  className="input"
                  placeholder="Enter bank name"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
