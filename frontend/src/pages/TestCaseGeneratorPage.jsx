import React, { useEffect, useCallback, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import useRequirements from '../hooks/useRequirements';
import useTestCases from '../hooks/useTestCases';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import TestCaseWorkspace from '../components/testCases/TestCaseWorkspace';
import ConfirmDialog from '../components/common/ConfirmDialog';

function TestCaseGeneratorPage() {
  const {
    userId,
    selectedRequirementId,
    setSelectedRequirementId,
    sidebarOpen,
    setSidebarOpen,
  } = useApp();

  const reqs = useRequirements(userId);
  const tc = useTestCases(userId);

  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // ── Load requirements on mount ───────────────────────────────
  useEffect(() => {
    if (userId) {
      reqs.load();
    }
  }, [userId]);

  // ── Select requirement ───────────────────────────────────────
  const handleSelectRequirement = useCallback(
    (requirementId) => {
      if (requirementId === selectedRequirementId) return;

      setSelectedRequirementId(requirementId);
      tc.loadForRequirement(requirementId);

      // Close sidebar on both desktop and mobile
      setSidebarOpen(false);

      setIsCreatingNew(false);
    },
    [
      selectedRequirementId,
      setSelectedRequirementId,
      tc,
      setSidebarOpen,
    ]
  );

  // ── New requirement ──────────────────────────────────────────
  const handleNew = useCallback(() => {
    if (tc.isDirty && tc.draftTestCases.length > 0) {
      setShowNewConfirm(true);
      return;
    }

    startNew();
  }, [tc.isDirty, tc.draftTestCases]);

  const startNew = () => {
    setShowNewConfirm(false);
    setSelectedRequirementId(null);
    tc.resetWorkspace();

    // Close sidebar on both desktop and mobile
    setSidebarOpen(false);

    setIsCreatingNew(true);
  };

  // ── After saving ─────────────────────────────────────────────
  const handleRequirementSaved = useCallback(
    (requirementId) => {
      setSelectedRequirementId(requirementId);
      setIsCreatingNew(false);

      // Refresh sidebar
      reqs.load();
    },
    [setSelectedRequirementId, reqs]
  );

  // ── Delete ───────────────────────────────────────────────────
  const handleDeleteRequirement = useCallback(
    async (requirementId) => {
      await reqs.remove(requirementId);

      setSelectedRequirementId(null);
      tc.resetWorkspace();
    },
    [reqs, setSelectedRequirementId, tc]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Header />

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >

        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-20"
            style={{
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)',
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className="shrink-0"
          style={{
            width: 240,
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 25,
            transform: sidebarOpen
              ? 'translateX(0)'
              : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
          }}
        >
          <Sidebar
            requirements={reqs.requirements}
            loading={reqs.loading}
            error={reqs.error}
            selectedRequirementId={selectedRequirementId}
            onSelect={handleSelectRequirement}
            onNew={handleNew}
            onRefresh={reqs.load}
          />
        </div>

        {/* Main workspace */}
        <main
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-bg)',
          }}
        >
          <TestCaseWorkspace
            userId={userId}
            selectedRequirementId={selectedRequirementId}
            requirements={reqs.requirements}
            tc={tc}
            onNew={handleNew}
            onRequirementSaved={handleRequirementSaved}
            onDeleteRequirement={handleDeleteRequirement}
            isCreatingNew={isCreatingNew}
          />
        </main>
      </div>

      {/* New requirement confirm dialog */}
      {showNewConfirm && (
        <ConfirmDialog
          isOpen
          title="Start new requirement?"
          message="You have unsaved changes. Starting a new requirement will discard the current draft test cases."
          confirmLabel="Continue"
          confirmDanger
          onConfirm={startNew}
          onCancel={() => setShowNewConfirm(false)}
        />
      )}

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-danger)',
              secondary: 'white',
            },
          },
          duration: 3500,
        }}
      />
    </div>
  );
}

export default TestCaseGeneratorPage;
