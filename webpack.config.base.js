module.exports = {
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(bower_components|node_modules)/,
      loader: 'babel-loader',
    }],
  },
  output: {
    libraryTarget: 'umd',
    library: 'MediumEditorInsert'
  },
  resolve: {
    extensions: [
      '',
      '.js',
    ],
  }
};
