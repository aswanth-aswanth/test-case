import React from 'react';
import { Plus, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { SpinnerDark } from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';

// ── Skeleton ─────────────────────────────────────────────────
function RequirementSkeleton() {
  return (
    <div className="p-3 rounded-lg animate-pulse" style={{ background: 'var(--color-surface-2)' }}>
      <div className="skeleton h-3 w-3/4 mb-2" />
      <div className="skeleton h-2.5 w-full mb-1" />
      <div className="skeleton h-2.5 w-2/3" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function RequirementEmptyState() {
  return (
    <div className="px-3 py-8 text-center">
      <FileText size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-dim)' }} />
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
        No saved requirements
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
        Your saved requirements will appear here.
      </p>
    </div>
  );
}

// ── List item ─────────────────────────────────────────────────
function RequirementListItem({ req, isSelected, onClick }) {
  const when = formatRelative(req.updatedAt || req.createdAt);
  const preview = req.prompt ? req.prompt.slice(0, 80) + (req.prompt.length > 80 ? '…' : '') : '';

  return (
    <button
      onClick={() => onClick(req.requirementId)}
      className="w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150"
      style={{
        background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
        border: isSelected ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
        cursor: 'pointer',
      }}
      aria-selected={isSelected}
      aria-label={`Select requirement: ${req.prompt?.slice(0, 50) || 'Requirement'}`}
    >
      <p
        className="text-xs font-medium mb-0.5 truncate"
        style={{ color: isSelected ? 'var(--color-accent-light)' : 'var(--color-text)' }}
      >
        {req.prompt?.slice(0, 50) || 'Requirement'}
      </p>
      <p className="text-xs truncate mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {preview}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
        {when}
      </p>
    </button>
  );
}

function formatRelative(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Main sidebar ──────────────────────────────────────────────
function Sidebar({
  requirements,
  loading,
  error,
  selectedRequirementId,
  onSelect,
  onNew,
  onRefresh,
}) {
  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
          Requirements
        </span>
        {!loading && (
          <button
            onClick={onRefresh}
            className="p-1 rounded"
            style={{ color: 'var(--color-text-dim)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            title="Refresh requirements"
            aria-label="Refresh requirements list"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>

      {/* New Requirement button */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button
          onClick={onNew}
          className="w-full btn-ghost text-xs justify-center"
          style={{ gap: 6 }}
        >
          <Plus size={14} />
          New Requirement
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        {loading ? (
          <div className="space-y-2 px-1 pt-1">
            {[1, 2, 3].map((i) => <RequirementSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="px-2 pt-2">
            <ErrorMessage message={error} onRetry={onRefresh} />
          </div>
        ) : requirements.length === 0 ? (
          <RequirementEmptyState />
        ) : (
          requirements.map((req) => (
            <RequirementListItem
              key={req.requirementId}
              req={req}
              isSelected={selectedRequirementId === req.requirementId}
              onClick={onSelect}
            />
          ))
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
