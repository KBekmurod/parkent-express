import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import OrderStatusBadge from './OrderStatusBadge';

/**
 * @param {Object} props
 * @param {Object} props.order - Order object
 */
export default function OrderCard({ order }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-lg">Order #{order.id}</p>
            <p className="text-sm text-gray-500">{formatDateTime(order.created_at)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        
        <div className="mt-3 space-y-1">
          <p className="text-sm">
            <span className="text-gray-600">Customer:</span>{' '}
            <span className="font-medium">{order.customer_name}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Vendor:</span>{' '}
            <span className="font-medium">{order.vendor_name}</span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Total:</span>{' '}
            <span className="font-bold text-green-600">
              {formatCurrency(order.total_amount)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
