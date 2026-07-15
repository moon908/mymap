import { TomTomConfig } from '@tomtom-org/maps-sdk/core';

export const initializeTomTom = (apiKey: string) => {
  if (typeof window !== 'undefined' && apiKey) {
    try {
      TomTomConfig.instance.put({ apiKey });
    } catch (error) {
      console.error('Error putting TomTom API Key:', error);
    }
  }
};
