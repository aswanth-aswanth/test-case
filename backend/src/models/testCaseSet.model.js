import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    testCaseId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['positive', 'negative', 'validation', 'edge'],
    },
    priority: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    preconditions: {
      type: [String],
      default: [],
    },
    steps: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'Each test case must have at least one step.',
      },
    },
    testData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expectedResult: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const testCaseSetSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    requirementId: {
      type: String,
      required: true,
      trim: true,
    },
    testCases: {
      type: [testCaseSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

testCaseSetSchema.index({ userId: 1, requirementId: 1 }, { unique: true });

const TestCaseSet = mongoose.model('TestCaseSet', testCaseSetSchema);

export default TestCaseSet;
