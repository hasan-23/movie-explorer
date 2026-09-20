import React, { useState, useEffect, useMemo } from 'react';

export default function App() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('rating-desc');
  const [selectedShow, setSelectedShow] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('movie_explorer_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState('all');

  // Save favorites to LocalStorage
  useEffect(() => {
    localStorage.setItem('movie_explorer_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch initial shows or search shows from TVMaze API
  useEffect(() => {
    const fetchShows = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = 'https://api.tvmaze.com/shows';
        if (searchQuery.trim() !== '') {
          url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(searchQuery.trim())}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();

        let formattedData = [];
        if (searchQuery.trim() !== '') {
          formattedData = data.map(item => item.show).filter(Boolean);
        } else {
          formattedData = data;
        }
        setShows(formattedData);
      } catch (err) {
        setError(err.message || 'Something went wrong while fetching shows');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchShows();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Extract all unique genres
  const genresList = useMemo(() => {
    const genreSet = new Set();
    shows.forEach(show => {
      if (show.genres && Array.isArray(show.genres)) {
        show.genres.forEach(g => genreSet.add(g));
      }
    });
    return ['All', ...Array.from(genreSet).sort()];
  }, [shows]);

  // Toggle favorite status
  const toggleFavorite = (show) => {
    setFavorites(prev => {
      const exists = prev.some(fav => fav.id === show.id);
      if (exists) {
        return prev.filter(fav => fav.id !== show.id);
      } else {
        return [...prev, show];
      }
    });
  };

  // Filter and Sort shows
  const displayedShows = useMemo(() => {
    let sourceList = activeTab === 'favorites' ? favorites : shows;

    if (selectedGenre !== 'All') {
      sourceList = sourceList.filter(show =>
        show.genres && show.genres.includes(selectedGenre)
      );
    }

    return [...sourceList].sort((a, b) => {
      if (sortBy === 'rating-desc') {
        return (b.rating?.average || 0) - (a.rating?.average || 0);
      }
      if (sortBy === 'rating-asc') {
        return (a.rating?.average || 0) - (b.rating?.average || 0);
      }
      if (sortBy === 'title-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'year-desc') {
        const yearA = a.premiered ? new Date(a.premiered).getFullYear() : 0;
        const yearB = b.premiered ? new Date(b.premiered).getFullYear() : 0;
        return yearB - yearA;
      }
      return 0;
    });
  }, [shows, favorites, activeTab, selectedGenre, sortBy]);

  // Helper to remove HTML tags from summary
  const cleanSummary = (html) => {
    if (!html) return 'No description available.';
    return html.replace(/<[^>]*>?/gm, '');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      {/* Header */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto 30px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '20px'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #38bdf8, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          🎬 MovieExplorer
        </h1>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              backgroundColor: activeTab === 'all' ? '#0284c7' : '#1e293b',
              color: '#fff',
              transition: 'all 0.2s'
            }}
          >
            All Shows ({shows.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              backgroundColor: activeTab === 'favorites' ? '#e11d48' : '#1e293b',
              color: '#fff',
              transition: 'all 0.2s'
            }}
          >
            ❤️ Favorites ({favorites.length})
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Search & Filters Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '15px',
          backgroundColor: '#1e293b',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
        }}>
          {/* Search Box */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
              Search Movie / Show:
            </label>
            <input
              type="text"
              placeholder="e.g. Batman, Friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Genre Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
              Filter by Genre:
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              {genresList.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="rating-desc">Highest Rated ⭐</option>
              <option value="rating-asc">Lowest Rated</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="year-desc">Newest Release</option>
            </select>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#38bdf8' }}>
            <h2>Loading content... ⏳</h2>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#f43f5e' }}>
            <h2>⚠️ {error}</h2>
          </div>
        ) : displayedShows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#94a3b8' }}>
            <h2>No shows found matching your criteria. 🔍</h2>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '24px'
          }}>
            {displayedShows.map(show => {
              const isFav = favorites.some(f => f.id === show.id);
              return (
                <div key={show.id} style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ position: 'relative', height: '320px', backgroundColor: '#0284c7' }}>
                    <img
                      src={show.image?.medium || show.image?.original || 'https://via.placeholder.com/210x295?text=No+Poster'}
                      alt={show.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => toggleFavorite(show)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isFav ? '#f43f5e' : '#fff'
                      }}
                      title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>
                    {show.rating?.average && (
                      <span style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: '#facc15'
                      }}>
                        ⭐ {show.rating.average}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 8px 0', color: '#f8fafc' }}>
                      {show.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 12px 0' }}>
                      {show.genres?.join(', ') || 'General'}
                    </p>

                    <div style={{ marginTop: 'auto' }}>
                      <button
                        onClick={() => setSelectedShow(show)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        {selectedShow && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
              <button
                onClick={() => setSelectedShow(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: '#334155',
                  border: 'none',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <img
                  src={selectedShow.image?.medium || 'https://via.placeholder.com/210x295?text=No+Poster'}
                  alt={selectedShow.name}
                  style={{ borderRadius: '8px', width: '160px', height: '220px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h2 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: '#f8fafc' }}>
                    {selectedShow.name}
                  </h2>
                  <p style={{ margin: '4px 0', color: '#94a3b8' }}>
                    <strong>Language:</strong> {selectedShow.language || 'N/A'}
                  </p>
                  <p style={{ margin: '4px 0', color: '#94a3b8' }}>
                    <strong>Premiered:</strong> {selectedShow.premiered || 'N/A'}
                  </p>
                  <p style={{ margin: '4px 0', color: '#94a3b8' }}>
                    <strong>Genres:</strong> {selectedShow.genres?.join(', ') || 'N/A'}
                  </p>
                  <p style={{ margin: '4px 0', color: '#facc15', fontWeight: 'bold' }}>
                    <strong>Rating:</strong> ⭐ {selectedShow.rating?.average || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#38bdf8' }}>Summary:</h4>
                <p style={{ color: '#cbd5e1', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {cleanSummary(selectedShow.summary)}
                </p>
              </div>

              {selectedShow.officialSite && (
                <div style={{ marginTop: '20px' }}>
                  <a
                    href={selectedShow.officialSite}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '10px 20px',
                      backgroundColor: '#10b981',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold'
                    }}
                  >
                    Visit Official Site ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}