import React from 'react';

const TYPE_CLASS = {
  positive: 'badge-positive',
  negative: 'badge-negative',
  validation: 'badge-validation',
  edge: 'badge-edge',
};

const PRIORITY_CLASS = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  critical: 'badge-critical',
};

export function TypeBadge({ type }) {
  return (
    <span className={`badge ${TYPE_CLASS[type] || 'badge-positive'}`}>
      {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown'}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${PRIORITY_CLASS[priority] || 'badge-medium'}`}>
      {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Unknown'}
    </span>
  );
}
