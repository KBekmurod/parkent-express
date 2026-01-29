import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/common/EmptyState';
import { Store } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array} props.vendors - Array of vendors
 * @param {Function} props.onToggleStatus - Callback to toggle vendor status
 */
export default function VendorList({ vendors, onToggleStatus }) {
  if (!vendors || vendors.length === 0) {
    return <EmptyState message="No vendors found" icon={Store} />;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id}>
              <TableCell>
                <Link
                  href={`/dashboard/vendors/${vendor.id}`}
                  className="hover:underline font-medium"
                >
                  {vendor.name}
                </Link>
              </TableCell>
              <TableCell className="max-w-xs truncate">{vendor.address}</TableCell>
              <TableCell>{vendor.category || 'Restaurant'}</TableCell>
              <TableCell>
                <Badge variant={vendor.is_active ? "default" : "secondary"}>
                  {vendor.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>{vendor.products_count || 0}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleStatus && onToggleStatus(vendor.id, !vendor.is_active)}
                >
                  {vendor.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
