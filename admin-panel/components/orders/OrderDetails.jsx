import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateTime, formatPhoneNumber } from '@/lib/utils';
import OrderStatusBadge from './OrderStatusBadge';

/**
 * @param {Object} props
 * @param {Object} props.order - Order object
 */
export default function OrderDetails({ order }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order #{order.id}</CardTitle>
            <OrderStatusBadge status={order.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">{formatDateTime(order.created_at)}</p>
          </div>
          
          {order.updated_at && (
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">{formatDateTime(order.updated_at)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{order.customer_name || order.customer?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">
              {formatPhoneNumber(order.customer_phone || order.customer?.phone)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Delivery Address</p>
            <p className="font-medium">{order.delivery_address}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{order.vendor_name || order.vendor?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium">{order.vendor?.address || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {order.courier && (
        <Card>
          <CardHeader>
            <CardTitle>Courier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{order.courier.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{formatPhoneNumber(order.courier.phone)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items && order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{item.product_name || item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
            
            <div className="pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(order.total_amount - (order.delivery_fee || 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span>{formatCurrency(order.delivery_fee || 0)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
