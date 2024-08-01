//@ts-ignore
import { parseEther, formatEther } from "viem";
import CrowdFunding from "./CrowdFunding.json";
import { ethers } from "ethers";
import CrowdFundingABI from "./CrowdFunding.json";
import moment from "moment";
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const RPC = import.meta.env.VITE_RPC;

const provider = new ethers.JsonRpcProvider(RPC);
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  CrowdFundingABI.abi,
  provider
);

async function getAccount() {
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  console.log("address", address);
  return address;
}

async function getAllFundings() {
  const length = await contract.numFundings();
  const result = [];
  for (let i = 1; i <= length; i++) result.push(await getOneFunding(i));
  return result;
}

async function getOneFunding(index) {
  const data = await contract.fundings(index);
  const [
    initiator,
    title,
    info,
    goal,
    endTime,
    success,
    amount,
    numFunders,
    numUses,
  ] = data;
  const goalInEther = ethers.formatEther(goal);
  const amountInEther = ethers.formatEther(amount);

  return {
    index,
    initiator,
    title,
    info,
    goal: goalInEther,
    endTime,
    success,
    amount: amountInEther,
    numFunders,
    numUses,
  };
}

async function getMyFundingAmount(index, account) {
  if (!account) return 0;
  const result = await contract.getMyFundings(account, index);
  const fundingsInEther = ethers.formatEther(result);
  return +fundingsInEther;
}

async function getMyFundings(account) {
  const result = {
    init: [],
    contr: [],
  };
  if (!account) {
    return result;
  }
  const all = await getAllFundings();

  for (let funding of all) {
    const myAmount = await getMyFundingAmount(funding.index, account);
    if (funding.initiator == account) {
      result.init.push({
        myAmount,
        ...funding,
      });
    }
    if (myAmount != 0) {
      result.contr.push({
        myAmount,
        ...funding,
      });
    }
  }
  return result;
}

async function contribute(id, value) {
  const tx = await contract.contribute(id, {
    value: ethers.parseEther(value.toString(10)),
  });
  await tx.wait();
  return tx;
}

async function newFunding(account, title, info, amount, seconds) {
  const weiAmount = ethers.parseEther(amount.toString(10));

  const tx = await contract.newFunding(
    account,
    title,
    info,
    weiAmount,
    seconds,
    {
      gasLimit: 1000000,
    }
  );

  await tx.wait();

  return tx;
}

async function getAllUse(id, account) {
  const length = await contract.getUseLength(id);
  const result = [];
  for (let i = 1; i <= length; i++) {
    const use = await contract.getUse(id, i, account);
    result.push({
      index: i,
      info: use[0],
      goal: ethers.formatEther(use[1]), // 从 Wei 单位转换为 Ether
      agreeAmount: ethers.formatEther(use[2]), // 从 Wei 单位转换为 Ether
      disagree: ethers.formatEther(use[3]), // 从 Wei 单位转换为 Ether
      over: use[4],
      agree: Number(use[5]),
    });
  }
  return result;
}

async function agreeUse(id, useID, agree) {
  const tx = await contract.agreeUse(id, useID, agree, {
    gasLimit: 1000000,
  });
  await tx.wait();
  return tx;
}

async function newUse(id, goal, info) {
  const eth = ethers.parseEther(goal.toString());
  const tx = await contract.newUse(id, eth, info, {
    gasLimit: 1000000,
  });
  await tx.wait();
  return tx;
}

async function returnMoney(id) {
  const tx = await contract.returnMoney(id, {
    gasLimit: 1000000,
  });

  await tx.wait();

  return tx;
}

export {
  getAccount,
  contract,
  getAllFundings,
  getOneFunding,
  getMyFundingAmount,
  contribute,
  newFunding,
  getAllUse,
  agreeUse,
  newUse,
  getMyFundings,
  returnMoney,
};
