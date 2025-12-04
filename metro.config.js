const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// This tells Metro to process your global.css using NativeWind
module.exports = withNativeWind(config, { input: "./src/app/global.css" });