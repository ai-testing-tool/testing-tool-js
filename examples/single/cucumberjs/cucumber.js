module.exports = {
  default: {
    format: ['progress', '@qanalyzer/forge-cucumberjs'],
    require: ['step_definitions/**/*.js'],
    paths: ['features/**/*.feature'],
  },
};
