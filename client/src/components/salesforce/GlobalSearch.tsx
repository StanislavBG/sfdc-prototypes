import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Building2,
  User,
  DollarSign,
  LifeBuoy,
  UserPlus,
  X,
  ChevronDown,
} from 'lucide-react';
import { searchData360, type SearchResult } from '@/lib/mock-data';

const typeIcons: Record<string, React.ElementType> = {
  Building2,
  User,
  DollarSign,
  LifeBuoy,
  UserPlus,
};

const typeColors: Record<string, string> = {
  Account: '#7F8DE1',
  Contact: '#F49756',
  Opportunity: '#4BC076',
  Case: '#E8788A',
  Lead: '#56B1F0',
};

interface GlobalSearchProps {
  onSelectResult: (id: string) => void;
}

export default function GlobalSearch({ onSelectResult }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 1) {
      const matches = searchData360(query);
      setResults(matches);
      setIsOpen(matches.length > 0);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onSelectResult(id);
    setQuery('');
    setIsOpen(false);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="slds-pos-relative" style={{ width: '480px' }}>
      <div className="slds-pos-relative slds-grid slds-grid_vertical-align-center">
        {/* All Sources dropdown */}
        <button
          className={`sf-search-scope ${isFocused ? 'focused' : ''}`}
        >
          All Sources
          <ChevronDown className="slds-icon-size_xx-small" />
        </button>
        {/* Search input */}
        <div className="slds-pos-relative slds-col">
          <Search className={`sf-search-icon slds-icon-size_small ${isFocused ? 'focused' : ''}`} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or ask anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (results.length > 0) setIsOpen(true);
            }}
            className="sf-search-input slds-w-full slds-text-size_medium"
            style={{ paddingLeft: '36px', paddingRight: '32px', height: '32px', borderRadius: '0 4px 4px 0' }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className={`sf-search-clear ${isFocused ? 'focused' : ''}`}
            >
              <X className="slds-icon-size_small" />
            </button>
          )}
        </div>
      </div>

      {isOpen && isFocused && (
        <div className="sf-search-results">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="sf-search-group-header">
                {type}s
              </div>
              {items.map((item) => {
                const IconComponent = typeIcons[item.icon] || Building2;
                return (
                  <button
                    key={item.id}
                    className="sf-search-result-item slds-w-full slds-text-left"
                    onClick={() => handleSelect(item.id)}
                  >
                    <div
                      className="sf-search-result-icon"
                      style={{ backgroundColor: typeColors[item.type] || '#7F8DE1' }}
                    >
                      <IconComponent className="slds-icon-size_small slds-text-white" />
                    </div>
                    <div className="slds-min-w-0">
                      <div className="slds-text-size_medium slds-font-weight_medium slds-text-neutral-base slds-truncate">
                        {item.name}
                      </div>
                      <div className="slds-text-size_small slds-text-neutral-7 slds-truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
