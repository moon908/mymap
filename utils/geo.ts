// Geographic measurement utility functions using Haversine and Shoelace formulas

/**
 * Calculates the Haversine distance between two coordinates in meters.
 */
export const getHaversineDistance = (
  coord1: [number, number], // [lng, lat]
  coord2: [number, number]  // [lng, lat]
): number => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // In meters
};

/**
 * Sums the total length of a path of coordinates in meters.
 */
export const getPathLength = (coords: [number, number][]): number => {
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += getHaversineDistance(coords[i], coords[i + 1]);
  }
  return total;
};

/**
 * Calculates the area of a polygon in square meters.
 * Projects coordinates using a simple sinusoidal projection centered on the polygon.
 */
export const getPolygonArea = (coords: [number, number][]): number => {
  if (coords.length < 3) return 0;

  // Find center of polygon to anchor projection
  let sumLat = 0;
  let sumLon = 0;
  const n = coords.length;
  
  coords.forEach(([lon, lat]) => {
    sumLat += lat;
    sumLon += lon;
  });
  const centerLat = sumLat / n;

  // Project coordinates to flat Earth meters (x, y) relative to center
  const R = 6371e3; // Earth radius
  const latRad = (centerLat * Math.PI) / 180;
  
  const projected = coords.map(([lon, lat]) => {
    const x = R * (lon * Math.PI / 180) * Math.cos(latRad);
    const y = R * (lat * Math.PI / 180);
    return [x, y];
  });

  // Calculate area using Shoelace formula
  let area = 0;
  for (let i = 0; i < projected.length; i++) {
    const j = (i + 1) % projected.length;
    area += projected[i][0] * projected[j][1];
    area -= projected[j][0] * projected[i][1];
  }

  return Math.abs(area) / 2; // In square meters
};

/**
 * Generates coordinate points representing a circle on the globe.
 */
export const getCirclePoints = (
  center: [number, number], // [lng, lat]
  radiusInMeters: number,
  pointsCount = 64
): [number, number][] => {
  const [lng, lat] = center;
  const points: [number, number][] = [];
  const R = 6371e3; // Earth radius in meters
  
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const dDivR = radiusInMeters / R;

  for (let i = 0; i < pointsCount; i++) {
    const bearing = (i * 360 / (pointsCount - 1)) * Math.PI / 180;

    const outLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(dDivR) +
        Math.cos(latRad) * Math.sin(dDivR) * Math.cos(bearing)
    );

    const outLngRad =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(dDivR) * Math.cos(latRad),
        Math.cos(dDivR) - Math.sin(latRad) * Math.sin(outLatRad)
      );

    const outLat = (outLatRad * 180) / Math.PI;
    const outLng = (outLngRad * 180) / Math.PI;

    points.push([outLng, outLat]);
  }

  return points;
};
