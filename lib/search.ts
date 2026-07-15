export interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'poi' | 'address' | 'geography';
  category?: string;
}

export const searchAddressOrPoi = async (
  query: string,
  apiKey: string,
  lat?: number,
  lng?: number
): Promise<SearchResult[]> => {
  if (!apiKey || !query.trim()) return [];

  let url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${apiKey}&limit=8&typeahead=false`;
  
  if (lat !== undefined && lng !== undefined) {
    url += `&lat=${lat}&lon=${lng}&radius=20000`; // Bias results within 20km
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Search request failed');
    const data = await res.json();
    
    return (data.results || []).map((item: any) => {
      const poiName = item.poi?.name;
      const addressLabel = item.address?.freeformAddress || '';
      
      return {
        id: item.id || Math.random().toString(),
        name: poiName || item.address?.municipality || addressLabel,
        address: addressLabel,
        lat: item.position.lat,
        lng: item.position.lon,
        type: item.type === 'POI' ? 'poi' : item.type === 'Geography' ? 'geography' : 'address',
        category: item.poi?.classifications?.[0]?.code || undefined,
      };
    });
  } catch (error) {
    console.error('Search API error:', error);
    return [];
  }
};

export const getAutocompleteSuggestions = async (
  query: string,
  apiKey: string,
  lat?: number,
  lng?: number
): Promise<SearchResult[]> => {
  if (!apiKey || !query.trim() || query.length < 2) return [];

  let url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${apiKey}&limit=5&typeahead=true`;
  
  if (lat !== undefined && lng !== undefined) {
    url += `&lat=${lat}&lon=${lng}&radius=50000`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Autocomplete request failed');
    const data = await res.json();
    
    return (data.results || []).map((item: any) => {
      const poiName = item.poi?.name;
      const addressLabel = item.address?.freeformAddress || '';
      return {
        id: item.id || Math.random().toString(),
        name: poiName || item.address?.municipality || addressLabel,
        address: addressLabel,
        lat: item.position.lat,
        lng: item.position.lon,
        type: item.type === 'POI' ? 'poi' : item.type === 'Geography' ? 'geography' : 'address',
      };
    });
  } catch (error) {
    console.error('Autocomplete API error:', error);
    return [];
  }
};
