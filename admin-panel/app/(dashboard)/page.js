'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, Store, Bike } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import StatsCards from '@/components/charts/StatsCards';
import RevenueChart from '@/components/charts/RevenueChart';
import OrderList from '@/components/orders/OrderList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Loading from '@/components/common/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';
import useRealtime from '@/hooks/useRealtime';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, ordersRes, chartRes] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/orders?limit=10'),
        api.get('/api/dashboard/chart?period=7days'),
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.orders || ordersRes.data);
      setChartData(chartRes.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleNewOrder = () => {
    fetchDashboardData();
  };

  useRealtime('new_order', handleNewOrder);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const statsData = [
    {
      title: 'Orders Today',
      value: stats?.orders_today || 0,
      icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,
      iconBg: 'bg-blue-100',
      change: stats?.orders_change,
    },
    {
      title: 'Revenue',
      value: formatCurrency(stats?.revenue || 0),
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      iconBg: 'bg-green-100',
      change: stats?.revenue_change,
    },
    {
      title: 'Active Vendors',
      value: stats?.active_vendors || 0,
      icon: <Store className="h-5 w-5 text-purple-600" />,
      iconBg: 'bg-purple-100',
    },
    {
      title: 'Active Couriers',
      value: stats?.active_couriers || 0,
      icon: <Bike className="h-5 w-5 text-orange-600" />,
      iconBg: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to Parkent Express Admin Panel</p>
      </div>

      <StatsCards stats={statsData} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Chart (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.top_vendors && stats.top_vendors.length > 0 ? (
              <div className="space-y-3">
                {stats.top_vendors.slice(0, 5).map((vendor, index) => (
                  <div key={vendor.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-bold text-gray-400 mr-3">{index + 1}</span>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-gray-500">{vendor.orders_count} orders</p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(vendor.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderList orders={recentOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
