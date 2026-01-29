import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import OrderStatusBadge from './OrderStatusBadge';
import EmptyState from '@/components/common/EmptyState';

/**
 * @param {Object} props
 * @param {Array} props.orders - Array of orders
 */
export default function OrderList({ orders }) {
  if (!orders || orders.length === 0) {
    return <EmptyState message="No orders found" />;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="cursor-pointer">
              <TableCell>
                <Link href={`/dashboard/orders/${order.id}`} className="hover:underline font-medium">
                  #{order.id}
                </Link>
              </TableCell>
              <TableCell>{order.customer_name || order.customer?.name || 'N/A'}</TableCell>
              <TableCell>{order.vendor_name || order.vendor?.name || 'N/A'}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(order.total_amount)}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDateTime(order.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
