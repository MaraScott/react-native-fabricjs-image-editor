const reactDom = require('./reactDomGlobal.js');

const clientExports = {
  ...reactDom,
  createRoot: reactDom.createRoot,
  hydrateRoot: reactDom.hydrateRoot,
};

module.exports = clientExports;
module.exports.default = clientExports;
