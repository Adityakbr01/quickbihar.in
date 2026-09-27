export const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};

export function isErrorWithCode(error: any): boolean {
  return !!error && typeof error === 'object' && 'code' in error;
}

export const GoogleSignin = {
  configure: (_options?: any) => {},
  hasPlayServices: async (_options?: any) => true,
  signIn: async () => ({ data: { idToken: '' } }),
  signOut: async () => {},
  isSignedIn: async () => false,
  hasPreviousSignIn: () => false,
  getCurrentUser: () => null,
};

export default GoogleSignin;
