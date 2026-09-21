import React, { useState, useMemo } from 'react';
import TestCaseCard from './TestCaseCard';
import TestCaseFilters from './TestCaseFilters';
import TestCaseEditor from './TestCaseEditor';
import TestCaseSkeleton from './TestCaseSkeleton';
import ErrorMessage from '../common/ErrorMessage';
import { FILTER_ALL } from '../../utils/constants';
import { FileSearch } from 'lucide-react';

function EmptyTestCases({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileSearch size={32} className="mb-3" style={{ color: 'var(--color-text-dim)' }} />
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {hasFilters ? 'No test cases match this filter' : 'No test cases yet'}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
        {hasFilters
          ? 'Try a different filter to see more results.'
          : 'Generate test cases from your requirement above.'}
      </p>
    </div>
  );
}

function TestCaseList({
  testCases,
  loading,
  error,
  onRetry,
  onEditTestCase,
}) {
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
  const [editingTestCase, setEditingTestCase] = useState(null);

  const counts = useMemo(() => {
    const c = {};
    testCases.forEach((tc) => {
      c[tc.type] = (c[tc.type] || 0) + 1;
    });
    return c;
  }, [testCases]);

  const filtered = useMemo(() => {
    if (activeFilter === FILTER_ALL) return testCases;
    return testCases.filter((tc) => tc.type === activeFilter);
  }, [testCases, activeFilter]);

  const handleEdit = (tc) => setEditingTestCase(tc);

  const handleEditorSave = (updated) => {
    onEditTestCase(updated);
    setEditingTestCase(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <TestCaseSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (testCases.length === 0) {
    return <EmptyTestCases hasFilters={false} />;
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-4">
        <TestCaseFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyTestCases hasFilters={activeFilter !== FILTER_ALL} />
      ) : (
        <div className="space-y-4">
          {filtered.map((tc, i) => (
            <TestCaseCard
              key={tc.testCaseId}
              testCase={tc}
              index={i}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Editor modal */}
      {editingTestCase && (
        <TestCaseEditor
          testCase={editingTestCase}
          onSave={handleEditorSave}
          onCancel={() => setEditingTestCase(null)}
        />
      )}
    </>
  );
}

export default TestCaseList;
