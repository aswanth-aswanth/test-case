import mongoose from 'mongoose';

const requirementItemSchema = new mongoose.Schema(
  {
    requirementId: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const requirementSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    requirements: {
      type: [requirementItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Requirement = mongoose.model('Requirement', requirementSchema);

export default Requirement;
