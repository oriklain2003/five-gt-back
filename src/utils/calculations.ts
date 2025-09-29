import { Point } from '../models/types';

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Calculate bearing between two points
export const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x);
  return (bearing * 180 / Math.PI + 360) % 360;
};

// Calculate metrics for a course
export const calculateCourseMetrics = (points: Point[]) => {
  if (points.length < 2) {
    return {
      total_distance: 0,
      avg_speed: 0,
      total_speed_changes: 0,
      total_direction_changes: 0,
      total_altitude_changes: 0,
      starting_point: points[0] ? { lat: points[0].lat, lon: points[0].lon } : { lat: 0, lon: 0 },
      ending_point: points[0] ? { lat: points[0].lat, lon: points[0].lon } : { lat: 0, lon: 0 }
    };
  }

  // Sort points by timestamp
  const sortedPoints = [...points].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  let totalDistance = 0;
  let totalAltitudeChanges = 0;
  let speedChanges = 0;
  let directionChanges = 0;
  
  let previousSpeed = 0;
  let previousBearing = 0;
  
  for (let i = 1; i < sortedPoints.length; i++) {
    const prev = sortedPoints[i - 1];
    const curr = sortedPoints[i];
    
    // Distance calculation
    const segmentDistance = calculateDistance(prev.lat, prev.lon, curr.lat, curr.lon);
    totalDistance += segmentDistance;
    
    // Altitude changes
    totalAltitudeChanges += Math.abs(curr.altitude - prev.altitude);
    
    // Time difference in seconds
    const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;
    
    // Speed calculation (m/s)
    const speed = timeDiff > 0 ? segmentDistance / timeDiff : 0;
    
    // Speed changes (if speed difference is more than 1 m/s)
    if (i > 1 && Math.abs(speed - previousSpeed) > 1) {
      speedChanges++;
    }
    
    // Direction changes
    const bearing = calculateBearing(prev.lat, prev.lon, curr.lat, curr.lon);
    if (i > 1) {
      let bearingDiff = Math.abs(bearing - previousBearing);
      if (bearingDiff > 180) {
        bearingDiff = 360 - bearingDiff;
      }
      // Count as direction change if bearing changes more than 15 degrees
      if (bearingDiff > 15) {
        directionChanges++;
      }
    }
    
    previousSpeed = speed;
    previousBearing = bearing;
  }
  
  // Calculate average speed
  const totalTime = (sortedPoints[sortedPoints.length - 1].timestamp.getTime() - sortedPoints[0].timestamp.getTime()) / 1000;
  const avgSpeed = totalTime > 0 ? totalDistance / totalTime : 0;
  
  return {
    total_distance: Math.round(totalDistance * 100) / 100,
    avg_speed: Math.round(avgSpeed * 100) / 100,
    total_speed_changes: speedChanges,
    total_direction_changes: directionChanges,
    total_altitude_changes: Math.round(totalAltitudeChanges * 100) / 100,
    starting_point: { lat: sortedPoints[0].lat, lon: sortedPoints[0].lon },
    ending_point: { lat: sortedPoints[sortedPoints.length - 1].lat, lon: sortedPoints[sortedPoints.length - 1].lon }
  };
};
