import apiClient from './apiClient';

export async function generateTestCases(payload) {
  // payload: { userId, requirement }
  const res = await apiClient.post('/test-cases/generate', payload);
  return res.data.data;
}

export async function saveTestCases(payload) {
  // payload: { userId, requirementId?, requirement, testCases }
  const res = await apiClient.post('/test-cases', payload);
  return res.data.data;
}

export async function getTestCasesForRequirement(userId, requirementId, signal) {
  const res = await apiClient.get(`/requirements/${requirementId}/test-cases`, {
    params: { userId },
    signal,
  });
  return res.data.data;
}

export async function updateTestCases(userId, requirementId, testCases) {
  const res = await apiClient.put(`/requirements/${requirementId}/test-cases`, {
    userId,
    testCases,
  });
  return res.data.data;
}
