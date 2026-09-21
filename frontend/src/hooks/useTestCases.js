import { useState, useCallback, useRef } from 'react';
import { generateTestCases, saveTestCases, getTestCasesForRequirement, updateTestCases } from '../api/testCaseApi';
import { getErrorMessage } from '../utils/errorHandler';

function useTestCases(userId) {
  // Draft (generated, not saved)
  const [draftTestCases, setDraftTestCases] = useState([]);
  const [requirement, setRequirement] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  // Saved (loaded from backend for selected requirement)
  const [savedTestCases, setSavedTestCases] = useState([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [testCasesError, setTestCasesError] = useState(null);

  // Save/update
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Active requirement (when viewing a saved one)
  const [activeRequirementId, setActiveRequirementId] = useState(null);

  // AbortController ref for cancelling stale requests
  const abortRef = useRef(null);

  // ── GENERATE ──────────────────────────────────────────────
  const generate = useCallback(
    async (requirementText) => {
      if (isGenerating) return;
      setIsGenerating(true);
      setGenerationError(null);
      // Do NOT reset draftTestCases yet — keep old ones on failure
      try {
        const data = await generateTestCases({ userId, requirement: requirementText });
        setDraftTestCases(data.testCases || []);
        setRequirement(requirementText);
        setIsDirty(false);
        return true;
      } catch (err) {
        setGenerationError(getErrorMessage(err));
        // Intentionally do not clear draftTestCases — preserve previous set
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [userId, isGenerating]
  );

  // ── EDIT DRAFT TEST CASE ──────────────────────────────────
  const updateDraftTestCase = useCallback((updated) => {
    setDraftTestCases((prev) =>
      prev.map((tc) => (tc.testCaseId === updated.testCaseId ? updated : tc))
    );
    setIsDirty(true);
  }, []);

  // ── SAVE (new requirement + test cases) ──────────────────
  const save = useCallback(
    async (requirementText, testCases, existingRequirementId = null) => {
      if (isSaving) return null;
      setIsSaving(true);
      setSaveError(null);
      try {
        const payload = {
          userId,
          requirement: requirementText,
          testCases,
          ...(existingRequirementId ? { requirementId: existingRequirementId } : {}),
        };
        const data = await saveTestCases(payload);
        setIsDirty(false);
        setActiveRequirementId(data.requirementId);
        return data;
      } catch (err) {
        setSaveError(getErrorMessage(err));
        // Do NOT clear testCases or isDirty
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, isSaving]
  );

  // ── UPDATE saved test cases (already-persisted requirement) ──
  const update = useCallback(
    async (requirementId, testCases) => {
      if (isSaving) return null;
      setIsSaving(true);
      setSaveError(null);
      try {
        const data = await updateTestCases(userId, requirementId, testCases);
        setSavedTestCases(data.testCases || []);
        setIsDirty(false);
        return data;
      } catch (err) {
        setSaveError(getErrorMessage(err));
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, isSaving]
  );

  // ── UPDATE saved test case in local state ─────────────────
  const updateSavedTestCase = useCallback((updated) => {
    setSavedTestCases((prev) =>
      prev.map((tc) => (tc.testCaseId === updated.testCaseId ? updated : tc))
    );
    setIsDirty(true);
  }, []);

  // ── LOAD test cases for a requirement ────────────────────
  const loadForRequirement = useCallback(
    async (requirementId) => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoadingTestCases(true);
      setTestCasesError(null);
      setSavedTestCases([]);
      setActiveRequirementId(requirementId);

      setDraftTestCases([]);
      setRequirement('');
      setGenerationError(null);

      try {
        const data = await getTestCasesForRequirement(
          userId,
          requirementId,
          controller.signal
        );
        // Only update if this request wasn't cancelled
        setSavedTestCases(data.testCases || []);
        setIsDirty(false);
      } catch (err) {
        if (err?.code === 'ERR_CANCELED') return; // stale request
        setTestCasesError(getErrorMessage(err));
      } finally {
        setLoadingTestCases(false);
      }
    },
    [userId]
  );

  // ── RESET for new requirement ─────────────────────────────
  const resetWorkspace = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setDraftTestCases([]);
    setSavedTestCases([]);
    setRequirement('');
    setIsDirty(false);
    setGenerationError(null);
    setTestCasesError(null);
    setSaveError(null);
    setActiveRequirementId(null);
  }, []);

  return {
    // Draft
    draftTestCases,
    setDraftTestCases,
    requirement,
    setRequirement,
    isDirty,
    setIsDirty,
    isGenerating,
    generationError,
    setGenerationError,
    generate,
    updateDraftTestCase,

    // Save
    isSaving,
    saveError,
    setSaveError,
    save,

    // Saved
    savedTestCases,
    setSavedTestCases,
    loadingTestCases,
    testCasesError,
    setTestCasesError,
    loadForRequirement,
    update,
    updateSavedTestCase,

    // Active
    activeRequirementId,
    setActiveRequirementId,

    // Reset
    resetWorkspace,
  };
}

export default useTestCases;
