import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider } from './lib/auth';
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
const HelpPage = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then(m => ({ default: m.TrackOrderPage })));
const ReturnsPage = lazy(() => import('./pages/ReturnsPage').then(m => ({ default: m.ReturnsPage })));
const ShippingPage = lazy(() => import('./pages/ShippingPage').then(m => ({ default: m.ShippingPage })));
const SizeGuidePage = lazy(() => import('./pages/SizeGuidePage').then(m => ({ default: m.SizeGuidePage })));
const FAQPage = lazy(() => import('./pages/FAQPage').then(m => ({ default: m.FAQPage })));
const FounderPage = lazy(() => import('./pages/FounderPage'));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage').then(m => ({ default: m.GoogleCallbackPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage').then(m => ({ default: m.FeedbackPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
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
                  <Route path="/*" element={
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
                          <Route path="/onboarding" element={<OnboardingPage />} />
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
                          <Route path="/feedback" element={<FeedbackPage />} />
                          <Route path="/privacy" element={<PrivacyPolicyPage />} />
                          <Route path="/terms" element={<TermsOfServicePage />} />
                        </Routes>
                      </Suspense>
                    </StoreLayout>
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
