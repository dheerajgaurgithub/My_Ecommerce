import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { CartProvider } from './lib/cart';
import { ThemeProvider } from './lib/theme';
import { ToastProvider } from './lib/toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

// Code split routes for better performance
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })));
const ProductPage = lazy(() => import('./pages/ProductPage').then(m => ({ default: m.ProductPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const HelpPage = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then(m => ({ default: m.TrackOrderPage })));
const ReturnsPage = lazy(() => import('./pages/ReturnsPage').then(m => ({ default: m.ReturnsPage })));
const ShippingPage = lazy(() => import('./pages/ShippingPage').then(m => ({ default: m.ShippingPage })));
const SizeGuidePage = lazy(() => import('./pages/SizeGuidePage').then(m => ({ default: m.SizeGuidePage })));
const FAQPage = lazy(() => import('./pages/FAQPage').then(m => ({ default: m.FAQPage })));
const FounderPage = lazy(() => import('./pages/FounderPage').then(m => ({ default: m.FounderPage })));
const DeliveryPartnerPage = lazy(() => import('./pages/DeliveryPartnerPage').then(m => ({ default: m.DeliveryPartnerPage })));
const DeliveryPartnerRegisterPage = lazy(() => import('./pages/DeliveryPartnerRegisterPage').then(m => ({ default: m.DeliveryPartnerRegisterPage })));
const DeliveryPartnerLoginPage = lazy(() => import('./pages/DeliveryPartnerLoginPage').then(m => ({ default: m.DeliveryPartnerLoginPage })));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage').then(m => ({ default: m.GoogleCallbackPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const MegaDealAdminPage = lazy(() => import('./pages/MegaDealAdminPage').then(m => ({ default: m.MegaDealAdminPage })));
const MegaDealPage = lazy(() => import('./pages/MegaDealPage').then(m => ({ default: m.MegaDealPage })));
const MyRewardsPage = lazy(() => import('./pages/MyRewardsPage').then(m => ({ default: m.MyRewardsPage })));
const LuckyWheelPage = lazy(() => import('./pages/LuckyWheelPage').then(m => ({ default: m.LuckyWheelPage })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  const location = useLocation();

  if (isAdmin) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {children}
    </div>
  );
}

function DeliveryPartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                <Route path="/admin/login" element={
                  <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                    <AdminLoginPage />
                  </Suspense>
                } />
                <Route path="/admin/*" element={
                  <AdminLayout>
                    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                      <Routes>
                        <Route path="/" element={<AdminPage />} />
                        <Route path="/mega-deal" element={<MegaDealAdminPage />} />
                      </Routes>
                    </Suspense>
                  </AdminLayout>
                } />
                <Route path="/delivery-partner/login" element={<DeliveryPartnerLoginPage />} />
                <Route path="/delivery-partner/*" element={
                  <DeliveryPartnerLayout>
                    <Routes>
                      <Route path="/" element={<DeliveryPartnerPage />} />
                      <Route path="/register" element={<DeliveryPartnerRegisterPage />} />
                    </Routes>
                  </DeliveryPartnerLayout>
                } />
                <Route path="/*" element={
                  <AdminRouteGuard>
                    <StoreLayout>
                      <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/shop" element={<ShopPage />} />
                          <Route path="/product/:slug" element={<ProductPage />} />
                          <Route path="/cart" element={<CartPage />} />
                          <Route path="/checkout" element={<CheckoutPage />} />
                          <Route path="/login" element={<AuthPage mode="login" />} />
                          <Route path="/signup" element={<AuthPage mode="signup" />} />
                          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
                          <Route path="/account" element={<AccountPage />} />
                          <Route path="/account/orders" element={<AccountPage />} />
                          <Route path="/account/addresses" element={<AccountPage />} />
                          <Route path="/wishlist" element={<WishlistPage />} />
                          <Route path="/help" element={<HelpPage />} />
                          <Route path="/track-order" element={<TrackOrderPage />} />
                          <Route path="/returns" element={<ReturnsPage />} />
                          <Route path="/shipping" element={<ShippingPage />} />
                          <Route path="/size-guide" element={<SizeGuidePage />} />
                          <Route path="/faq" element={<FAQPage />} />
                          <Route path="/founder" element={<FounderPage />} />
                          <Route path="/mega-deal" element={<MegaDealPage />} />
                          <Route path="/rewards" element={<MyRewardsPage />} />
                          <Route path="/lucky-wheel" element={<LuckyWheelPage />} />
                        </Routes>
                      </Suspense>
                    </StoreLayout>
                  </AdminRouteGuard>
                } />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}
