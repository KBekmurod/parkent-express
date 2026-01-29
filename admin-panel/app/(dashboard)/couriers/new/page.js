'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CourierForm from '@/components/couriers/CourierForm';
import useCouriers from '@/hooks/useCouriers';

export default function NewCourierPage() {
  const router = useRouter();
  const { createCourier } = useCouriers();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    const result = await createCourier(data);
    
    if (result.success) {
      alert('Courier registered successfully!');
      router.push('/dashboard/couriers');
    } else {
      alert(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Register New Courier</h1>
          <p className="text-gray-600 mt-1">Add a new courier to the system</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Courier Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CourierForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
