import {
  OFFICE_LATITUDE,
  OFFICE_LONGITUDE,
  OFFICE_RADIUS_METERS,
} from '@/constants/office';

/** Haversine distance in meters (matches backend formula). */
export function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getDistanceFromOffice(
  latitude: number,
  longitude: number
): number {
  return getDistanceFromLatLonInMeters(
    latitude,
    longitude,
    OFFICE_LATITUDE,
    OFFICE_LONGITUDE
  );
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

export function isWithinOfficeRadius(
  latitude: number,
  longitude: number
): boolean {
  return (
    getDistanceFromOffice(latitude, longitude) <= OFFICE_RADIUS_METERS
  );
}

export function getAttendanceStatusLabel(
  latitude: number | null,
  longitude: number | null,
  isLoading: boolean
): string {
  if (isLoading || latitude === null || longitude === null) {
    return 'Fetching your location…';
  }

  if (isWithinOfficeRadius(latitude, longitude)) {
    return 'Within office range — ready to register';
  }

  return 'Outside office range';
}
