module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Désactiver les avertissements de source maps
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.use && rule.use.some(use => use.loader && use.loader.includes('source-map-loader'))) {
          rule.use = rule.use.filter(use => !use.loader || !use.loader.includes('source-map-loader'));
        }
      });
      
      return webpackConfig;
    },
  },
};
