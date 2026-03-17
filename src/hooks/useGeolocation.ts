/**
 * Geolocation hook — DISABLED.
 *
 * AidLine operates without location tracking. This hook is retained as a no-op
 * so that any remaining import references compile without errors, but it will
 * never request or expose GPS coordinates.
 */

export const useGeolocation = () => {
  return {
    position:        null,
    loading:         false,
    error:           null,
    requestLocation: () => {},
  };
};
