import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, MapPin } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Object} props.vendor - Vendor object
 */
export default function VendorCard({ vendor }) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{vendor.name}</h3>
              <p className="text-sm text-gray-500">{vendor.category || 'Restaurant'}</p>
            </div>
          </div>
          <Badge variant={vendor.is_active ? "default" : "secondary"}>
            {vendor.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="truncate">{vendor.address}</span>
          </div>
          
          {vendor.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{vendor.description}</p>
          )}
          
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-gray-500">
              {vendor.products_count || 0} Products
            </span>
            <span className="text-sm font-medium text-green-600">
              {vendor.orders_count || 0} Orders
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
