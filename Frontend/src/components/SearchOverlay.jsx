import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/SearchOverlay.css';
import { Search, X, BookOpen, ShoppingCart, Package, User, ArrowRight, Book } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function SearchOverlay({
  trendingItems,
  quickActions,
  shortcutHint = '⌘K',
  placeholder = 'Search for books, authors, categories...',
  onPick,
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const searchTimeout = useRef(null);

  const trending = useMemo(
    () => trendingItems ?? ['Science', 'History', 'Religion', 'Geography', 'Art'],
    [trendingItems]
  );

  const quick = useMemo(
    () =>
      quickActions ?? [
        { icon: BookOpen, label: 'Browse Books', path: '/c/books' },
        { icon: ShoppingCart, label: 'My Cart', path: '/c/cart' },
        { icon: Package, label: 'My Orders', path: '/c/orders' },
        { icon: User, label: 'My Profile', path: '/c/profile' },
      ],
    [quickActions]
  );

  const close = () => {
    setOpen(false);
    setSelectedIndex(-1);
    setSearchResults([]);
  };

  const openAndFocus = () => {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };
const viewMoreBooks = () => {
  if (!q.trim()) return;
  navigate(`/c/books?q=${encodeURIComponent(q.trim())}`);
  close();
};

  // Search books from API
  const searchBooks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const res = await fetch(`${API_BASE}/api/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, limit: 5 }),
      });

      const data = await res.json();
      if (data.ok) {
        setSearchResults(data.data || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (q.trim()) {
      searchTimeout.current = setTimeout(() => {
        searchBooks(q);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [q]);

  // Global shortcuts + escape + click outside
  useEffect(() => {
    const onKeyDown = (e) => {
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        openAndFocus();
        return;
      }
      // "/" opens like many dashboards (only if not typing)
      if (!open && e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          openAndFocus();
        }
        return;
      }
      if (open && e.key === 'Escape') close();

      // Arrow key navigation when panel is open
      if (open) {
        const allItems = [
          ...searchResults,
          ...(!q ? trending : []),
          ...quick.map(q => q.label)
        ];
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % allItems.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => prev <= 0 ? allItems.length - 1 : prev - 1);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
          e.preventDefault();
          handleSelect(allItems[selectedIndex]);
        }
      }
    };

    const onMouseDown = (e) => {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) close();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [open, selectedIndex, searchResults, q, trending, quick]);

  useEffect(() => {
    if (!open) {
      setQ('');
      setSelectedIndex(-1);
      setSearchResults([]);
    }
  }, [open]);

  const filteredTrending = useMemo(() => {
    if (q.trim()) return []; // Hide trending when searching
    return trending;
  }, [q, trending]);

  const handleSelect = (value) => {
    // If it's a book object (from search results)
    if (value?.isbn) {
      navigate(`/c/books?q=${encodeURIComponent(value.title)}`);
      close();
      return;
    }

    // Check if it's a quick action with a path
    const quickAction = quick.find(qa => qa.label === value);
    
    if (quickAction?.path) {
      navigate(quickAction.path);
      close();
      return;
    }

    // Handle category/navigation items
    const routeMap = {
      // Categories
      'Science': '/c/books?category=Science',
      'Art': '/c/books?category=Art',
      'Religion': '/c/books?category=Religion',
      'History': '/c/books?category=History',
      'Geography': '/c/books?category=Geography',
      
      // Navigation
      'Books': '/c/books',
      'Cart': '/c/cart',
      'My Cart': '/c/cart',
      'My Orders': '/c/orders',
      'Orders': '/c/orders',
      'Profile': '/c/profile',
      'My Profile': '/c/profile',
      'Settings': '/c/profile',
    };

    if (routeMap[value]) {
      navigate(routeMap[value]);
      close();
      return;
    }

    // Fallback to onPick callback
    onPick?.(value);
    close();
  };

  const pick = (value) => {
    handleSelect(value);
  };

  return (
    <div className="searchWrap">
      <div className="searchTop">
        <button className="searchBar" type="button" onClick={openAndFocus}>
          <span className="searchPlaceholder">{placeholder}</span>
          <span className="searchHint">{shortcutHint}</span>
        </button>
      </div>

      {/* Backdrop */}
      {open && <div className="searchBackdrop" />}

      {/* Panel */}
      <div
        ref={panelRef}
        className={'searchPanel ' + (open ? 'open' : '')}
        aria-hidden={!open}
      >
        <div className="searchPanelHead">
          <div className="searchInputWrap">
            <Search size={18} className="searchInputIcon" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="searchInput"
              onFocus={() => setOpen(true)}
            />
            {q && (
              <button
                className="searchClear"
                type="button"
                onClick={() => setQ('')}
                title="Clear"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button className="searchCancel" type="button" onClick={close}>
            Cancel
          </button>
        </div>

        <div className="searchGrid">
          {/* Search Results - Show when typing */}
          {q.trim() && (
            <div className="searchCol search-results-col">
              <div className="searchTitle">
                {searching ? 'Searching...' : `Results for "${q}"`}
              </div>
              <div className="searchCards">
                {searchResults.length > 0 ? (
                  searchResults.map((book, idx) => (
                    <button
                      key={book.isbn}
                      className={`searchCard book-result ${selectedIndex === idx ? 'selected' : ''}`}
                      type="button"
                      onClick={() => pick(book)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      {book.cover_url ? (
                        <img 
                          src={book.cover_url} 
                          alt={book.title}
                          className="searchCardCover"
                        />
                      ) : (
                        <div className="searchCardIcon">
                          <Book size={18} />
                        </div>
                      )}
                      <div className="searchCardText">
                        <div className="searchCardLabel">{book.title}</div>
                        <div className="searchCardSub">
                          {book.publisher_name} • ${book.selling_price}
                        </div>
                        <div className="searchCardMeta">
                          {book.category} • {book.available ? 'In Stock' : 'Out of Stock'}
                        </div>
                      </div>
                    </button>
                  ))
                ) : searching ? (
                  <div className="searchEmpty">Searching books...</div>
                ) : (
                  <div className="searchEmpty">No books found</div>
                )}
              </div>
              {/* 🔥 VIEW MORE BOOKS BUTTON */}
    {searchResults.length > 0 && (
      <button
        className="searchViewMore"
        type="button"
        onClick={viewMoreBooks}
      >
        View more books for “{q}”
      </button>
    )}
            </div>
          )}


          {/* Trending - Show when NOT typing */}
          {!q.trim() && (
            <div className="searchCol">
              <div className="searchTitle">Trending searches</div>
              <div className="searchList">
                {filteredTrending.map((t, idx) => {
                  const globalIdx = searchResults.length + idx;
                  return (
                    <button
                      key={t}
                      className={`searchItem ${selectedIndex === globalIdx ? 'selected' : ''}`}
                      type="button"
                      onClick={() => pick(t)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                    >
                      <span className="dot" />
                      <span className="label">{t}</span>
                      <ArrowRight size={16} className="arrow" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions - Always show */}
          <div className="searchCol">
            <div className="searchTitle">Quick actions</div>
            <div className="searchCards">
              {quick.map(({ icon: Icon, label, path }, idx) => {
                const baseIdx = q.trim() ? searchResults.length : searchResults.length + filteredTrending.length;
                const globalIdx = baseIdx + idx;
                return (
                  <button
                    key={label}
                    className={`searchCard ${selectedIndex === globalIdx ? 'selected' : ''}`}
                    type="button"
                    onClick={() => pick(label)}
                    onMouseEnter={() => setSelectedIndex(globalIdx)}
                  >
                    <div className="searchCardIcon">
                      <Icon size={18} />
                    </div>
                    <div className="searchCardText">
                      <div className="searchCardLabel">{label}</div>
                      <div className="searchCardSub">Open</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="searchFooter">
          <span>Tip:</span> Press <kbd>↑</kbd> <kbd>↓</kbd> to navigate • Press <kbd>Enter</kbd> to select • Press <kbd>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}