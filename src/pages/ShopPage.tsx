import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, Search, Star } from 'lucide-react';
import { api } from '../lib/api';
import type { Product, Category } from '../lib/types';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const query = searchParams.get('q') ?? '';
  const categorySlug = searchParams.get('category') ?? '';
  const filter = searchParams.get('filter') ?? '';
  const sortBy = searchParams.get('sort') ?? 'featured';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const selectedGender = searchParams.get('gender') ?? '';
  const selectedColor = searchParams.get('color') ?? '';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<{ success: boolean; categories: Category[] }>('/categories');
        setCategories(response.categories ?? []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (categorySlug) params.append('category', categorySlug);
        if (filter) params.append('filter', filter);
        if (sortBy) params.append('sort', sortBy);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (selectedGender) params.append('gender', selectedGender);
        if (selectedColor) params.append('color', selectedColor);
        params.append('limit', '60');

        const response = await api.get<{ success: boolean; products: Product[] }>(`/products?${params.toString()}`);
        setProducts(response.products ?? []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [query, categorySlug, filter, sortBy, minPrice, maxPrice, selectedGender, selectedColor]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach((p) => p.colors?.forEach((c) => colors.add(c)));
    return Array.from(colors);
  }, [products]);

  const activeFilterCount = [categorySlug, filter, minPrice, maxPrice, selectedGender, selectedColor].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb / Title */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
          {categorySlug ? categories.find((c) => c.slug === categorySlug)?.name ?? 'Shop' :
           filter === 'trending' ? 'Trending Now' :
           filter === 'new' ? 'New Arrivals' :
           filter === 'bestseller' ? 'Best Sellers' :
           filter === 'flash-sale' ? 'Flash Sale' :
           filter === 'premium' ? 'Premium Collection' :
           query ? `Search: "${query}"` : 'All Products'}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {loading ? 'Loading...' : `${products.length} products found`}
        </p>
      </div>

      {/* Quick Search Bar */}
      <div className="mb-6 relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => updateParam('q', e.target.value)}
          className="input pl-12 pr-4 py-3 w-full"
        />
        {query && (
          <button
            onClick={() => updateParam('q', '')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-black/50 lg:bg-transparent lg:static lg:z-auto' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
          <div className={`${showFilters ? 'fixed left-0 top-0 bottom-0 w-80 max-w-[85%] bg-white dark:bg-neutral-900 overflow-y-auto p-6 lg:static lg:w-full lg:p-0' : ''} lg:bg-transparent`}>
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h2 className="font-semibold text-lg">Filters</h2>
              <button onClick={() => setShowFilters(false)}><X size={24} /></button>
            </div>

            <div className="space-y-6 lg:sticky lg:top-24">
              {/* Categories */}
              <div>
                <h3 className="font-medium text-sm text-neutral-900 dark:text-white mb-3">Categories</h3>
                <div className="space-y-1.5">
                  <button
                    onClick={() => updateParam('category', '')}
                    className={`block w-full text-left text-sm py-1 ${!categorySlug ? 'text-brand-600 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => updateParam('category', cat.slug)}
                      className={`block w-full text-left text-sm py-1 ${categorySlug === cat.slug ? 'text-brand-600 font-medium' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <h3 className="font-medium text-sm text-neutral-900 dark:text-white mb-3">Price Range</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => updateParam('minPrice', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => updateParam('maxPrice', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <h3 className="font-medium text-sm text-neutral-900 dark:text-white mb-3">Gender</h3>
                <div className="space-y-1.5">
                  {['male', 'female', 'unisex'].map((g) => (
                    <label key={g} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer capitalize">
                      <input
                        type="radio"
                        name="gender"
                        checked={selectedGender === g}
                        onChange={() => updateParam('gender', g)}
                        className="accent-brand-600"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              {/* Colors */}
              {allColors.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-neutral-900 dark:text-white mb-3">Colors</h3>
                  <div className="flex flex-wrap gap-2">
                    {allColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateParam('color', selectedColor === color ? '' : color)}
                        className={`w-8 h-8 rounded-full border-2 ${selectedColor === color ? 'border-brand-600 ring-2 ring-brand-200' : 'border-neutral-300 dark:border-neutral-600'}`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Rating Filter */}
              <div>
                <h3 className="font-medium text-sm text-neutral-900 dark:text-white mb-3">Minimum Rating</h3>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => updateParam('minRating', rating.toString())}
                      className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                    >
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}
                          />
                        ))}
                      </div>
                      <span>& Up</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h3 className="font-medium text-sm text-neutral-900 dark:text-white mb-3">Availability</h3>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filter === 'in-stock'}
                      onChange={(e) => updateParam('filter', e.target.checked ? 'in-stock' : '')}
                      className="accent-brand-600"
                    />
                    In Stock Only
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filter === 'on-sale'}
                      onChange={(e) => updateParam('filter', e.target.checked ? 'on-sale' : '')}
                      className="accent-brand-600"
                    />
                    On Sale
                  </label>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600">
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200"
            >
              <SlidersHorizontal size={16} /> Filters
              {activeFilterCount > 0 && <span className="bg-brand-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{activeFilterCount}</span>}
            </button>
            <div className="relative ml-auto">
              <select
                value={sortBy}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-neutral-500 dark:text-neutral-400 text-lg">No products found matching your criteria.</p>
              <button onClick={clearFilters} className="mt-4 text-brand-600 hover:text-brand-700 font-medium">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => <ProductCard key={p.id} product={p} onQuickView={setQuickViewProduct} />)}
            </div>
          )}
        </div>
      </div>

      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </div>
  );
}
