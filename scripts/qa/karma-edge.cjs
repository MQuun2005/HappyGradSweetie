// Optional local QA launcher for Edge installations that otherwise relaunch and
// detach from Karma. The project's default npm test / CI launcher is unchanged.
module.exports = (config) =>
  config.set({
    frameworks: ['jasmine'],
    plugins: ['karma-jasmine', 'karma-chrome-launcher'],
    reporters: ['progress'],
    customLaunchers: {
      EdgeHeadlessQA: {
        base: 'ChromeHeadless',
        flags: ['--edge-skip-compat-layer-relaunch'],
      },
    },
  });
