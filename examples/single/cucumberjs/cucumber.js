module.exports = {
  default: {
    format: ['progress', '@ai-testing-tool/forge-cucumberjs'],
    require: ['step_definitions/**/*.js'],
    paths: ['features/**/*.feature'],
  },
};
