'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VendorForm from '@/components/vendors/VendorForm';
import useVendors from '@/hooks/useVendors';

export default function NewVendorPage() {
  const router = useRouter();
  const { createVendor } = useVendors();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    const result = await createVendor(data);
    
    if (result.success) {
      alert('Vendor created successfully!');
      router.push('/dashboard/vendors');
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
          <h1 className="text-3xl font-bold">Add New Vendor</h1>
          <p className="text-gray-600 mt-1">Create a new vendor account</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
