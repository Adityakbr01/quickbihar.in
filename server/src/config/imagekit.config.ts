import ImageKit from "imagekit";
import { ENV } from "./env.config";

export const imagekit = new ImageKit({
  publicKey: ENV.IMAGEKIT_PUBLIC_KEY,
  privateKey: ENV.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: ENV.IMAGEKIT_URL_ENDPOINT,
});
