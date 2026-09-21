/**
 * JSON Schema for Gemini structured output.
 * Kept intentionally simple — Gemini supports a subset of JSON Schema.
 */
export const testCaseResponseJsonSchema = {
  type: 'object',
  properties: {
    testCases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          testCaseId: {
            type: 'string',
          },
          title: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          type: {
            type: 'string',
            enum: ['positive', 'negative', 'validation', 'edge'],
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
          },
          preconditions: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          steps: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          testData: {
            type: 'object',
            additionalProperties: true,
          },
          expectedResult: {
            type: 'string',
          },
        },
        required: [
          'testCaseId',
          'title',
          'description',
          'type',
          'priority',
          'preconditions',
          'steps',
          'testData',
          'expectedResult',
        ],
      },
    },
  },
  required: ['testCases'],
};

export default testCaseResponseJsonSchema;
