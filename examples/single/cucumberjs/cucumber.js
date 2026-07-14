module.exports = {
  default: {
    format: ['progress', 'qa-cucumberjs'],
    require: ['step_definitions/**/*.js'],
    paths: ['features/**/*.feature'],
  },
};
