import mongoose from 'mongoose';
import env from './env.js';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongodbUri);

  console.log('MongoDB connected');
};

export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState] || 'unknown';
};
