// Geolocation hook removed - AidLine does not collect location data.
// The platform operates through structured request routing rather than geographic proximity.
// This file is kept as a stub for backward compatibility.

export const useGeolocation = () => {
  return {
    position: null,
    loading: false,
    error: 'Geolocation is not used in this platform',
    requestLocation: () => {},
  };
};
