import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bike, Phone } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils';

/**
 * @param {Object} props
 * @param {Object} props.courier - Courier object
 */
export default function CourierCard({ courier }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg mr-3">
              <Bike className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{courier.name}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="h-3 w-3 mr-1" />
                {formatPhoneNumber(courier.phone)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge variant={courier.is_active ? "default" : "secondary"}>
              {courier.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {courier.is_online && (
              <Badge className="bg-green-100 text-green-800">
                Online
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current Status:</span>
            <span className="font-medium">{courier.status || 'Available'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Deliveries:</span>
            <span className="font-medium text-green-600">
              {courier.completed_orders || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
