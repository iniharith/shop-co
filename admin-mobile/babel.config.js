module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // Disable auto-loading of removed packages
          worklets: false,
          reanimated: false,
        },
      ],
      "nativewind/babel",
    ],
  };
};
