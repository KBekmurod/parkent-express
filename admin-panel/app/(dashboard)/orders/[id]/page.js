'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bike, X } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectItem } from '@/components/ui/select';
import OrderDetails from '@/components/orders/OrderDetails';
import Loading from '@/components/common/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';
import useRealtime from '@/hooks/useRealtime';

export default function OrderDetailPage({ params }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
    fetchCouriers();
  }, [params.id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/orders/${params.id}`);
      setOrder(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCouriers = async () => {
    try {
      const response = await api.get('/api/couriers?is_active=true');
      setCouriers(response.data || []);
    } catch (err) {
      console.error('Failed to fetch couriers:', err);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    if (updatedOrder.id === order?.id) {
      setOrder(updatedOrder);
    }
  };

  useRealtime('order_updated', handleOrderUpdate);

  const handleAssignCourier = async () => {
    if (!selectedCourier) return;

    setActionLoading(true);
    try {
      await api.put(`/api/orders/${params.id}`, {
        courier_id: selectedCourier,
        status: 'picked_up',
      });
      fetchOrderDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign courier');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setActionLoading(true);
    try {
      await api.put(`/api/orders/${params.id}`, {
        status: 'cancelled',
        cancellation_reason: 'Cancelled by admin',
      });
      fetchOrderDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!order) {
    return <ErrorMessage message="Order not found" />;
  }

  const availableCouriers = couriers.filter((c) => c.is_active && c.is_online);
  const canAssignCourier = order.status === 'ready' && !order.courier_id;
  const canCancel = !['delivered', 'cancelled'].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.id}</h1>
            <p className="text-gray-600 mt-1">Order details and actions</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <OrderDetails order={order} />
        </div>

        <div className="space-y-4">
          {canAssignCourier && availableCouriers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bike className="h-5 w-5 mr-2" />
                  Assign Courier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                >
                  <SelectItem value="">Select Courier</SelectItem>
                  {availableCouriers.map((courier) => (
                    <SelectItem key={courier.id} value={courier.id}>
                      {courier.name} - {courier.phone}
                    </SelectItem>
                  ))}
                </Select>
                <Button
                  className="w-full"
                  onClick={handleAssignCourier}
                  disabled={!selectedCourier || actionLoading}
                >
                  Assign Courier
                </Button>
              </CardContent>
            </Card>
          )}

          {canCancel && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-2" />
                  Cancel Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                >
                  Cancel Order
                </Button>
              </CardContent>
            </Card>
          )}

          {order.courier && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Real-time tracking feature coming soon
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
