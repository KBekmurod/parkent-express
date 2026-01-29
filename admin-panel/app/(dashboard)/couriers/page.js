'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CourierList from '@/components/couriers/CourierList';
import CourierMap from '@/components/couriers/CourierMap';
import Loading from '@/components/common/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';
import useCouriers from '@/hooks/useCouriers';

export default function CouriersPage() {
  const { couriers, loading, error, toggleCourierStatus } = useCouriers();

  const handleToggleStatus = async (courierId, isActive) => {
    await toggleCourierStatus(courierId, isActive);
  };

  const onlineCouriers = couriers?.filter((c) => c.is_online) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Couriers</h1>
          <p className="text-gray-600 mt-1">
            Manage couriers ({onlineCouriers.length} online)
          </p>
        </div>
        <Link href="/dashboard/couriers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Register Courier
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Courier Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <CourierMap couriers={couriers} />
        </CardContent>
      </Card>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}
      
      {!loading && !error && (
        <CourierList couriers={couriers} onToggleStatus={handleToggleStatus} />
      )}
    </div>
  );
}
