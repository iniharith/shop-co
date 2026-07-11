const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Redirect react-native-reanimated to a JS-only stub for local Windows builds.
// This avoids the C++ CMake compilation failure. Our app only uses basic
// NativeWind Tailwind classes, so no animation functionality is lost.
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "react-native-reanimated": path.resolve(__dirname, "reanimated-stub.js"),
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
