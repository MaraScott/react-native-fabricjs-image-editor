import React, { useState, useEffect, useRef } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// Client-side only search component
function MeilisearchBarClient() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchDocs = async () => {
      if (query.length < 2) {
        setResults([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Search both docs and code-docs indexes
        const [docsResponse, codeResponse] = await Promise.all([
          fetch(`http://localhost:7700/indexes/docs/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer tinyartist',
            },
            body: JSON.stringify({
              q: query,
              limit: 5,
              attributesToHighlight: ['title', 'content'],
              highlightPreTag: '<mark>',
              highlightPostTag: '</mark>',
            }),
          }),
          fetch(`http://localhost:7700/indexes/code-docs/search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer tinyartist',
            },
            body: JSON.stringify({
              q: query,
              limit: 5,
              attributesToHighlight: ['name', 'description', 'content'],
              highlightPreTag: '<mark>',
              highlightPostTag: '</mark>',
            }),
          }),
        ]);

        if (!docsResponse.ok || !codeResponse.ok) {
          throw new Error('Search failed');
        }

        const docsData = await docsResponse.json();
        const codeData = await codeResponse.json();
        
        // Combine results, marking code results for different display
        const docsHits = (docsData.hits || []).map(hit => ({ ...hit, source: 'docs' }));
        const codeHits = (codeData.hits || []).map(hit => ({ 
          ...hit, 
          source: 'code',
          // Create a URL for code results
          url: `/docs/code/${hit.file}#L${hit.line}`,
          title: hit.name || 'Unknown'
        }));
        
        setResults([...docsHits, ...codeHits]);
      } catch (err) {
        console.error('Search error:', err);
        setError('Search unavailable. Make sure Meilisearch is running.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchDocs, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={searchRef} className="meilisearch-wrapper">
      <div className="meilisearch-input-wrapper">
        <input
          type="text"
          className="meilisearch-input"
          placeholder="Search documentation..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search"
        />
        {loading && <span className="meilisearch-loading">⏳</span>}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="meilisearch-results">
          {error ? (
            <div className="meilisearch-error">{error}</div>
          ) : results.length > 0 ? (
            <>
              {results.map((hit) => (
                <a
                  key={hit.id}
                  href={hit.url}
                  className={`meilisearch-result-item ${hit.source === 'code' ? 'code-result' : ''}`}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                  }}
                >
                  <div className="meilisearch-result-title">
                    {hit.source === 'code' && <span className="code-badge">CODE</span>}
                    <span dangerouslySetInnerHTML={{ __html: hit._formatted?.title || hit._formatted?.name || hit.title || hit.name }} />
                  </div>
                  {hit.source === 'code' ? (
                    <>
                      <div className="meilisearch-result-hierarchy">
                        {hit.file} • Line {hit.line} • {hit.type}
                      </div>
                      {hit._formatted?.description && (
                        <div
                          className="meilisearch-result-content"
                          dangerouslySetInnerHTML={{
                            __html: hit._formatted.description.substring(0, 150) + '...',
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {hit.hierarchy && hit.hierarchy.length > 0 && (
                        <div className="meilisearch-result-hierarchy">
                          {hit.hierarchy.join(' › ')}
                        </div>
                      )}
                      {hit._formatted?.content && (
                        <div
                          className="meilisearch-result-content"
                          dangerouslySetInnerHTML={{
                            __html: hit._formatted.content.substring(0, 150) + '...',
                          }}
                        />
                      )}
                    </>
                  )}
                </a>
              ))}
            </>
          ) : (
            <div className="meilisearch-no-results">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MeilisearchBar() {
  return (
    <BrowserOnly fallback={<div>Loading search...</div>}>
      {() => <MeilisearchBarClient />}
    </BrowserOnly>
  );
}
