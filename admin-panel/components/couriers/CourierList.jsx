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
import { formatPhoneNumber } from '@/lib/utils';
import EmptyState from '@/components/common/EmptyState';
import { Bike } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array} props.couriers - Array of couriers
 * @param {Function} props.onToggleStatus - Callback to toggle courier status
 */
export default function CourierList({ couriers, onToggleStatus }) {
  if (!couriers || couriers.length === 0) {
    return <EmptyState message="No couriers found" icon={Bike} />;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Online</TableHead>
            <TableHead>Deliveries</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {couriers.map((courier) => (
            <TableRow key={courier.id}>
              <TableCell>
                <Link
                  href={`/dashboard/couriers/${courier.id}`}
                  className="hover:underline font-medium"
                >
                  {courier.name}
                </Link>
              </TableCell>
              <TableCell>{formatPhoneNumber(courier.phone)}</TableCell>
              <TableCell>
                <Badge variant={courier.is_active ? "default" : "secondary"}>
                  {courier.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                {courier.is_online ? (
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                ) : (
                  <Badge variant="secondary">Offline</Badge>
                )}
              </TableCell>
              <TableCell>{courier.completed_orders || 0}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleStatus && onToggleStatus(courier.id, !courier.is_active)}
                >
                  {courier.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
