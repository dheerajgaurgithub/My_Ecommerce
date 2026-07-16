import { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Clock, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { formatPrice } from '../lib/utils';

interface SearchResult {
  type: 'product' | 'category' | 'search';
  id: string;
  name: string;
  slug?: string;
  price?: number;
  image?: string;
  category?: string;
}

export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }

    // Load trending searches (simulated)
    setTrendingSearches(['summer dress', 'denim jacket', 'white sneakers', 'casual shirt', 'handbag']);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const response = await api.get<{ success: boolean; results: any[] }>(`/search?q=${encodeURIComponent(query)}`);
          if (response.success) {
            const mappedResults: SearchResult[] = response.results.map((r: any) => ({
              type: 'product',
              id: r._id,
              name: r.name,
              slug: r.slug,
              price: r.price,
              image: r.images?.[0],
              category: r.category_name,
            }));
            setResults(mappedResults);
          }
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToRecentSearches = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = (searchTerm?: string) => {
    const term = searchTerm || query;
    if (term.trim()) {
      addToRecentSearches(term);
      navigate(`/shop?q=${encodeURIComponent(term)}`);
      setShowResults(false);
      setQuery('');
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'product' && result.slug) {
      navigate(`/product/${result.slug}`);
    } else {
      handleSearch(result.name);
    }
    setShowResults(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder="Search for products, brands, categories..."
          className="input w-full pl-12 pr-12 py-3 text-lg"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-neutral-500">
              Searching...
            </div>
          ) : query.length >= 2 ? (
            <>
              {results.length > 0 ? (
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
                    <Package size={16} />
                    <span>Products</span>
                  </div>
                  {results.slice(0, 6).map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-left"
                    >
                      {result.image && (
                        <img src={result.image} alt="" className="w-12 h-12 object-cover rounded-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-white truncate">{result.name}</p>
                        {result.category && (
                          <p className="text-xs text-neutral-500">{result.category}</p>
                        )}
                      </div>
                      {result.price && (
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {formatPrice(result.price)}
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={() => handleSearch()}
                    className="w-full mt-3 text-center text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    View all results for "{query}"
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center text-neutral-500">
                  No results found for "{query}"
                </div>
              )}
            </>
          ) : (
            <div className="p-4">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      <Clock size={16} />
                      <span>Recent Searches</span>
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => {
                          setQuery(search);
                          handleSearch(search);
                        }}
                        className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 rounded-full text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {trendingSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <TrendingUp size={16} />
                    <span>Trending Searches</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => {
                          setQuery(search);
                          handleSearch(search);
                        }}
                        className="px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 rounded-full text-sm text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
