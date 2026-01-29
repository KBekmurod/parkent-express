'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import useRealtime from './useRealtime';

export default function useOrders(filters = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };
      
      const response = await api.get('/api/orders', { params });
      setOrders(response.data.orders || response.data);
      
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleNewOrder = useCallback((order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const handleOrderUpdate = useCallback((updatedOrder) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
      )
    );
  }, []);

  useRealtime('new_order', handleNewOrder);
  useRealtime('order_updated', handleOrderUpdate);

  const updateOrder = async (orderId, data) => {
    try {
      const response = await api.put(`/api/orders/${orderId}`, data);
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? response.data : order))
      );
      return { success: true, data: response.data };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to update order',
      };
    }
  };

  const assignCourier = async (orderId, courierId) => {
    return updateOrder(orderId, { courier_id: courierId, status: 'picked_up' });
  };

  const cancelOrder = async (orderId, reason) => {
    return updateOrder(orderId, { status: 'cancelled', cancellation_reason: reason });
  };

  return {
    orders,
    loading,
    error,
    pagination,
    refetch: fetchOrders,
    updateOrder,
    assignCourier,
    cancelOrder,
    setPage: (page) => setPagination((prev) => ({ ...prev, page })),
  };
}
