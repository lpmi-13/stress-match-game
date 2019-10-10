export default (config, env, helpers) => {
  config.output.publicPath = env.isProd ? '/stress-game/' : '';

  config.plugins.push(
    new helpers.webpack.DefinePlugin({
      'process.env.PUBLIC_PATH': JSON.stringify(config.output.publicPath)
    })
  );
};
