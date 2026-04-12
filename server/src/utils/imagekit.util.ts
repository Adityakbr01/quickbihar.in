import { imagekit } from "../config/imagekit.config";
import { ApiError } from "./ApiError";

export const uploadToImageKit = async (fileBuffer: Buffer, fileName: string, folder: string = "/banners") => {
  try {
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: folder,
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
