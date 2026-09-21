import apiClient from './apiClient';

export async function getRequirements(userId) {
  const res = await apiClient.get('/requirements', { params: { userId } });
  return res.data.data;
}

export async function getRequirement(userId, requirementId) {
  const res = await apiClient.get(`/requirements/${requirementId}`, {
    params: { userId },
  });
  return res.data.data;
}

export async function deleteRequirement(userId, requirementId) {
  const res = await apiClient.delete(`/requirements/${requirementId}`, {
    params: { userId },
  });
  return res.data.data;
}
