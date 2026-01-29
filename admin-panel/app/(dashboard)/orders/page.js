'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderList from '@/components/orders/OrderList';
import OrderFilters from '@/components/orders/OrderFilters';
import Loading from '@/components/common/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';
import useOrders from '@/hooks/useOrders';

export default function OrdersPage() {
  const [filters, setFilters] = useState({});
  const { orders, loading, error, pagination, setPage } = useOrders(filters);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-600 mt-1">Manage all orders</p>
        </div>
      </div>

      <OrderFilters onFilterChange={handleFilterChange} />

      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}
      
      {!loading && !error && (
        <>
          <OrderList orders={orders} />
          
          {pagination && pagination.total > pagination.limit && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => setPage(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
