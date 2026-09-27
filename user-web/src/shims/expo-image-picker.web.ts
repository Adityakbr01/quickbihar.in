export const MediaTypeOptions = {
  All: 'All',
  Videos: 'Videos',
  Images: 'Images',
};

export type ImagePickerAsset = {
  uri: string;
  width?: number;
  height?: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
};

export type ImagePickerResult = {
  canceled: boolean;
  assets: ImagePickerAsset[];
};

export async function requestMediaLibraryPermissionsAsync() {
  return { status: 'granted' };
}

export async function requestCameraPermissionsAsync() {
  return { status: 'granted' };
}

export async function launchImageLibraryAsync(_options?: any): Promise<ImagePickerResult> {
  return { canceled: true, assets: [] };
}

export async function launchCameraAsync(_options?: any): Promise<ImagePickerResult> {
  return { canceled: true, assets: [] };
}

export default {
  MediaTypeOptions,
  requestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync,
  launchImageLibraryAsync,
  launchCameraAsync,
};
