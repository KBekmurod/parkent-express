'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ProductList from '@/components/vendors/ProductList';
import OrderList from '@/components/orders/OrderList';
import StatsCards from '@/components/charts/StatsCards';
import Loading from '@/components/common/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';
import { formatPhoneNumber, formatCurrency } from '@/lib/utils';
import { Store, Package, ShoppingBag } from 'lucide-react';

export default function VendorDetailPage({ params }) {
  const router = useRouter();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVendorData();
  }, [params.id]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      
      const [vendorRes, productsRes, ordersRes, statsRes] = await Promise.all([
        api.get(`/api/vendors/${params.id}`),
        api.get(`/api/vendors/${params.id}/products`),
        api.get(`/api/orders?vendor_id=${params.id}&limit=10`),
        api.get(`/api/vendors/${params.id}/stats`),
      ]);

      setVendor(vendorRes.data);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data.orders || ordersRes.data || []);
      setStats(statsRes.data || {});
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vendor data');
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

  if (!vendor) {
    return <ErrorMessage message="Vendor not found" />;
  }

  const statsData = [
    {
      title: 'Total Products',
      value: stats.total_products || products.length,
      icon: <Package className="h-5 w-5 text-blue-600" />,
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Total Orders',
      value: stats.total_orders || 0,
      icon: <ShoppingBag className="h-5 w-5 text-green-600" />,
      iconBg: 'bg-green-100',
    },
    {
      title: 'Revenue',
      value: formatCurrency(stats.revenue || 0),
      icon: <Store className="h-5 w-5 text-purple-600" />,
      iconBg: 'bg-purple-100',
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
            <h1 className="text-3xl font-bold">{vendor.name}</h1>
            <p className="text-gray-600 mt-1">Vendor details and management</p>
          </div>
        </div>
        <Badge variant={vendor.is_active ? "default" : "secondary"}>
          {vendor.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{formatPhoneNumber(vendor.phone)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Category</p>
            <p className="font-medium">{vendor.category || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium">{vendor.address}</p>
          </div>
          {vendor.description && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium">{vendor.description}</p>
            </div>
          )}
          {vendor.working_hours_start && vendor.working_hours_end && (
            <div>
              <p className="text-sm text-gray-500">Working Hours</p>
              <p className="font-medium">
                {vendor.working_hours_start} - {vendor.working_hours_end}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <StatsCards stats={statsData} />

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductList products={products} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderList orders={orders} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
