import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Headphones, Zap, TrendingUp, Sparkles, Award, Instagram, Package, Gift } from 'lucide-react';
import { api } from '../lib/api';
import type { Product, Category, ComboPack, GiftCard } from '../lib/types';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { StarRating } from '../components/StarRating';
import { formatPrice } from '../lib/utils';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [trending, setTrending] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const [flashSale, setFlashSale] = useState<Product[]>([]);
  const [premium, setPremium] = useState<Product[]>([]);
  const [comboPacks, setComboPacks] = useState<ComboPack[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [t, n, b, f, p, cp, gc, c] = await Promise.all([
          api.get<{ success: boolean; products: Product[] }>('/products?filter=trending&limit=8'),
          api.get<{ success: boolean; products: Product[] }>('/products?filter=new&limit=8'),
          api.get<{ success: boolean; products: Product[] }>('/products?filter=bestseller&limit=8'),
          api.get<{ success: boolean; products: Product[] }>('/products?filter=flash-sale&limit=4'),
          api.get<{ success: boolean; products: Product[] }>('/products?filter=premium&limit=4'),
          api.get<{ success: boolean; combos: ComboPack[] }>('/combos'),
          api.get<{ success: boolean; giftCards: GiftCard[] }>('/gift-cards'),
          api.get<{ success: boolean; categories: Category[] }>('/categories'),
        ]);
        setTrending(t.products ?? []);
        setNewArrivals(n.products ?? []);
        setBestsellers(b.products ?? []);
        setFlashSale(f.products ?? []);
        setPremium(p.products ?? []);
        setComboPacks(cp.combos ?? []);
        setGiftCards(gc.giftCards ?? []);
        setCategories(c.categories ?? []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addToCartCombo = async (combo: ComboPack) => {
    if (!user) {
      showToast('Please login to add items to cart', 'info');
      navigate('/login?redirect=/');
      return;
    }
    if (combo.product_ids.length === 0) {
      showToast('This combo has no products', 'error');
      return;
    }
    try {
      const response = await api.post<{ success: boolean; products: Product[] }>('/products', {
        ids: combo.product_ids
      });
      const products = response.products ?? [];
      for (const product of products) {
        await api.post('/cart', {
          product_id: product._id,
          quantity: 1,
          size: product.sizes?.[0] ?? null,
          color: product.colors?.[0] ?? null,
        });
      }
      showToast(`${combo.name} added to cart!`, 'success');
    } catch (error) {
      showToast('Failed to add combo to cart', 'error');
    }
  };

  const heroSlides = [
    {
      title: 'Premium Winter Collection',
      subtitle: 'Luxury meets warmth',
      cta: 'Shop Winter',
      link: '/shop?category=winter-collection',
      image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=1600',
    },
    {
      title: 'Summer Essentials',
      subtitle: 'Light, breezy, stylish',
      cta: 'Shop Summer',
      link: '/shop?category=summer-collection',
      image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=1600',
    },
    {
      title: 'Festive Collection 2026',
      subtitle: 'Celebrate in style',
      cta: 'Shop Festive',
      link: '/shop?category=festive-collection',
      image: 'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=1600',
    },
  ];

  const featuredCategories = categories.filter((c) => c.is_featured).slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <section className="relative h-[500px] sm:h-[600px] overflow-hidden">
        {heroSlides.map((slide, idx) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === heroSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full">
                <div className="max-w-xl">
                  <p className="text-accent-400 font-medium text-sm sm:text-base mb-2 tracking-wider uppercase animate-fade-in">{slide.subtitle}</p>
                  <h1 className="font-serif text-4xl sm:text-6xl font-bold text-white mb-6 animate-slide-up">{slide.title}</h1>
                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-lg font-medium hover:bg-accent-400 hover:text-white transition-all duration-300 group"
                  >
                    {slide.cta} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {heroSlides.map((slide, idx) => (
            <button
              key={slide.title}
              onClick={() => setHeroSlide(idx)}
              className={`h-2 rounded-full transition-all ${idx === heroSlide ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: 'Free Delivery', desc: 'In Aligarh & over Rs 999' },
            { icon: Shield, title: 'Secure Payment', desc: '100% protected' },
            { icon: RefreshCw, title: 'Easy Returns', desc: '7-day return policy' },
            { icon: Headphones, title: '24/7 Support', desc: 'Dedicated assistance' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                <item.icon size={20} className="text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item.title}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Shop by Category</h2>
          <Link to="/shop" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {featuredCategories.map((cat, index) => (
            <Link key={`cat-${cat._id || cat.slug}-${index}`} to={`/shop?category=${cat.slug}`} className="group">
              <div className="aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-2 relative">
                {cat.image_url && (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <p className="absolute bottom-3 left-3 text-white font-medium text-sm sm:text-base">{cat.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Flash Sale */}
      {flashSale.length > 0 && (
        <section className="bg-gradient-to-r from-accent-50 to-brand-50 dark:from-neutral-800 dark:to-neutral-800 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap className="text-accent-500" size={28} />
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Flash Sale</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Limited time deals - grab them fast!</p>
                </div>
              </div>
              <Link to="/shop?filter=flash-sale" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : flashSale.map((p, index) => <ProductCard key={`flash-${p._id || p.id}-${index}`} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Combo Packs */}
      {comboPacks.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Package className="text-brand-600" size={24} />
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Combo Packs</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {comboPacks.map((combo, index) => {
              const savings = combo.compare_at_price ? combo.compare_at_price - combo.price : 0;
              return (
                <div key={`combo-${combo._id || combo.id}-${index}`} className="card overflow-hidden group hover:shadow-lg transition-all">
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                    {combo.image_url && <img src={combo.image_url} alt={combo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    <span className="absolute top-2 left-2 bg-brand-600 text-white text-xs font-semibold px-2 py-1 rounded">COMBO</span>
                    {savings > 0 && <span className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">Save Rs {savings}</span>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-neutral-900 dark:text-white">{combo.name}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{combo.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-lg font-bold text-neutral-900 dark:text-white">{formatPrice(combo.price)}</span>
                      {combo.compare_at_price && <span className="text-sm text-neutral-400 line-through">{formatPrice(combo.compare_at_price)}</span>}
                    </div>
                    <button
                      onClick={() => { addToCartCombo(combo); }}
                      className="w-full btn-primary mt-3 text-sm"
                    >
                      Add Combo to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Gift Cards */}
      {giftCards.length > 0 && (
        <section className="bg-gradient-to-br from-neutral-900 to-neutral-800 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-6">
              <Gift className="text-accent-400 mx-auto mb-2" size={28} />
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">Gift Cards</h2>
              <p className="text-sm text-neutral-400 mt-1">The perfect gift for every occasion</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {giftCards.map((card, index) => (
                <div key={`gift-${card._id || card.id}-${index}`} className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-5 text-center hover:scale-105 transition-transform cursor-pointer">
                  <p className="text-white/80 text-xs uppercase tracking-wide">BAGWATI & SONS</p>
                  <p className="text-3xl font-bold text-white mt-2">{formatPrice(card.denomination)}</p>
                  <p className="text-white/70 text-xs mt-1">{card.description}</p>
                  <p className="text-white text-sm mt-3 font-medium">Buy for {formatPrice(card.price)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-brand-600" size={24} />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Trending Now</h2>
          </div>
          <Link to="/shop?filter=trending" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : trending.map((p, index) => <ProductCard key={`trending-${p._id || p.id}-${index}`} product={p} />)}
        </div>
      </section>

      {/* Banner */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative h-48 rounded-2xl overflow-hidden group">
            <img src="https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Men" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-8">
              <h3 className="font-serif text-2xl font-bold text-white mb-1">Men's Collection</h3>
              <p className="text-white/80 text-sm mb-3">Up to 50% off</p>
              <Link to="/shop?category=men" className="inline-flex items-center gap-1 text-white text-sm font-medium w-fit border-b border-white pb-0.5 hover:gap-2 transition-all">
                Shop Now <ArrowRight size={14} />
              </Link>
            </div>
          </div>
          <div className="relative h-48 rounded-2xl overflow-hidden group">
            <img src="https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Women" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-8">
              <h3 className="font-serif text-2xl font-bold text-white mb-1">Women's Collection</h3>
              <p className="text-white/80 text-sm mb-3">New season styles</p>
              <Link to="/shop?category=women" className="inline-flex items-center gap-1 text-white text-sm font-medium w-fit border-b border-white pb-0.5 hover:gap-2 transition-all">
                Shop Now <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-accent-500" size={24} />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">New Arrivals</h2>
          </div>
          <Link to="/shop?filter=new" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : newArrivals.map((p, index) => <ProductCard key={`new-${p._id || p.id}-${index}`} product={p} />)}
        </div>
      </section>

      {/* Premium Collection */}
      {premium.length > 0 && (
        <section className="bg-neutral-900 dark:bg-black py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Award className="text-accent-400" size={24} />
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">Premium Collection</h2>
              </div>
              <Link to="/shop?filter=premium" className="text-sm text-accent-400 hover:text-accent-300 flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {premium.map((p, index) => <ProductCard key={`premium-${p._id || p.id}-${index}`} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Award className="text-brand-600" size={24} />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Best Sellers</h2>
          </div>
          <Link to="/shop?filter=bestseller" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : bestsellers.map((p, index) => <ProductCard key={`bestseller-${p._id || p.id}-${index}`} product={p} />)}
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="bg-neutral-50 dark:bg-neutral-800 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white text-center mb-8">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', location: 'Aligarh', review: 'The quality is exceptional! My order arrived within 24 hours in Aligarh. The fabric feels premium and the fit is perfect.', rating: 5 },
              { name: 'Rahul Verma', location: 'Delhi', review: 'MAHIR & FRIENDS has become my go-to for clothing. The designs are unique and the prices are very reasonable for the quality.', rating: 5 },
              { name: 'Anjali Gupta', location: 'Lucknow', review: 'Amazing customer service and fast delivery. The winter collection is absolutely stunning. Highly recommend!', rating: 4 },
            ].map((review) => (
              <div key={review.name} className="card p-6">
                <StarRating rating={review.rating} size={18} />
                <p className="text-neutral-700 dark:text-neutral-300 mt-3 text-sm leading-relaxed">"{review.review}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center font-medium text-brand-700 dark:text-brand-300">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{review.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{review.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">@mahirandfriends</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Follow us on Instagram for style inspiration</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=300',
            'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=300',
            'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=300',
            'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300',
            'https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=300',
            'https://images.pexels.com/photos/904350/pexels-photo-904350.jpeg?auto=compress&cs=tinysrgb&w=300',
          ].map((img) => (
            <a key={img} href="#" className="aspect-square rounded-lg overflow-hidden group relative">
              <img src={img} alt="Instagram" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Instagram size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
