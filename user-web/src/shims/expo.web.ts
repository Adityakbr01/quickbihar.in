export async function reloadAppAsync() {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}

export default {
  reloadAppAsync,
};
