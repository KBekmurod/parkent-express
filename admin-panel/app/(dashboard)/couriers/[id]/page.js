'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Bike } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import OrderList from '@/components/orders/OrderList';
import StatsCards from '@/components/charts/StatsCards';
import Loading from '@/components/common/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';
import { formatPhoneNumber, formatCurrency } from '@/lib/utils';
import { ShoppingBag, DollarSign } from 'lucide-react';

export default function CourierDetailPage({ params }) {
  const router = useRouter();
  const [courier, setCourier] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourierData();
  }, [params.id]);

  const fetchCourierData = async () => {
    try {
      setLoading(true);
      
      const [courierRes, ordersRes, statsRes] = await Promise.all([
        api.get(`/api/couriers/${params.id}`),
        api.get(`/api/orders?courier_id=${params.id}&limit=10`),
        api.get(`/api/couriers/${params.id}/stats`),
      ]);

      setCourier(courierRes.data);
      setOrders(ordersRes.data.orders || ordersRes.data || []);
      setStats(statsRes.data || {});
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courier data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!courier) {
    return <ErrorMessage message="Courier not found" />;
  }

  const statsData = [
    {
      title: 'Total Deliveries',
      value: stats.total_deliveries || courier.completed_orders || 0,
      icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Earnings',
      value: formatCurrency(stats.earnings || 0),
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      iconBg: 'bg-green-100',
    },
    {
      title: 'Active Orders',
      value: stats.active_orders || 0,
      icon: <Bike className="h-5 w-5 text-orange-600" />,
      iconBg: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{courier.name}</h1>
            <p className="text-gray-600 mt-1">Courier details and statistics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={courier.is_active ? "default" : "secondary"}>
            {courier.is_active ? 'Active' : 'Inactive'}
          </Badge>
          {courier.is_online && (
            <Badge className="bg-green-100 text-green-800">Online</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Courier Information</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{formatPhoneNumber(courier.phone)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telegram ID</p>
            <p className="font-medium">{courier.telegram_id}</p>
          </div>
          {courier.vehicle_type && (
            <div>
              <p className="text-sm text-gray-500">Vehicle Type</p>
              <p className="font-medium">{courier.vehicle_type}</p>
            </div>
          )}
          {courier.vehicle_number && (
            <div>
              <p className="text-sm text-gray-500">Vehicle Number</p>
              <p className="font-medium">{courier.vehicle_number}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{courier.status || 'Available'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Location</p>
            <p className="font-medium">
              {courier.current_location
                ? `${courier.current_location.latitude}, ${courier.current_location.longitude}`
                : 'Not available'}
            </p>
          </div>
        </CardContent>
      </Card>

      <StatsCards stats={statsData} />

      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderList orders={orders} />
        </CardContent>
      </Card>
    </div>
  );
}
