import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Import Shared Component
import BookCard from '../components/BookCard.jsx';
import CategoryPicker from '../components/CategoryPicker.jsx';
import SearchOverlay from '../components/SearchOverlay.jsx';
import ViewToggle from '../components/ViewToggle.jsx';
import '../Styles/BooksPage.css';

export default function BooksPage() {
  const navigate = useNavigate();
  const [cat, setCat] = useState('all');
  const [view, setView] = useState('grid');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = useMemo(
    () => [
      { id: 'all', label: 'All Genre' },
      { id: 'Science', label: 'Science' },
      { id: 'Art', label: 'Art' },
      { id: 'Religion', label: 'Religion' },
      { id: 'History', label: 'History' },
      { id: 'Geography', label: 'Geography' },
    ],
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    async function loadBooks() {
      setLoading(true);
      setError('');
      try {
        const url = new URL('http://localhost:3000/api/books');
        if (cat !== 'all') url.searchParams.set('category', cat);
        url.searchParams.set('limit', '50');

        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();

        if (!data.ok) throw new Error(data.error || 'Unknown backend error');
        setBooks(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        if (e.name !== 'AbortError') setError(e.message || 'Failed');
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
    return () => controller.abort();
  }, [cat]);

  const handlePick = (value) => {
    const picked = String(value || '').trim();
    const matchCat = categories.find(
      (c) => c.label.toLowerCase() === picked.toLowerCase()
    );
    if (matchCat) {
      setCat(matchCat.id);
      return;
    }
    const key = picked.toLowerCase();
    if (key === 'books') navigate('/admin/books');
    if (key === 'customers') navigate('/admin/customers');
    if (key === 'orders') navigate('/admin/orders');
  };

  return (
    <div className="bkPage">
      <div className="bkTopRow">
        <SearchOverlay
          placeholder="Admin Search..."
          shortcutHint="⌘K"
          trendingItems={categories
            .filter((c) => c.id !== 'all')
            .map((c) => c.label)}
          newInItems={['Books', 'Customers', 'Orders']}
          onPick={handlePick}
        />
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="bkCatsRow">
        <CategoryPicker
          value={cat}
          onChange={setCat}
          items={categories}
          title="Featured Categories"
          rightLabel="All Genre"
          onRightClick={() => setCat('all')}
        />
      </div>

      <div className="bkGridHead">
        <div className="bkGridTitle">Browse books (Admin)</div>
        <div className="bkGridHint">
          {loading
            ? 'Loading...'
            : error
            ? `Error: ${error}`
            : `${books.length} items`}
        </div>
      </div>

      <div className="bkGrid">
        {books.map((b) => (
          // Admin View: We DO NOT pass onAddOne, so it looks like Admin Card
          <BookCard key={b.isbn} book={b} />
        ))}
      </div>
    </div>
  );
}
