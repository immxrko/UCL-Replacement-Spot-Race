type UmamiPayload = Record<string, string | number | boolean | null>;

interface UmamiApi {
  track: (eventName: string, payload?: UmamiPayload) => void;
}

const getUmami = (): UmamiApi | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const win = window as Window & { umami?: UmamiApi };
  return win.umami;
};

export const trackUmamiEvent = (eventName: string, payload?: UmamiPayload) => {
  getUmami()?.track(eventName, payload);
};
