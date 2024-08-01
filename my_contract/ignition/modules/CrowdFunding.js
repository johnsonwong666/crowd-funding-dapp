const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CrowdFundingModule", (m) => {
  const CrowdFunding = m.contract("CrowdFunding");

  return { CrowdFunding };
});

