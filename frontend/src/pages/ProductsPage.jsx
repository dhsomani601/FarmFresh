import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import ProductCard from '../components/ProductCard';
import './ProductsPage.css';

const allCategories = ['All', 'Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Beverages', 'Snacks'];
const categoryEmojis = { All: '🛒', Fruits: '🍎', Vegetables: '🥦', Dairy: '🥛', Bakery: '🍞', Beverages: '☕', Snacks: '🍪' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const querySearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(querySearch);
  const activeCategory = searchParams.get('category') || 'All';

  // Synchronize search input with URL search param
  useEffect(() => {
    setSearchInput(querySearch);
  }, [querySearch]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory, querySearch]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (querySearch.trim()) params.search = querySearch.trim();
      const data = await api.getProducts(params);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCategoryChange = (cat) => {
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      searchParams.set('search', trimmed);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    searchParams.delete('search');
    setSearchParams(searchParams);
  };

  return (
    <div className="products-page page-container">
      <div className="container">
        <div className="products-header animate-fade-in-up">
          <h1 className="page-title">
            {querySearch ? 'Search Catalog' : 'Our Fresh Products'}
          </h1>
          <p className="page-subtitle">
            {querySearch
              ? `Showing results matching your query: "${querySearch}"`
              : 'Direct from regional organic farms, harvested daily at dawn'}
          </p>
        </div>

        {/* Search + Filters */}
        <div className="products-controls animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <form className="search-bar" id="search-bar" onSubmit={handleSearchSubmit}>
            <svg
              className="search-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, description, fruit, milk..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              id="search-input"
            />
            {searchInput && (
              <button
                type="button"
                className="search-clear"
                onClick={handleClearSearch}
                aria-label="Clear Search"
              >
                ✕
              </button>
            )}
            <button type="submit" className="search-submit-pill">
              Search
            </button>
          </form>

          <div className="category-filters" id="category-filters">
            {allCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
                id={`filter-${cat.toLowerCase()}`}
              >
                <span>{categoryEmojis[cat]}</span>
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Search Results Filter Banner */}
        {querySearch && (
          <div className="search-active-banner animate-fade-in">
            <div className="search-active-info">
              <span>Showing search results for: <strong>"{querySearch}"</strong></span>
              <span className="search-active-count">
                • {products.length} matching item{products.length !== 1 ? 's' : ''} found
              </span>
            </div>
            <button
              type="button"
              className="clear-search-pill-btn"
              onClick={handleClearSearch}
            >
              ✕ Clear Search
            </button>
          </div>
        )}

        {/* Results info */}
        {!querySearch && (
          <div className="results-info">
            <span>{products.length} product{products.length !== 1 ? 's' : ''} available</span>
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="products-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton product-skeleton">
                <div className="skeleton" style={{ height: 160 }} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ height: 20, width: '70%' }} />
                  <div className="skeleton" style={{ height: 14, width: '100%' }} />
                  <div className="skeleton" style={{ height: 28, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3>No products found matching "{querySearch || activeCategory}"</h3>
            <p>Try searching for fresh essentials like "apple", "milk", "bread", or "berry"</p>
            {querySearch && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClearSearch}
                style={{ marginTop: '1rem' }}
              >
                View All Fresh Groceries
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid" id="products-grid">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
