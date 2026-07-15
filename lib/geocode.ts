export const reverseGeocode = async (
  lat: number,
  lng: number,
  apiKey: string
): Promise<string> => {
  if (!apiKey) return '';

  const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Reverse geocode failed');
    const data = await res.json();
    
    if (data.addresses && data.addresses.length > 0) {
      return data.addresses[0].address.freeformAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch (error) {
    console.error('Reverse Geocoding error:', error);
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};
