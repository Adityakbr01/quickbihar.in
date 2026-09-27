export const Linking = {
  openURL: async (url: string) => {
    if (typeof window !== 'undefined') window.open(url, '_blank');
  },
  canOpenURL: async () => true,
  getInitialURL: async () => (typeof window !== 'undefined' ? window.location.href : null),
  addEventListener: () => ({ remove: () => {} }),
};

export async function openURL(url: string) {
  return Linking.openURL(url);
}

export async function canOpenURL(url: string) {
  return Linking.canOpenURL();
}

export async function getInitialURL() {
  return Linking.getInitialURL();
}

export function addEventListener() {
  return Linking.addEventListener();
}

export default Linking;
