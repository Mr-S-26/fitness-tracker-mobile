module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // Fixes the absolute imports (e.g. @/lib/supabase)
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
          },
        },
      ],
      // Required for animations
      "react-native-reanimated/plugin",
    ],
  };
};