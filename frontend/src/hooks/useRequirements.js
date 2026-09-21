import { useState, useCallback } from 'react';
import { getRequirements, deleteRequirement as deleteReq } from '../api/requirementApi';
import { getErrorMessage } from '../utils/errorHandler';

function useRequirements(userId) {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getRequirements(userId);
      setRequirements(data.requirements || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const remove = useCallback(
    async (requirementId) => {
      await deleteReq(userId, requirementId);
      setRequirements((prev) => prev.filter((r) => r.requirementId !== requirementId));
    },
    [userId]
  );

  return { requirements, loading, error, load, remove };
}

export default useRequirements;
