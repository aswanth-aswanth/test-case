import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { validateTestCase, hasValidationErrors } from '../../utils/validators';
import { TEST_CASE_TYPES, TEST_CASE_PRIORITIES } from '../../utils/constants';

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.75rem',
};

function ArrayEditor({ label, items, onChange, placeholder }) {
  const handleChange = (i, val) => {
    const next = [...items];
    next[i] = val;
    onChange(next);
  };
  const handleAdd = () => onChange([...items, '']);
  const handleRemove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder={`${placeholder} ${i + 1}`}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="shrink-0 p-2 rounded"
              style={{ color: 'var(--color-danger)', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}
              aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAdd}
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--color-accent-light)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
        >
          <Plus size={12} /> Add {label.slice(0, -1)}
        </button>
      </div>
    </div>
  );
}

function TestDataEditor({ value, onChange }) {
  const [raw, setRaw] = useState(() => {
    try { return JSON.stringify(value, null, 2); }
    catch { return '{}'; }
  });
  const [jsonError, setJsonError] = useState(null);

  const handleChange = (text) => {
    setRaw(text);
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      onChange(parsed);
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
        Test Data (JSON)
      </label>
      <textarea
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        rows={4}
        style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', resize: 'vertical' }}
        spellCheck={false}
      />
      {jsonError && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{jsonError}</p>}
    </div>
  );
}

function TestCaseEditor({ testCase, onSave, onCancel }) {
  const [form, setForm] = useState({ ...testCase });
  const [errors, setErrors] = useState({});

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    const errs = validateTestCase(form);
    if (hasValidationErrors(errs)) {
      setErrors(errs);
      return;
    }
    // Clean empty steps/preconditions
    const cleaned = {
      ...form,
      steps: form.steps.filter((s) => s.trim()),
      preconditions: (form.preconditions || []).filter((p) => p.trim()),
    };
    onSave(cleaned);
  };

  const field = (key, label, type = 'input', extra = {}) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      {type === 'input' ? (
        <input
          value={form[key] || ''}
          onChange={(e) => set(key, e.target.value)}
          style={inputStyle}
          {...extra}
        />
      ) : type === 'textarea' ? (
        <textarea
          value={form[key] || ''}
          onChange={(e) => set(key, e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
          {...extra}
        />
      ) : type === 'select' ? (
        <select
          value={form[key] || ''}
          onChange={(e) => set(key, e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          {extra.options?.map((o) => (
            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
          ))}
        </select>
      ) : null}
      {errors[key] && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <div
        className="modal-box w-full"
        style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 id="editor-title" className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            Edit Test Case
          </h2>
          <button
            onClick={onCancel}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            aria-label="Close editor"
          >
            <X size={18} />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {field('title', 'Title', 'input', { placeholder: 'Test case title' })}
          {field('description', 'Description', 'textarea', { placeholder: 'Describe what this test case verifies' })}

          <div className="grid grid-cols-2 gap-4">
            {field('type', 'Type', 'select', { options: TEST_CASE_TYPES })}
            {field('priority', 'Priority', 'select', { options: TEST_CASE_PRIORITIES })}
          </div>

          <ArrayEditor
            label="Preconditions"
            items={form.preconditions || []}
            onChange={(v) => set('preconditions', v)}
            placeholder="Precondition"
          />

          <ArrayEditor
            label="Steps"
            items={form.steps || []}
            onChange={(v) => set('steps', v)}
            placeholder="Step"
          />
          {errors.steps && <p className="text-xs -mt-3" style={{ color: 'var(--color-danger)' }}>{errors.steps}</p>}

          <TestDataEditor value={form.testData || {}} onChange={(v) => set('testData', v)} />

          {field('expectedResult', 'Expected Result', 'textarea', { placeholder: 'What should happen?' })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-6 pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
          <button onClick={onCancel} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default TestCaseEditor;
