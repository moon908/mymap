export interface TrafficIncident {
  id: string;
  roadName: string;
  from: string;
  to: string;
  eventText: string;
  delay: number; // in seconds
  length: number; // in meters
  magnitude: number; // 0: unknown, 1: minor, 2: moderate, 3: major, 4: block
  iconCategory: number;
  iconName: string;
  coordinates: [number, number]; // [lng, lat]
}

export const fetchTrafficIncidents = async (
  bbox: [number, number, number, number], // [minLon, minLat, maxLon, maxLat]
  apiKey: string
): Promise<TrafficIncident[]> => {
  if (!apiKey || !bbox) return [];

  const [minLon, minLat, maxLon, maxLat] = bbox;
  // Let's cap the bbox size to prevent API errors (must be <= 10000 km2, roughly 1 deg x 1 deg)
  const lonDiff = Math.abs(maxLon - minLon);
  const latDiff = Math.abs(maxLat - minLat);
  
  // If viewport is too large, just fetch incidents around the center to keep it responsive and avoid 400 errors
  let queryBbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  if (lonDiff > 2 || latDiff > 2) {
    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;
    queryBbox = `${centerLon - 0.5},${centerLat - 0.5},${centerLon + 0.5},${centerLat + 0.5}`;
  }

  // Fields we want from TomTom incidentDetails API
  const fields = '{incidents{type,properties{id,iconCategory,magnitude,delay,iconCategoryName,roadName,from,to,length,eventText},geometry{type,coordinates}}}';
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${queryBbox}&fields=${encodeURIComponent(fields)}&language=en-US`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch traffic incidents');
    const data = await res.json();

    if (!data.incidents || data.incidents.length === 0) return [];

    return data.incidents.map((incident: any) => {
      const props = incident.properties || {};
      const geom = incident.geometry || {};
      
      // Extract coordinates from geometry. Typically Point, but could be LineString.
      let coords: [number, number] = [0, 0];
      if (geom.type === 'Point' && geom.coordinates) {
        coords = [geom.coordinates[0], geom.coordinates[1]];
      } else if (geom.type === 'LineString' && geom.coordinates && geom.coordinates.length > 0) {
        // Use the middle point of the LineString as incident anchor
        const midIdx = Math.floor(geom.coordinates.length / 2);
        coords = [geom.coordinates[midIdx][0], geom.coordinates[midIdx][1]];
      }

      return {
        id: props.id || Math.random().toString(),
        roadName: props.roadName || 'Unknown Road',
        from: props.from || '',
        to: props.to || '',
        eventText: props.eventText || 'Traffic Event',
        delay: props.delay || 0,
        length: props.length || 0,
        magnitude: props.magnitude || 0,
        iconCategory: props.iconCategory || 0,
        iconName: props.iconCategoryName || 'unknown',
        coordinates: coords,
      };
    });
  } catch (error) {
    console.error('Traffic incidents fetch error:', error);
    return [];
  }
};
