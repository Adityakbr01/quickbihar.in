export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export type LocationObject = {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
};

export type LocationSubscription = {
  remove: () => void;
};

export async function hasServicesEnabledAsync(): Promise<boolean> {
  return true;
}

export async function requestForegroundPermissionsAsync() {
  return { status: 'granted' };
}

export async function getCurrentPositionAsync(_options?: any): Promise<LocationObject> {
  return {
    coords: {
      latitude: 25.5941,
      longitude: 85.1376,
      altitude: 0,
      accuracy: 10,
      altitudeAccuracy: 10,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  };
}

export async function getLastKnownPositionAsync(_options?: any): Promise<LocationObject> {
  return getCurrentPositionAsync();
}

export async function watchPositionAsync(_options: any, callback: (location: LocationObject) => void): Promise<LocationSubscription> {
  const interval = setInterval(async () => {
    const loc = await getCurrentPositionAsync();
    callback(loc);
  }, 5000);

  return {
    remove: () => clearInterval(interval),
  };
}

export async function reverseGeocodeAsync(_location?: any, _options?: any): Promise<any[]> {
  return [
    {
      city: 'Patna',
      district: 'Patna',
      region: 'Bihar',
      country: 'India',
      postalCode: '800001',
      name: 'Patna',
      street: '',
      subregion: '',
    },
  ];
}

export default {
  Accuracy,
  hasServicesEnabledAsync,
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  getLastKnownPositionAsync,
  watchPositionAsync,
  reverseGeocodeAsync,
};
