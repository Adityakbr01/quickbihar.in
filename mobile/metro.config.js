const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable Support for "exports" in package.json
config.resolver.unstable_enablePackageExports = true;

// Add webm and lottie to asset extensions
config.resolver.assetExts.push('webm', 'lottie');

module.exports = config;
