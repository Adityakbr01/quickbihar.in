import { imagekit } from "../config/imagekit.config";
import { ApiError } from "./ApiError";

/**
 * Sanitizes a filename for web-safe ImageKit upload
 * Example: "My Red Shirt (L).png" -> "my_red_shirt_l_1623456789.png"
 */
const sanitizeFileName = (fileName: string) => {
  const ext = fileName.split('.').pop() || "";
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  
  const cleanName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "_") // Replace non-alphanumeric with underscore
    .replace(/_+/g, "_")         // Collapse multiple underscores
    .replace(/^_|_$/g, "");      // Trim underscores from start/end

  // Append timestamp to ensure uniqueness and prevent CDN caching issues on replacement
  return `${cleanName}_${Date.now()}.${ext}`;
};

export const uploadToImageKit = async (fileBuffer: Buffer, fileName: string, folder: string = "banners") => {
  try {
    // Normalize folder: remove leading/trailing slashes and handle empty
    const normalizedFolder = folder.replace(/^\/|\/$/g, '') || "general";

    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: sanitizeFileName(fileName),
      folder: normalizedFolder,
    });
    return {
      url: response.url,
      fileId: response.fileId,
    };
  } catch (error: any) {
    console.error("ImageKit Upload Error:", error);
    throw new ApiError(500, error.message || "Failed to upload image to ImageKit");
  }
};

export const deleteFromImageKit = async (fileId: string) => {
  try {
    await imagekit.deleteFile(fileId);
    return true;
  } catch (error: any) {
    console.error("ImageKit Deletion Error:", error);
    // We don't necessarily want to throw an error if deletion fails during an update, 
    // but for debugging purposes, we log it.
    return false;
  }
};
