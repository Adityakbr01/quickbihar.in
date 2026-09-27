export const NativeModulesProxy = {};
export const requireNativeModule = (_moduleName: string) => ({});
export const requireOptionalNativeModule = (_moduleName: string) => null;

export default {
  NativeModulesProxy,
  requireNativeModule,
  requireOptionalNativeModule,
};
