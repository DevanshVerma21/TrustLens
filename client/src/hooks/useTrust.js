import { useState, useEffect } from 'react';
import { trustAPI } from '../utils/api';

/**
 * Custom hook for trust score data
 */
export const useTrust = () => {
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [factors, setFactors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrustData();

    const handleUpdate = () => {
      fetchTrustData();
    };

    window.addEventListener('trustScoreUpdated', handleUpdate);
    return () => {
      window.removeEventListener('trustScoreUpdated', handleUpdate);
    };
  }, []);

  const fetchTrustData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [scoreData, historyData, factorsData] = await Promise.all([
        trustAPI.getScore(),
        trustAPI.getHistory(),
        trustAPI.getFactors(),
      ]);

      const scorePayload = scoreData?.data || scoreData;
      const historyPayload = historyData?.data || historyData;
      const factorsPayload = factorsData?.data || factorsData;

      setScore({
        score: scorePayload?.trustScore ?? scorePayload?.score ?? 0,
        riskLevel: scorePayload?.riskLevel,
        lastUpdated: scorePayload?.lastUpdated,
      });
      setHistory(historyPayload?.history || []);
      setFactors(factorsPayload?.factors || []);
      setSummary(factorsPayload?.summary || null);
    } catch (err) {
      setError(err.message || 'Failed to fetch trust data');
      console.error('Trust data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const syncAndRefetch = () => {
    window.dispatchEvent(new Event('trustScoreUpdated'));
  };

  const getRiskLevel = (trustScore) => {
    if (trustScore >= 75) return 'low';
    if (trustScore >= 50) return 'medium';
    return 'high';
  };

  const getRiskColor = (trustScore) => {
    if (trustScore >= 75) return '#16A34A'; // green
    if (trustScore >= 50) return '#D97706'; // amber
    return '#DC2626'; // red
  };

  const getRiskLabel = (trustScore) => {
    if (trustScore >= 75) return 'Excellent';
    if (trustScore >= 50) return 'Fair';
    return 'At Risk';
  };

  return {
    score,
    history,
    factors,
    summary,
    loading,
    error,
    refetch: syncAndRefetch,
    getRiskLevel,
    getRiskColor,
    getRiskLabel,
  };
};

export default useTrust;
