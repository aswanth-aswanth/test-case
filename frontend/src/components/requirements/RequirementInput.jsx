import React, { useState } from 'react';
import { Wand2, RefreshCw } from 'lucide-react';
import Spinner from '../common/Spinner';
import ErrorMessage from '../common/ErrorMessage';
import { validateRequirement } from '../../utils/validators';
import { MAX_REQUIREMENT_LENGTH, MIN_REQUIREMENT_LENGTH } from '../../utils/constants';

const GENERATION_STEPS = [
  'Analyzing requirement…',
  'Creating positive scenarios…',
  'Building negative cases…',
  'Checking edge cases…',
  'Structuring test cases…',
];

function GeneratingLoader() {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % GENERATION_STEPS.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center py-12 gap-4 animate-fade-in"
      aria-live="polite"
      aria-label="Generating test cases"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <Wand2 size={22} style={{ color: 'var(--color-accent)' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
          Generating test cases…
        </p>
        <p
          className="text-xs transition-all duration-500"
          style={{ color: 'var(--color-text-muted)', minHeight: 18 }}
        >
          {GENERATION_STEPS[step]}
        </p>
      </div>
    </div>
  );
}

function RequirementInput({
  requirementText,
  onRequirementChange,
  onGenerate,
  isGenerating,
  generationError,
  onClearError,
  hasExistingTestCases,
  isDirty,
}) {
  const [touched, setTouched] = useState(false);
  const validationError = touched ? validateRequirement(requirementText) : null;
  const charCount = requirementText.length;
  const isOverLimit = charCount > MAX_REQUIREMENT_LENGTH;
  const tooShort = requirementText.trim().length < MIN_REQUIREMENT_LENGTH;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    const err = validateRequirement(requirementText);
    if (err) return;
    onGenerate(requirementText);
  };

  return (
    <div className="animate-fade-in">
      <form onSubmit={handleSubmit}>
        {/* Requirement textarea */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor="requirement-input"
              className="text-xs font-medium"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Requirement
            </label>
            <span
              className="text-xs font-mono"
              style={{ color: isOverLimit ? 'var(--color-danger)' : 'var(--color-text-dim)' }}
            >
              {charCount.toLocaleString()} / {MAX_REQUIREMENT_LENGTH.toLocaleString()}
            </span>
          </div>
          <textarea
            id="requirement-input"
            value={requirementText}
            onChange={(e) => {
              onRequirementChange(e.target.value);
              if (onClearError) onClearError();
            }}
            onBlur={() => setTouched(true)}
            placeholder="Describe what your software should do. Be specific about behaviors, user actions, expected outcomes, and edge cases you want covered…"
            rows={7}
            maxLength={MAX_REQUIREMENT_LENGTH + 100}
            style={{
              width: '100%',
              padding: '0.75rem',
              resize: 'vertical',
              lineHeight: 1.6,
              fontSize: '0.875rem',
            }}
            aria-describedby={validationError ? 'req-error' : undefined}
          />
          {validationError && (
            <p id="req-error" className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
              {validationError}
            </p>
          )}
        </div>

        {/* Generation error */}
        {generationError && (
          <div className="mb-4">
            <ErrorMessage
              message={generationError}
              onRetry={!tooShort ? () => {
                setTouched(false);
                onGenerate(requirementText);
              } : undefined}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isGenerating || isOverLimit}
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <Spinner size={14} />
                Generating…
              </>
            ) : hasExistingTestCases ? (
              <>
                <RefreshCw size={14} />
                Regenerate
              </>
            ) : (
              <>
                <Wand2 size={14} />
                Generate Test Cases
              </>
            )}
          </button>

          {isDirty && !isGenerating && (
            <span className="text-xs" style={{ color: 'var(--color-warning)' }}>
              • Unsaved changes
            </span>
          )}
        </div>
      </form>

      {/* Generating animation */}
      {isGenerating && <GeneratingLoader />}
    </div>
  );
}

export default RequirementInput;
