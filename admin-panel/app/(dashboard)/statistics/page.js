'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import StatsCards from '@/components/charts/StatsCards';
import OrdersChart from '@/components/charts/OrdersChart';
import RevenueChart from '@/components/charts/RevenueChart';
import Loading from '@/components/common/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';
import { ShoppingBag, DollarSign, TrendingUp, Users } from 'lucide-react';

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [ordersData, setOrdersData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    setDateFrom(weekAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchStatistics();
    }
  }, [dateFrom, dateTo]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      const [statsRes, ordersRes, revenueRes] = await Promise.all([
        api.get('/api/statistics/overview', {
          params: { date_from: dateFrom, date_to: dateTo },
        }),
        api.get('/api/statistics/orders-chart', {
          params: { date_from: dateFrom, date_to: dateTo },
        }),
        api.get('/api/statistics/revenue-chart', {
          params: { date_from: dateFrom, date_to: dateTo },
        }),
      ]);

      setStats(statsRes.data || {});
      setOrdersData(ordersRes.data || []);
      setRevenueData(revenueRes.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const statsData = stats ? [
    {
      title: 'Total Orders',
      value: stats.total_orders || 0,
      icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,
      iconBg: 'bg-blue-100',
      description: `${stats.completed_orders || 0} completed`,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.total_revenue || 0),
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      iconBg: 'bg-green-100',
      change: stats.revenue_change,
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(stats.average_order_value || 0),
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      iconBg: 'bg-purple-100',
    },
    {
      title: 'Total Customers',
      value: stats.total_customers || 0,
      icon: <Users className="h-5 w-5 text-orange-600" />,
      iconBg: 'bg-orange-100',
      description: `${stats.new_customers || 0} new`,
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-gray-600 mt-1">View performance metrics and analytics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchStatistics} disabled={loading}>
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}
      
      {!loading && !error && (
        <>
          <StatsCards stats={statsData} />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Orders Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <OrdersChart data={ordersData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={revenueData} />
              </CardContent>
            </Card>
          </div>

          {stats.top_products && stats.top_products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.top_products.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <span className="font-bold text-gray-400 mr-3">{index + 1}</span>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {product.orders_count} orders
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(product.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
