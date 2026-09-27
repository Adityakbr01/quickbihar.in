/**
 * Haversine formula to calculate the distance between two points on Earth
 * returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Estimates travel time in minutes based on distance
 * @param distanceKm Distance in kilometers
 * @param averageSpeedKmh Average speed in km/h (default 20 for bike/scooter)
 */
export const calculateETA = (
  distanceKm: number,
  averageSpeedKmh: number = 20
): number => {
  if (distanceKm <= 0) return 0;
  
  // Basic calculation: time = distance / speed
  const timeHours = distanceKm / averageSpeedKmh;
  const timeMinutes = timeHours * 60;
  
  // Add a "traffic factor" or "buffer" for high accuracy feel (e.g. 20% extra)
  const bufferedMinutes = timeMinutes * 1.2;
  
  // Round to nearest minute, minimum 1 minute if distance > 0
  return Math.max(1, Math.round(bufferedMinutes));
};

/**
 * Calculates heading (bearing) Between two points
 */
export const calculateHeading = (
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number }
): number => {
    const lat1 = (start.latitude * Math.PI) / 180;
    const lat2 = (end.latitude * Math.PI) / 180;
    const dLon = ((end.longitude - start.longitude) * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
};

/**
 * Formats distance for display
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
};
