import React from 'react';

function TestCaseSkeleton() {
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}
    >
      <div className="flex items-center gap-2">
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-4 w-20 rounded-full" />
        <div className="skeleton h-4 w-16 rounded-full" />
      </div>
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
        <div className="skeleton h-3 w-4/6 rounded" />
      </div>
    </div>
  );
}

export default TestCaseSkeleton;
