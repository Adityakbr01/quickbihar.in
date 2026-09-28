/**
 * Photo picking (web: hidden file input, no native modules).
 *
 * Same result shape the callers already use (`{ canceled, assets }`), so
 * call sites only change their import source. Unlike the old stub (which
 * always returned `canceled: true`), this really opens the file picker.
 * `assets[0].file` carries the real File for FormData uploads, and `uri`
 * is an object URL for instant preview.
 */

export const MediaTypeOptions = {
  All: "All",
  Videos: "Videos",
  Images: "Images",
};

export interface PhotoAsset {
  uri: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
  file?: File;
  width?: number;
  height?: number;
}

export interface PhotoResult {
  canceled: boolean;
  assets: PhotoAsset[];
}

function pickFile(accept: string, capture?: string): Promise<File | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    if (capture) input.setAttribute("capture", capture);
    input.style.display = "none";
    let done = false;
    const finish = (file: File | null) => {
      if (done) return;
      done = true;
      input.remove();
      window.removeEventListener("focus", onWindowFocus);
      resolve(file);
    };
    // Cancelled dialog: the window regains focus with no change event.
    const onWindowFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) finish(null);
      }, 300);
    };
    window.addEventListener("focus", onWindowFocus);
    input.onchange = () => finish(input.files?.[0] ?? null);
    document.body.appendChild(input);
    input.click();
  });
}

function toAsset(file: File): PhotoAsset {
  return {
    uri: URL.createObjectURL(file),
    fileName: file.name,
    fileSize: file.size,
    type: file.type || "image/jpeg",
    file,
  };
}

export async function requestMediaLibraryPermissionsAsync(): Promise<{
  status: "granted" | "denied";
}> {
  // Browsers grant per-pick on file-input open; nothing to pre-request.
  return { status: "granted" };
}

export async function requestCameraPermissionsAsync(): Promise<{
  status: "granted" | "denied";
}> {
  return { status: "granted" };
}

export async function launchImageLibraryAsync(_options?: {
  quality?: number;
  mediaTypes?: unknown;
  allowsEditing?: boolean;
  aspect?: unknown;
}): Promise<PhotoResult> {
  const file = await pickFile("image/*");
  if (!file) return { canceled: true, assets: [] };
  return { canceled: false, assets: [toAsset(file)] };
}

export async function launchCameraAsync(_options?: {
  quality?: number;
  allowsEditing?: boolean;
}): Promise<PhotoResult> {
  // `capture="environment"` hints rear camera on mobile browsers.
  const file = await pickFile("image/*", "environment");
  if (!file) return { canceled: true, assets: [] };
  return { canceled: false, assets: [toAsset(file)] };
}

export default {
  MediaTypeOptions,
  requestMediaLibraryPermissionsAsync,
  requestCameraPermissionsAsync,
  launchImageLibraryAsync,
  launchCameraAsync,
};
