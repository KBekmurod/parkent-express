'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OrderList from '@/components/orders/OrderList';
import StatsCards from '@/components/charts/StatsCards';
import Loading from '@/components/common/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';
import { formatPhoneNumber, formatCurrency, formatDateTime } from '@/lib/utils';
import { ShoppingBag, DollarSign, MapPin } from 'lucide-react';

export default function CustomerDetailPage({ params }) {
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomerData();
  }, [params.id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      const [customerRes, ordersRes, statsRes] = await Promise.all([
        api.get(`/api/customers/${params.id}`),
        api.get(`/api/orders?customer_id=${params.id}`),
        api.get(`/api/customers/${params.id}/stats`),
      ]);

      setCustomer(customerRes.data);
      setOrders(ordersRes.data.orders || ordersRes.data || []);
      setStats(statsRes.data || {});
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customer data');
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

  if (!customer) {
    return <ErrorMessage message="Customer not found" />;
  }

  const statsData = [
    {
      title: 'Total Orders',
      value: stats.total_orders || orders.length,
      icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Total Spent',
      value: formatCurrency(stats.total_spent || 0),
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      iconBg: 'bg-green-100',
    },
    {
      title: 'Saved Addresses',
      value: customer.addresses?.length || 0,
      icon: <MapPin className="h-5 w-5 text-purple-600" />,
      iconBg: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{customer.name || 'Customer'}</h1>
          <p className="text-gray-600 mt-1">Customer details and order history</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{customer.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{formatPhoneNumber(customer.phone)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telegram ID</p>
            <p className="font-medium">{customer.telegram_id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="font-medium">{formatDateTime(customer.created_at)}</p>
          </div>
        </CardContent>
      </Card>

      {customer.addresses && customer.addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customer.addresses.map((address, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{address.label || `Address ${index + 1}`}</p>
                  <p className="text-sm text-gray-600">{address.address}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <StatsCards stats={statsData} />

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderList orders={orders} />
        </CardContent>
      </Card>
    </div>
  );
}
