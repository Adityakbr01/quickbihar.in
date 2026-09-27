export async function openBrowserAsync(url: string) {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
  return { type: 'dismiss' };
}

export async function dismissBrowser() {}

export default {
  openBrowserAsync,
  dismissBrowser,
};
