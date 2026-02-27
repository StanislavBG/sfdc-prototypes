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
    <div ref={containerRef} className="relative w-[480px]">
      <div className="relative flex items-center">
        {/* All Sources dropdown */}
        <button
          className={`sf-search-scope flex items-center gap-1 px-3 h-[32px] text-xs font-medium border rounded-l whitespace-nowrap ${
            isFocused
              ? 'bg-white text-slds-neutral-9 border-slds-brand-2 border-r-slds-border-1'
              : 'bg-white/10 text-white/90 border-white/25 border-r-white/15'
          }`}
        >
          All Sources
          <ChevronDown className="w-3 h-3" />
        </button>
        {/* Search input */}
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isFocused ? 'text-slds-neutral-7' : 'text-white/70'}`} />
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
            className="sf-search-input w-full pl-9 pr-8 py-1.5 text-sm h-[32px] !rounded-l-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 ${isFocused ? 'text-slds-neutral-7' : 'text-white/70'} hover:text-slds-neutral-base`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isOpen && isFocused && (
        <div className="sf-search-results">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="px-4 py-2 text-xs font-semibold text-slds-neutral-7 uppercase tracking-wide bg-[#FAFAF9] border-b border-slds-border-2">
                {type}s
              </div>
              {items.map((item) => {
                const IconComponent = typeIcons[item.icon] || Building2;
                return (
                  <button
                    key={item.id}
                    className="sf-search-result-item w-full text-left"
                    onClick={() => handleSelect(item.id)}
                  >
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: typeColors[item.type] || '#7F8DE1' }}
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slds-neutral-base truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-slds-neutral-7 truncate">
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
