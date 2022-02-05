const Mtoken = artifacts.require("Mtoken");
const Mswap = artifacts.require("Mswap");

module.exports = function (deployer) {
  deployer.deploy(Mtoken).then(() => {
    return deployer.deploy(Mswap, Mtoken.address)
  })

};
