import AppError from '../utils/AppError.js';


const MEANINGLESS_STEP_PATTERNS = [
  /^n\/?a$/i,
  /^todo$/i,
  /^tbd$/i,
  /^test$/i,
  /^step\s*\d*$/i,
  /^\.+$/,
  /^-+$/,
];

/**
 * Features that commonly appear as AI hallucinations when
 * not mentioned in the requirement.
 */
const UNSUPPORTED_FEATURE_PATTERNS = [
  { key: 'sms otp', pattern: /\b(sms\s*otp|text\s*message\s*otp|otp\s*via\s*sms)\b/i },
  { key: 'biometric', pattern: /\b(biometric|fingerprint|face\s*id|facial\s*recognition|iris\s*scan)\b/i },
  { key: 'admin approval', pattern: /\b(admin\s*approval|administrator\s*must\s*approve)\b/i },
  { key: 'two-factor', pattern: /\b(two[-\s]?factor|2fa|mfa|multi[-\s]?factor)\b/i },
  { key: 'oauth', pattern: /\b(oauth|sso|single\s*sign[-\s]?on|saml)\b/i },
  { key: 'captcha', pattern: /\b(captcha|recaptcha)\b/i },
  { key: 'payment gateway', pattern: /\b(stripe|paypal|payment\s*gateway)\b/i },
  { key: 'push notification', pattern: /\b(push\s*notification)\b/i },
  { key: 'blockchain', pattern: /\b(blockchain|nft|smart\s*contract)\b/i },
];

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (text) =>
  normalize(text)
    .split(' ')
    .filter((token) => token.length > 2);

/**
 * Extract meaningful keywords from the requirement for relevance checks.
 */
const extractRequirementKeywords = (requirement) => {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'that',
    'with',
    'this',
    'from',
    'should',
    'shall',
    'must',
    'can',
    'will',
    'able',
    'user',
    'users',
    'system',
    'using',
    'into',
    'their',
    'them',
    'they',
    'have',
    'been',
    'when',
    'where',
    'which',
    'about',
    'also',
    'only',
    'than',
    'then',
    'such',
    'each',
    'other',
    'some',
    'any',
    'all',
  ]);

  return [...new Set(tokenize(requirement).filter((t) => !stopWords.has(t)))];
};

const testCaseTextBlob = (testCase) =>
  [
    testCase.title,
    testCase.description,
    ...(testCase.preconditions || []),
    ...(testCase.steps || []),
    testCase.expectedResult,
    JSON.stringify(testCase.testData || {}),
  ].join(' ');

/**
 * Check whether a test case invents features not present in the requirement.
 */
const inventsUnsupportedFeatures = (requirement, testCase) => {
  const reqNorm = normalize(requirement);
  const caseNorm = normalize(testCaseTextBlob(testCase));

  for (const feature of UNSUPPORTED_FEATURE_PATTERNS) {
    const mentionedInCase = feature.pattern.test(caseNorm);
    const mentionedInRequirement = feature.pattern.test(reqNorm);

    if (mentionedInCase && !mentionedInRequirement) {
      return feature.key;
    }
  }

  return null;
};

/**
 * Simple relevance: at least some requirement keywords should appear
 * in the combined test case text. Very short requirements get a looser check.
 */
const hasReasonableRelevance = (keywords, testCase) => {
  if (keywords.length === 0) {
    return true;
  }

  const blob = normalize(testCaseTextBlob(testCase));
  const hits = keywords.filter((kw) => blob.includes(kw)).length;
  const requiredHits = Math.min(2, Math.max(1, Math.ceil(keywords.length * 0.15)));

  return hits >= requiredHits;
};

const hasMeaninglessSteps = (steps) => {
  if (!Array.isArray(steps) || steps.length === 0) {
    return true;
  }

  return steps.some((step) => {
    const trimmed = String(step || '').trim();
    if (trimmed.length < 3) {
      return true;
    }
    return MEANINGLESS_STEP_PATTERNS.some((pattern) => pattern.test(trimmed));
  });
};

/**
 * Detect near-duplicate scenarios by comparing normalized titles + expected results.
 */
const findDuplicateScenarios = (testCases) => {
  const seen = new Set();

  for (const tc of testCases) {
    const key = `${normalize(tc.title)}|${normalize(tc.expectedResult)}`;
    if (seen.has(key)) {
      return true;
    }
    seen.add(key);
  }

  return false;
};

/**
 * Run semantic validation on already Zod-validated AI output.
 */
export const validateSemantics = (requirement, { testCases }) => {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }

  const keywords = extractRequirementKeywords(requirement);
  let unsupportedHits = 0;
  let irrelevantHits = 0;

  for (const testCase of testCases) {
    if (!testCase.title?.trim() || !testCase.expectedResult?.trim()) {
      throw new AppError(
        'The AI returned an invalid test case structure. Please try again.',
        502,
        'AI_INVALID_OUTPUT'
      );
    }

    if (hasMeaninglessSteps(testCase.steps)) {
      throw new AppError(
        'The AI returned an invalid test case structure. Please try again.',
        502,
        'AI_INVALID_OUTPUT'
      );
    }

    if (inventsUnsupportedFeatures(requirement, testCase)) {
      unsupportedHits += 1;
    }

    if (!hasReasonableRelevance(keywords, testCase)) {
      irrelevantHits += 1;
    }
  }

  // Reject if a significant portion invents unsupported features
  if (unsupportedHits >= Math.max(2, Math.ceil(testCases.length * 0.35))) {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }

  // Reject if most cases look unrelated to the requirement
  if (irrelevantHits >= Math.max(2, Math.ceil(testCases.length * 0.5))) {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }

  if (findDuplicateScenarios(testCases)) {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }

  return { testCases };
};

export default validateSemantics;
