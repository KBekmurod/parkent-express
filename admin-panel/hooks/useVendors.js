'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import useRealtime from './useRealtime';

export default function useVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/vendors');
      setVendors(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleVendorUpdate = useCallback((updatedVendor) => {
    setVendors((prev) =>
      prev.map((vendor) =>
        vendor.id === updatedVendor.id ? { ...vendor, ...updatedVendor } : vendor
      )
    );
  }, []);

  useRealtime('vendor_updated', handleVendorUpdate);

  const createVendor = async (data) => {
    try {
      const response = await api.post('/api/vendors', data);
      setVendors((prev) => [...prev, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to create vendor',
      };
    }
  };

  const updateVendor = async (vendorId, data) => {
    try {
      const response = await api.put(`/api/vendors/${vendorId}`, data);
      setVendors((prev) =>
        prev.map((vendor) => (vendor.id === vendorId ? response.data : vendor))
      );
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to update vendor',
      };
    }
  };

  const deleteVendor = async (vendorId) => {
    try {
      await api.delete(`/api/vendors/${vendorId}`);
      setVendors((prev) => prev.filter((vendor) => vendor.id !== vendorId));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to delete vendor',
      };
    }
  };

  const toggleVendorStatus = async (vendorId, isActive) => {
    return updateVendor(vendorId, { is_active: isActive });
  };

  return {
    vendors,
    loading,
    error,
    refetch: fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
    toggleVendorStatus,
  };
}
