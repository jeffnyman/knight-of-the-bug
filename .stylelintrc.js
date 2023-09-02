module.exports = {
  extends: "stylelint-config-recommended-less",
  customSyntax: "postcss-less",

  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisable: true,
  rules: {
    "color-no-invalid-hex": true,
  },
};
