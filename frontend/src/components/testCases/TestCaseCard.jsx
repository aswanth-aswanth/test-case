import React, { useState } from 'react';
import { Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { TypeBadge, PriorityBadge } from './Badges';

function TestDataDisplay({ testData }) {
  if (!testData || typeof testData !== 'object' || Object.keys(testData).length === 0) {
    return <span className="text-xs italic" style={{ color: 'var(--color-text-dim)' }}>No test data</span>;
  }
  return (
    <dl className="space-y-1">
      {Object.entries(testData).map(([k, v]) => (
        <div key={k} className="flex gap-2 text-xs">
          <dt className="font-medium shrink-0" style={{ color: 'var(--color-text-muted)' }}>{k}:</dt>
          <dd style={{ color: 'var(--color-text)', wordBreak: 'break-word' }}>
            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-dim)' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function TestCaseCard({ testCase, onEdit, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="rounded-xl animate-fade-in"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-subtle)',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        className="flex items-start justify-between px-4 py-3"
        style={{ borderBottom: expanded ? '1px solid var(--color-border-subtle)' : 'none' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-xs font-mono font-bold shrink-0"
              style={{ color: 'var(--color-accent-light)' }}
            >
              {testCase.testCaseId || `TC-${String(index + 1).padStart(3, '0')}`}
            </span>
            <TypeBadge type={testCase.type} />
            <PriorityBadge priority={testCase.priority} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {testCase.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 ml-3 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(testCase)}
              className="btn-ghost p-1.5 text-xs"
              style={{ border: 'none', gap: 4 }}
              aria-label={`Edit test case ${testCase.testCaseId}`}
              title="Edit test case"
            >
              <Edit2 size={13} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)' }}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse test case' : 'Expand test case'}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 py-4 space-y-4 animate-fade-in">
          {/* Description */}
          <Section label="Description">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {testCase.description}
            </p>
          </Section>

          {/* Preconditions */}
          {testCase.preconditions?.length > 0 && (
            <Section label="Preconditions">
              <ul className="space-y-1">
                {testCase.preconditions.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <span style={{ color: 'var(--color-text-dim)' }}>•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Steps */}
          <Section label="Steps">
            <ol className="space-y-1">
              {(testCase.steps || []).map((step, i) => (
                <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <span
                    className="shrink-0 font-mono text-xs w-5 h-5 flex items-center justify-center rounded"
                    style={{
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-accent-light)',
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Section>

          {/* Test Data */}
          <Section label="Test Data">
            <TestDataDisplay testData={testCase.testData} />
          </Section>

          {/* Expected Result */}
          <Section label="Expected Result">
            <p
              className="text-sm leading-relaxed p-3 rounded-lg"
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.15)',
                color: '#a7f3d0',
              }}
            >
              {testCase.expectedResult}
            </p>
          </Section>
        </div>
      )}
    </article>
  );
}

export default TestCaseCard;
