import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CategoryPicker from '../components/CategoryPicker.jsx';
import SearchOverlay from '../components/SearchOverlay.jsx';
import ViewToggle from '../components/ViewToggle.jsx';

import '../Styles/BooksPage.css';

/**
 * Stars component (UI only)
 * - In your DB schema there is no rating field yet.
 * - So for now we show a constant rating (example: 4.5)
 * - Later, when we build reviews/ratings tables, we’ll replace this with real data.
 */
function Stars({ value = 4.5 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;

  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return '★';
    if (i === full && half) return '☆';
    return '☆';
  }).join('');

  return <div className="bkStars">{stars}</div>;
}

/**
 * BookCard
 * IMPORTANT: this now reads from YOUR MySQL schema fields:
 * - cover_url (instead of cover)
 * - selling_price (instead of price)
 * - publisher_id exists, author does not -> we show a placeholder text.
 */
function BookCard({ book }) {
  // price from MySQL might come as string "200.00" (common with DECIMAL)
  const priceNum = Number(book.selling_price || 0);
  const stockQty = Number(book.stock_qty ?? 0);
  const threshold = Number(book.threshold ?? 0);
  const lowStock = stockQty <= threshold;

  // if cover_url is NULL, we provide a safe fallback image
  const coverSrc =
    book.cover_url || 'https://via.placeholder.com/300x420.png?text=No+Cover';

  // rating is not in DB yet; constant for now
  const rating = 4.5;
  console.log(book.title, book.cover_url);

  return (
    <div className="bkCard">
      <div className="bkCoverWrap">
        <img className="bkCover" src={coverSrc} alt={book.title} />
      </div>

      <div className="bkMeta">
        <div className="bkTitle" title={book.title}>
          {book.title}
        </div>

        {/* Publisher (placeholder until JOIN is added) */}
        <div className="bkAuthor">Publisher #{book.publisher_id}</div>

        {/* Stock info – subtle and clean */}
        <div className="bkStock">
          <span>In stock: {stockQty}</span>
          {lowStock && <span className="bkLowStock"> Low stock</span>}
        </div>

        <div className="bkBottom">
          <div className="bkRating">
            <Stars value={rating} />
            <span className="bkRatingNum">{rating.toFixed(1)}</span>
          </div>

          <div className="bkPrice">${priceNum.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

export default function BooksPage() {
  const navigate = useNavigate();

  /**
   * UI state:
   * - cat: which category is selected
   * - view: grid/list toggle (UI only right now)
   */
  const [cat, setCat] = useState('all');
  const [view, setView] = useState('grid');

  /**
   * Data state (coming from backend):
   * - books: array from API response
   * - loading: true while fetch is running
   * - error: store error message if request fails
   */
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Categories MUST match your MySQL ENUM:
   * ('Science','Art','Religion','History','Geography')
   *
   * We use:
   * - id = value we store in state (and send to backend)
   * - label = text shown in UI
   */
  /*
  useMemo :Compute this value once, remember it, and only recompute it if dependencies change.
  React re-renders A LOT
  Every time:
  setCat(...),setBooks(...),setLoading(...)
  the whole BooksPage function runs again.
  Without useMemo, this array would be recreated on every render.
  */
  const categories = useMemo(
    () => [
      { id: 'all', label: 'All Genre' },
      { id: 'Science', label: 'Science' },
      { id: 'Art', label: 'Art' },
      { id: 'Religion', label: 'Religion' },
      { id: 'History', label: 'History' },
      { id: 'Geography', label: 'Geography' },
    ],
    [] // Create this value ONCE when the component mounts, and NEVER recreate it.”
  );

  /**
   * FETCH LOGIC (the most important part)
   *
   * When does it run?
   * - first page load
   * - whenever cat changes
   *
   * What does it do?
   * 1) Build the API URL
   * 2) Call backend GET /api/books
   * 3) Read JSON response
   * 4) Put DB rows into state: setBooks(...)
   */
  useEffect(() => {
    const controller = new AbortController();

    async function loadBooks() {
      setLoading(true);
      setError('');

      try {
        // Build URL: base endpoint
        const url = new URL('http://localhost:3000/api/books');

        // If user selected a category (not "all"), send it to backend:
        if (cat !== 'all') {
          url.searchParams.set('category', cat);
        }

        // You can control pagination later; keep it simple now:
        url.searchParams.set('limit', '50');
        url.searchParams.set('offset', '0');

        // Call backend
        const res = await fetch(url.toString(), {
          signal: controller.signal,
        });

        // If backend returns 500/404/etc.
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }

        const data = await res.json();

        // Our backend shape:
        // { ok: true, count, limit, offset, data: [...] }
        if (!data.ok) {
          throw new Error(data.error || 'Unknown backend error');
        }
        console.log(data);
        setBooks(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        // Abort is normal when user switches category quickly
        if (e.name !== 'AbortError') {
          setError(e.message || 'Failed to load books');
        }
      } finally {
        setLoading(false);
      }
    }

    loadBooks();

    // Cleanup: cancel request if component unmounts or cat changes fast
    return () => controller.abort();
  }, [cat]);

  /**
   * handlePick (SearchOverlay)
   * Your SearchOverlay currently returns a picked item.
   * We keep your behavior:
   * - If picked matches a category label -> update category state
   * - If picked matches a section -> navigate
   */
  const handlePick = (value) => {
    const picked = String(value || '').trim();

    // 1) category click -> set category (triggers useEffect fetch)
    const matchCat = categories.find(
      (c) => c.label.toLowerCase() === picked.toLowerCase()
    );
    if (matchCat) {
      setCat(matchCat.id);
      return;
    }

    // 2) section navigation
    const key = picked.toLowerCase();
    if (key === 'books') navigate('/books');
    if (key === 'customers') navigate('/customers');
    if (key === 'orders') navigate('/orders');
  };

  /**
   * filtered:
   * Since we are already filtering by category on the backend,
   * filtered is just "books".
   *
   * Later, when we add search q, we can either:
   * - filter server-side (recommended)
   * - or filter client-side
   */
  const filtered = books;

  return (
    <div className="bkPage">
      {/* Top row: Search + View Toggle */}
      <div className="bkTopRow">
        <SearchOverlay
          placeholder="What are you looking for?"
          shortcutHint="⌘K"
          trendingItems={categories
            .filter((c) => c.id !== 'all')
            .map((c) => c.label)}
          newInItems={['Books', 'Customers', 'Orders']}
          onPick={handlePick}
        />
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Categories */}
      <div className="bkCatsRow">
        <CategoryPicker
          value={cat}
          onChange={setCat} // triggers fetch through useEffect
          items={categories}
          title="Featured Categories"
          rightLabel="All Genre"
          onRightClick={() => setCat('all')}
        />
      </div>

      {/* Books header */}
      <div className="bkGridHead">
        <div className="bkGridTitle">Browse books</div>

        {/* Show loading / error / count */}
        <div className="bkGridHint">
          {loading
            ? 'Loading...'
            : error
            ? `Error: ${error}`
            : `${filtered.length} items`}
        </div>
      </div>

      {/* Books grid */}
      <div className="bkGrid">
        {filtered.map((b) => (
          // Your primary key is isbn, so key should be isbn (not id)
          <BookCard key={b.isbn} book={b} />
        ))}
      </div>
    </div>
  );
}
