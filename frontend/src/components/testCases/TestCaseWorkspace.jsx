import React, { useState, useEffect } from 'react';
import { Save, Wand2, Trash2, FolderOpen, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import RequirementInput from '../requirements/RequirementInput';
import TestCaseList from '../testCases/TestCaseList';
import ConfirmDialog from '../common/ConfirmDialog';
import ErrorMessage from '../common/ErrorMessage';
import Spinner from '../common/Spinner';

// ── Empty workspace state ─────────────────────────────────────
function WorkspaceEmpty({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center px-8 animate-fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <Wand2 size={26} style={{ color: 'var(--color-accent)' }} />
      </div>
      <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
        Create a requirement
      </h2>
      <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Describe what your software should do, then generate comprehensive test cases with AI.
      </p>
      <button onClick={onNew} className="btn-primary">
        <Wand2 size={15} />
        Create Requirement
      </button>
    </div>
  );
}

// ── Mode: viewing a saved requirement's test cases ────────────
function SavedRequirementView({
  requirement,
  testCases,
  loading,
  error,
  onRetry,
  onEdit,
  onDelete,
  isSaving,
  saveError,
  onSaveUpdate,
  isDirty,
}) {
  const handleDelete = () => onDelete && onDelete();

  return (
    <div className="animate-fade-in">
      {/* Requirement context bar */}
      <div
        className="mb-6 p-4 rounded-xl"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FolderOpen size={13} style={{ color: 'var(--color-text-dim)' }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-dim)' }}>
                Saved Requirement
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {requirement?.prompt || '—'}
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="btn-danger shrink-0 text-xs py-1.5 px-2.5"
            style={{ border: 'none', background: 'transparent', color: 'var(--color-text-dim)' }}
            title="Delete requirement"
            aria-label="Delete this requirement"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Save changes bar */}
      {isDirty && !loading && (
        <div
          className="mb-4 flex items-center justify-between gap-3 p-3 rounded-lg"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <p className="text-xs" style={{ color: '#fbbf24' }}>
            You have unsaved changes to these test cases.
          </p>
          <button
            onClick={onSaveUpdate}
            disabled={isSaving}
            className="btn-primary text-xs py-1.5"
          >
            {isSaving ? <><Spinner size={12} /> Saving…</> : <><Save size={12} /> Save Changes</>}
          </button>
        </div>
      )}

      {saveError && (
        <div className="mb-4">
          <ErrorMessage message={saveError} />
        </div>
      )}

      {/* Test cases */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
          Saved Test Cases
        </h2>
        {!loading && !error && testCases.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
            {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <TestCaseList
        testCases={testCases}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onEditTestCase={onEdit}
      />
    </div>
  );
}

// ── Mode: generating / editing draft ─────────────────────────
function DraftWorkspace({
  requirementText,
  onRequirementChange,
  onGenerate,
  isGenerating,
  generationError,
  onClearGenerationError,
  testCases,
  onEditTestCase,
  onSave,
  isSaving,
  saveError,
  onClearSaveError,
  isDirty,
  activeRequirementId,
}) {
  return (
    <div>
      {/* Input section */}
      <div
        className="mb-6 p-5 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text-dim)' }}>
          Requirement
        </h2>
        <RequirementInput
          requirementText={requirementText}
          onRequirementChange={onRequirementChange}
          onGenerate={onGenerate}
          isGenerating={isGenerating}
          generationError={generationError}
          onClearError={onClearGenerationError}
          hasExistingTestCases={testCases.length > 0}
          isDirty={isDirty}
        />
      </div>

      {/* Test cases section */}
      {(testCases.length > 0 || isGenerating) && (
        <div className="animate-fade-in">
          {/* Section header + save */}
          {!isGenerating && (
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  Generated Test Cases
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                  {testCases.length} test case{testCases.length !== 1 ? 's' : ''} • Review, edit, then save
                </p>
              </div>
              <button
                onClick={onSave}
                disabled={isSaving || isGenerating || testCases.length === 0}
                className="btn-primary"
              >
                {isSaving ? (
                  <><Spinner size={14} /> Saving…</>
                ) : activeRequirementId ? (
                  <><Save size={14} /> Save Changes</>
                ) : (
                  <><Save size={14} /> Save Test Cases</>
                )}
              </button>
            </div>
          )}

          {saveError && (
            <div className="mb-4">
              <ErrorMessage message={saveError} onRetry={onSave} />
            </div>
          )}

          <TestCaseList
            testCases={isGenerating ? [] : testCases}
            loading={isGenerating}
            error={null}
            onRetry={null}
            onEditTestCase={onEditTestCase}
          />
        </div>
      )}
    </div>
  );
}

// ── Main workspace ────────────────────────────────────────────
function TestCaseWorkspace({
  // App state
  userId,
  selectedRequirementId,
  requirements,

  // Test case hook
  tc,

  // Handlers
  onNew,
  onRequirementSaved,
  onDeleteRequirement,
  isCreatingNew,
}) {
  const [requirementText, setRequirementText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [pendingRegenerateText, setPendingRegenerateText] = useState(null);

  // Current selected requirement metadata
  const selectedReq = requirements.find((r) => r.requirementId === selectedRequirementId) || null;

  // When a saved requirement is selected, clear draft
  useEffect(() => {
    if (selectedRequirementId) {
      setRequirementText('');
    }
  }, [selectedRequirementId]);

  // ── Generate / Regenerate ─────────────────────────────────
  const handleGenerate = async (text) => {
    // If there are unsaved changes, confirm first
    if (tc.isDirty && tc.draftTestCases.length > 0) {
      setPendingRegenerateText(text);
      setShowRegenerateConfirm(true);
      return;
    }
    await tc.generate(text);
  };

  const confirmRegenerate = async () => {
    setShowRegenerateConfirm(false);
    if (pendingRegenerateText) {
      await tc.generate(pendingRegenerateText);
      setPendingRegenerateText(null);
    }
  };

  // ── Save new/update draft ────────────────────────────────
  const handleSave = async () => {
    const result = await tc.save(requirementText, tc.draftTestCases, tc.activeRequirementId);
    if (result) {
      toast.success('Test cases saved successfully!');
      onRequirementSaved(result.requirementId);
    }
  };

  // ── Save updates to already-saved requirement ────────────
  const handleSaveUpdate = async () => {
    if (!selectedRequirementId) return;
    const result = await tc.update(selectedRequirementId, tc.savedTestCases);
    if (result) {
      toast.success('Changes saved successfully!');
    }
  };

  // ── Delete ──────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    try {
      await onDeleteRequirement(selectedRequirementId);
      toast.success('Requirement deleted.');
    } catch (err) {
      toast.error('Failed to delete requirement.');
    }
  };

  // ── View: Nothing selected & no draft ───────────────────
  const hasDraft = tc.draftTestCases.length > 0 || tc.isGenerating || tc.generationError;

  if (!selectedRequirementId && !hasDraft && !requirementText && !isCreatingNew) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <WorkspaceEmpty onNew={onNew} />
      </div>
    );
  }

  // ── View: Saved requirement ──────────────────────────────
  if (selectedRequirementId && !hasDraft) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6">
        <SavedRequirementView
          requirement={selectedReq}
          testCases={tc.savedTestCases}
          loading={tc.loadingTestCases}
          error={tc.testCasesError}
          onRetry={() => tc.loadForRequirement(selectedRequirementId)}
          onEdit={tc.updateSavedTestCase}
          onDelete={() => setShowDeleteConfirm(true)}
          isSaving={tc.isSaving}
          saveError={tc.saveError}
          onSaveUpdate={handleSaveUpdate}
          isDirty={tc.isDirty}
        />

        {showDeleteConfirm && (
          <ConfirmDialog
            isOpen
            title="Delete Requirement?"
            message={`This will permanently remove this requirement and all its saved test cases.`}
            confirmLabel="Delete"
            confirmDanger
            onConfirm={handleDeleteConfirm}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </div>
    );
  }

  // ── View: Draft workspace (generate / edit / save) ───────
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-6">
      <DraftWorkspace
        requirementText={requirementText}
        onRequirementChange={setRequirementText}
        onGenerate={handleGenerate}
        isGenerating={tc.isGenerating}
        generationError={tc.generationError}
        onClearGenerationError={() => tc.setGenerationError(null)}
        testCases={tc.draftTestCases}
        onEditTestCase={tc.updateDraftTestCase}
        onSave={handleSave}
        isSaving={tc.isSaving}
        saveError={tc.saveError}
        onClearSaveError={() => tc.setSaveError(null)}
        isDirty={tc.isDirty}
        activeRequirementId={tc.activeRequirementId}
      />

      {showRegenerateConfirm && (
        <ConfirmDialog
          isOpen
          title="Regenerate test cases?"
          message="You have unsaved changes. Regenerating will replace your current test cases."
          confirmLabel="Regenerate"
          confirmDanger
          onConfirm={confirmRegenerate}
          onCancel={() => {
            setShowRegenerateConfirm(false);
            setPendingRegenerateText(null);
          }}
        />
      )}
    </div>
  );
}

export default TestCaseWorkspace;
