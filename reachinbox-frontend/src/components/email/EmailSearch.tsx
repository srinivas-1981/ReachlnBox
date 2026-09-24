'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  isSearching?: boolean;
}

export const EmailSearch: React.FC<EmailSearchProps> = ({
  onSearch,
  placeholder = 'Search emails...',
  className,
  isSearching = false,
}) => {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={cn('relative w-full max-w-xs', className)}>
      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
        {isSearching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
        ) : (
          <Search className="h-3.5 w-3.5" />
        )}
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search emails"
        className="block w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-md placeholder:text-slate-400 text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
      />

      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
          aria-label="Clear search input"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
