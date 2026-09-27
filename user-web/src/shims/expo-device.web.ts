export const isDevice = true;
export const brand = 'Web';
export const modelName = typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser';
export const osName = 'Web';
export const osVersion = '1.0';
export const deviceType = 1;

export default {
  isDevice,
  brand,
  modelName,
  osName,
  osVersion,
  deviceType,
};
