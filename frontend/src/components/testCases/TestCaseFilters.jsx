import React, { useMemo } from 'react';
import { FILTER_ALL, TEST_CASE_TYPES } from '../../utils/constants';

const ALL_FILTERS = [FILTER_ALL, ...TEST_CASE_TYPES];

function TestCaseFilters({ activeFilter, onFilterChange, counts }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap" role="tablist" aria-label="Filter test cases">
      {ALL_FILTERS.map((f) => {
        const count = f === FILTER_ALL ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[f] || 0);
        const isActive = activeFilter === f;
        return (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            role="tab"
            aria-selected={isActive}
            className="text-xs px-3 py-1 rounded-full transition-all duration-150 flex items-center gap-1.5"
            style={{
              background: isActive ? 'var(--color-accent)' : 'var(--color-surface-2)',
              color: isActive ? 'white' : 'var(--color-text-muted)',
              border: isActive ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
              fontWeight: isActive ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {f === FILTER_ALL ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span
              className="text-xs px-1 py-0.5 rounded"
              style={{
                background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-surface)',
                color: isActive ? 'white' : 'var(--color-text-dim)',
                fontSize: '0.65rem',
                minWidth: 18,
                textAlign: 'center',
                lineHeight: 1.4,
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default TestCaseFilters;
