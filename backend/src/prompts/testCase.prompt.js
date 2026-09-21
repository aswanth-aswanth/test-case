/**
 * Prompt engineering for Gemini test-case generation.
 * The requirement is the sole source of truth.
 */

export const SYSTEM_ROLE = `You are a Senior QA Engineer and Software Test Analyst.

Your job is to analyze software requirements and produce clear, executable, professional test cases.`;

export const buildTestCasePrompt = (requirement, title) => {
  const titleLine = title ? `Optional title: ${title}\n\n` : '';

  return `${SYSTEM_ROLE}

Analyze only the provided software requirement.

Generate comprehensive software test cases based on
the behavior explicitly described or reasonably implied
by the requirement.

Do not invent unsupported product functionality.

Do not invent authentication mechanisms,
authorization rules, integrations, APIs, UI components,
database behavior, notifications, OTPs, biometrics,
external services, or business rules unless supported
by the requirement.

Every test case must have a clear relationship to the
provided requirement.

Prefer concrete, executable test steps.

Expected results must directly describe the behavior
being validated.

Avoid duplicate scenarios.

Cover positive, negative, validation, and edge cases.

Do not generate irrelevant test cases simply to increase
the number of test cases.

Return only the requested structured output.

${titleLine}Software requirement (source of truth):
"""
${requirement}
"""

Guidelines for coverage:
- positive: successful expected behavior
- negative: invalid or unsuccessful behavior
- validation: missing, malformed, or unacceptable inputs
- edge: boundary and unusual but relevant cases

Each test case must include:
- testCaseId (e.g. TC-001)
- title
- description
- type (positive | negative | validation | edge)
- priority (low | medium | high | critical)
- preconditions (array of strings; may be empty)
- steps (non-empty array of concrete actions)
- testData (object; use {} if none)
- expectedResult

Generate a balanced, focused set of test cases (typically 6–12)
that thoroughly cover the requirement without padding.`;
};

export default buildTestCasePrompt;
