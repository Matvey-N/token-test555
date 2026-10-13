const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Network:", network.name);
  console.log("Deploying contract with account:", deployer.address);

  const initialSupply = ethers.parseEther("1000000"); // 1,000,000 MTK (18 decimals)

  const MyToken = await ethers.getContractFactory("MyToken");
  const myToken = await MyToken.deploy(initialSupply);
  await myToken.waitForDeployment();

  console.log("MyToken deployed to:", await myToken.getAddress());
  console.log("Deployment transaction:", myToken.deploymentTransaction().hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
