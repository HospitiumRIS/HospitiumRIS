import { useState, useEffect } from 'react';

export const useNetworkData = () => {
  const [networkData, setNetworkData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/network');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch network data: ${response.statusText}`);
        }

        const data = await response.json();
        setNetworkData(data);
      } catch (err) {
        console.error('Error fetching network data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworkData();
  }, []);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/network');
      if (!response.ok) {
        throw new Error(`Failed to fetch network data: ${response.statusText}`);
      }
      const data = await response.json();
      setNetworkData(data);
    } catch (err) {
      console.error('Error refetching network data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { networkData, isLoading, error, refetch };
};
