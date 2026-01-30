const { calculateDistance, isWithinRadius } = require('../utils/helpers');
const { PARKENT_BOUNDS } = require('../utils/constants');

class LocationService {
  validateParkentArea(latitude, longitude) {
    const isValid = isWithinRadius(
      PARKENT_BOUNDS.CENTER.LAT,
      PARKENT_BOUNDS.CENTER.LON,
      latitude,
      longitude,
      PARKENT_BOUNDS.MAX_RADIUS_KM
    );
    
    if (!isValid) {
      return {
        isValid: false,
        message: 'Location is outside Parkent delivery area',
        distance: calculateDistance(
          PARKENT_BOUNDS.CENTER.LAT,
          PARKENT_BOUNDS.CENTER.LON,
          latitude,
          longitude
        )
      };
    }
    
    return {
      isValid: true,
      message: 'Location is within Parkent area'
    };
  }
  
  calculateDeliveryDistance(fromLat, fromLon, toLat, toLon) {
    return calculateDistance(fromLat, fromLon, toLat, toLon);
  }
  
  isLocationWithinDeliveryRadius(vendorLat, vendorLon, customerLat, customerLon, radiusKm) {
    return isWithinRadius(vendorLat, vendorLon, customerLat, customerLon, radiusKm);
  }
  
  findNearestLocation(targetLat, targetLon, locations) {
    if (!locations || locations.length === 0) {
      return null;
    }
    
    const locationsWithDistance = locations.map(location => {
      const distance = calculateDistance(
        targetLat,
        targetLon,
        location.latitude || location.lat,
        location.longitude || location.lon
      );
      
      return {
        ...location,
        distance
      };
    });
    
    return locationsWithDistance.sort((a, b) => a.distance - b.distance)[0];
  }
  
  sortByDistance(targetLat, targetLon, locations) {
    const locationsWithDistance = locations.map(location => {
      const coords = location.coordinates || 
                    location.location?.coordinates || 
                    [location.longitude || location.lon, location.latitude || location.lat];
      
      const distance = calculateDistance(
        targetLat,
        targetLon,
        coords[1],
        coords[0]
      );
      
      return {
        ...location,
        distance: parseFloat(distance.toFixed(2))
      };
    });
    
    return locationsWithDistance.sort((a, b) => a.distance - b.distance);
  }
  
  getLocationBounds(centerLat, centerLon, radiusKm) {
    const kmPerDegreeLat = 111;
    const kmPerDegreeLon = 111 * Math.cos(centerLat * Math.PI / 180);
    
    const latOffset = radiusKm / kmPerDegreeLat;
    const lonOffset = radiusKm / kmPerDegreeLon;
    
    return {
      north: centerLat + latOffset,
      south: centerLat - latOffset,
      east: centerLon + lonOffset,
      west: centerLon - lonOffset
    };
  }
  
  isValidCoordinate(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }
  
  parseCoordinates(coordinatesString) {
    try {
      const parts = coordinatesString.split(',').map(s => parseFloat(s.trim()));
      
      if (parts.length !== 2) {
        throw new Error('Invalid format');
      }
      
      const [lat, lon] = parts;
      
      if (!this.isValidCoordinate(lat, lon)) {
        throw new Error('Invalid coordinate values');
      }
      
      return { latitude: lat, longitude: lon };
      
    } catch (error) {
      throw new Error('Failed to parse coordinates. Format: latitude,longitude');
    }
  }
  
  formatCoordinates(latitude, longitude, decimals = 6) {
    return {
      latitude: parseFloat(latitude.toFixed(decimals)),
      longitude: parseFloat(longitude.toFixed(decimals)),
      formatted: `${latitude.toFixed(decimals)}, ${longitude.toFixed(decimals)}`
    };
  }
  
  getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const distanceKm = calculateDistance(lat1, lon1, lat2, lon2);
    return Math.round(distanceKm * 1000);
  }
  
  estimateTravelTime(distanceKm, speedKmh = 30) {
    return Math.ceil((distanceKm / speedKmh) * 60);
  }
}

module.exports = new LocationService();
