'use client';

import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array} props.couriers - Array of couriers with location data
 */
export default function CourierMap({ couriers }) {
  const mapRef = useRef(null);

  useEffect(() => {
    // Simple map placeholder - in production, integrate with Google Maps or similar
    if (mapRef.current && couriers && couriers.length > 0) {
      // Map initialization would go here
    }
  }, [couriers]);

  const onlineCouriers = couriers?.filter(c => c.is_online && c.current_location) || [];

  return (
    <div className="relative w-full h-96 bg-gray-100 rounded-lg border overflow-hidden">
      <div
        ref={mapRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Map Integration</p>
          <p className="text-sm text-gray-500 mt-1">
            {onlineCouriers.length} courier(s) online
          </p>
        </div>
      </div>
      
      {onlineCouriers.length > 0 && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-xs">
          <h3 className="font-semibold mb-2">Online Couriers</h3>
          <ul className="space-y-1">
            {onlineCouriers.slice(0, 5).map((courier) => (
              <li key={courier.id} className="text-sm flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                {courier.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
