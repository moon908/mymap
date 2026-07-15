import { RouteResult, TravelMode } from '../types/map';

export const calculateRoute = async (
  start: [number, number], // [lng, lat]
  end: [number, number],   // [lng, lat]
  apiKey: string,
  mode: TravelMode,
  avoidTolls: boolean,
  avoidHighways: boolean
): Promise<RouteResult | null> => {
  if (!apiKey || !start || !end) return null;

  // Map TravelMode to TomTom's routing travel modes
  let tomtomMode = 'car';
  if (mode === 'walking') tomtomMode = 'pedestrian';
  else if (mode === 'cycling') tomtomMode = 'bicycle';
  else if (mode === 'transit') tomtomMode = 'bus'; // Use bus as transit fallback

  const startStr = `${start[1]},${start[0]}`; // lat,lng
  const endStr = `${end[1]},${end[0]}`;     // lat,lng

  let url = `https://api.tomtom.com/routing/1/calculateRoute/${startStr}:${endStr}/json?key=${apiKey}&travelMode=${tomtomMode}&routeType=fastest`;

  const avoids: string[] = [];
  if (avoidTolls) avoids.push('tollRoads');
  if (avoidHighways) avoids.push('motorways');

  if (avoids.length > 0) {
    url += `&avoid=${avoids.join(',')}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Routing calculation failed');
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const summary = route.summary;
      
      // TomTom returns path points as { latitude, longitude }
      const points = route.legs?.[0]?.points || [];
      const coordinates = points.map((p: any) => [p.longitude, p.latitude] as [number, number]);

      // Mock elevation profile data based on route points length
      const elevation = coordinates.map((_coord: [number, number], idx: number) => {
        // Generate a smooth simulated elevation profile (e.g. standard hill)
        return 100 + Math.sin(idx / 10) * 45 + Math.cos(idx / 25) * 15;
      });

      return {
        distance: summary.lengthInMeters,
        duration: summary.travelTimeInSeconds,
        coordinates,
        elevation,
      };
    }

    return null;
  } catch (error) {
    console.error('Routing API error:', error);
    return null;
  }
};
