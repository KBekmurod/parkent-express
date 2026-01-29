'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VendorList from '@/components/vendors/VendorList';
import Loading from '@/components/common/Loading';
import ErrorMessage from '@/components/common/ErrorMessage';
import useVendors from '@/hooks/useVendors';

export default function VendorsPage() {
  const { vendors, loading, error, toggleVendorStatus } = useVendors();

  const handleToggleStatus = async (vendorId, isActive) => {
    await toggleVendorStatus(vendorId, isActive);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-gray-600 mt-1">Manage vendor accounts</p>
        </div>
        <Link href="/dashboard/vendors/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </Link>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}
      
      {!loading && !error && (
        <VendorList vendors={vendors} onToggleStatus={handleToggleStatus} />
      )}
    </div>
  );
}
