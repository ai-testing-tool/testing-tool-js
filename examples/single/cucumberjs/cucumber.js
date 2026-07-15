module.exports = {
  default: {
    format: ['progress', 'qa-forge-cucumberjs'],
    require: ['step_definitions/**/*.js'],
    paths: ['features/**/*.feature'],
  },
};
