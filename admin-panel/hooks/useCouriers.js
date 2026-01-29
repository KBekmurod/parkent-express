'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import useRealtime from './useRealtime';

export default function useCouriers() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCouriers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/couriers');
      setCouriers(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch couriers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  const handleCourierUpdate = useCallback((updatedCourier) => {
    setCouriers((prev) =>
      prev.map((courier) =>
        courier.id === updatedCourier.id
          ? { ...courier, ...updatedCourier }
          : courier
      )
    );
  }, []);

  const handleLocationUpdate = useCallback(({ courier_id, location }) => {
    setCouriers((prev) =>
      prev.map((courier) =>
        courier.id === courier_id
          ? { ...courier, current_location: location }
          : courier
      )
    );
  }, []);

  useRealtime('courier_updated', handleCourierUpdate);
  useRealtime('courier_location', handleLocationUpdate);

  const createCourier = async (data) => {
    try {
      const response = await api.post('/api/couriers', data);
      setCouriers((prev) => [...prev, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to register courier',
      };
    }
  };

  const updateCourier = async (courierId, data) => {
    try {
      const response = await api.put(`/api/couriers/${courierId}`, data);
      setCouriers((prev) =>
        prev.map((courier) =>
          courier.id === courierId ? response.data : courier
        )
      );
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to update courier',
      };
    }
  };

  const toggleCourierStatus = async (courierId, isActive) => {
    return updateCourier(courierId, { is_active: isActive });
  };

  return {
    couriers,
    loading,
    error,
    refetch: fetchCouriers,
    createCourier,
    updateCourier,
    toggleCourierStatus,
  };
}
