import { ethers } from 'ethers';
import { infura_http_provider, infura_ws_provider, contract_address, API_URL } from "./src/constants.js";
import chalk from 'chalk';
import abiDecoder from "abi-decoder";
import { createRequire } from "module";
import axios from "axios";
const require = createRequire(import.meta.url);
const  ERC721OrderFeatureABI = require("./src/ERC721OrdersFeature.json");
// import { ERC721OrderFeatureABI } from "./src/ERC721OrdersFeature";

var infura_http = new ethers.providers.JsonRpcProvider(infura_http_provider);

export const matchAddress = (a, b, caseInsensitive = true) => {
  if (a === null || a === undefined) return false;

  if (Array.isArray(b)) {
    if (caseInsensitive) {
      return b.map((x) => x.toLowerCase()).includes(a.toLowerCase());
    }

    return b.includes(a);
  }

  if (caseInsensitive) {
    return a.toLowerCase() === b.toLowerCase();
  }

  return a === b;
};

async function assumeTransaction(data) {
  console.log(data.logs.length);
  for(var i = 0 ; i < data.logs.length; ++ i) {
    // console.log(data.logs[i].topics);
    if(data.logs[i].topics == "0x50273fa02273cceea9cf085b42de5c8af60624140168bd71357db833535877af") {    // ERC721OrderFilled : erc721orders that accepted
      console.log(data.logs[i]);
      let abi = ["event ERC721OrderFilled(uint8 direction, address maker, address taker, uint256 nonce, address erc20Token, uint256 erc20TokenAmount, address erc721Token, uint256 erc721TokenId, address matcher)"];
      let iface = new ethers.utils.Interface(abi);
      let log = iface.parseLog(data.logs[i]);
      console.log(log.args.nonce.toNumber(), log.args.direction);
      var currentResult;
      try{
        if(log.args.direction == 1) {
          currentResult = await axios({
            method: "PATCH",
            url: `${API_URL}/buy_orders/current`,
            headers: {
              "Content-Type": "application/json",
            },
            data: JSON.stringify({
              nonce: log.args.nonce.toNumber(),
              current: 3,
              acceptingHash: data.logs[i].transactionHash
            }),
          });
        } else {
          currentResult = await axios({
            method: "PATCH",
            url: `${API_URL}/sell_orders/current`,
            headers: {
              "Content-Type": "application/json",
            },
            data: JSON.stringify({
              nonce: log.args.nonce.toNumber(),
              current: 3,
              acceptingHash: data.logs[i].transactionHash
            }),
          });
        }
        console.log("Result:", currentResult.status);
      } catch (e) {
        console.log("error", e.length);
      }
    }
    if(data.logs[i].topics == "0x8c5d0c41fb16a7317a6c55ff7ba93d9d74f79e434fefa694e50d6028afbfa3f0") {
      console.log(data.logs[i]);
      let log = data.logs[i].data;
      var numParams = (log.length - 2) / 64;
      if(numParams != 18) {
        console.log("Not our presigned order!");
        return false;
      }
      var paramsForOrder = [];
      for(var j = 0 ; j < numParams ; ++ j) {
        let param;
        if(j == 0 || j == 3 || j == 4 || j == 6 || j == 9 || j == 14){
          param = parseInt(log.substring(2 + 64 * j, 2 + 64 * (j + 1)), 16);
        }
        else {
          param = "0x" + log.substring(2 + 64 * j, 2 + 64 * (j + 1)).replace(/^0+/, '');
        }
        // console.log(param);
        paramsForOrder[j] = param;
      }
      // console.log(paramsForOrder);
      var order = {
        direction: paramsForOrder[0],
        maker: paramsForOrder[1],
        taker: paramsForOrder[2],
        expiry: String(paramsForOrder[3]),
        nonce: paramsForOrder[4],
        erc20Token: paramsForOrder[5],
        erc20TokenAmount: String(paramsForOrder[6]),
        fees: [{
          recipient: paramsForOrder[13],
          amount: paramsForOrder[14],
          feeData: "0x"
        }],
        erc721Token: paramsForOrder[8],
        erc721TokenId: paramsForOrder[9],
        erc721TokenProperties: [],
      };
      console.log(order);
      if(order.direction == 1) {
        try {
          var currentResult = await axios({
            method: "PATCH",
            url: `${API_URL}/buy_orders/current`,
            headers: {
              "Content-Type": "application/json",
            },
            data: JSON.stringify({ nonce: order.nonce, current: 1, makingHash: data.logs[i].transactionHash}),
          });
          console.log("currentResult", currentResult.status);
        } catch(e){
          console.log("Error!", e.length);
        }
      }
      else {
        try {
          var currentResult = await axios({
            method: "PATCH",
            url: `${API_URL}/sell_orders/current`,
            headers: {
              "Content-Type": "application/json",
            },
            data: JSON.stringify({ nonce: order.nonce, current: 1, makingHash: data.logs[i].transactionHash}),
          });
        } catch(e){
          console.log("Error!", e.length);
        }
        // console.log("currentResult", currentResult.status);
      }
    }
    if(data.logs[i].topics == "0xa015ad2dc32f266993958a0fd9884c746b971b254206f3478bc43e2f125c7b9e") {
      console.log(data.logs[i]);
      let abi = ["event ERC721OrderCancelled( address maker, uint256 nonce)"];
      let iface = new ethers.utils.Interface(abi);
      let log = iface.parseLog(data.logs[i]);
      console.log(log);
      var currentResult;
      try {
        currentResult = await axios({
          method: "PATCH",
          url: `${API_URL}/orders/cancel`,
          headers: {
            "Content-Type": "application/json",
          },
          data: JSON.stringify({
            nonce: Number(log.args.nonce),
            cancelHash: data.logs[i].transactionHash,
          }),
        });
        console.log("currentResult", currentResult.status);
      } catch(e){
        console.log("Error!", e.length);
      }
    }
  }
}

async function post(block) {
  abiDecoder.addABI(ERC721OrderFeatureABI);
  try {
    for (let tx of block.transactions) {
      if(matchAddress(tx.to, contract_address))
      {
        let tx_receipt = await infura_http.getTransactionReceipt(tx.hash);
        if(tx_receipt.status != 0)
          await assumeTransaction(tx_receipt);
      }
    }
  } catch (e) {
    console.log(chalk.red("Error when analyzing"));
  }
};

let main = async () => {
  let eth_websocket = new ethers.providers.WebSocketProvider(infura_ws_provider);

  // let tx_receipt = await infura_http.getTransactionReceipt("0xd05a3974ad8e2ecaf7d2e52d4e1ef2b8954b29fc938b385ce032d3885b261d42");
  // assumeTransaction(tx_receipt);

  eth_websocket.on("block", (blk) => {
    eth_websocket.getBlockWithTransactions(blk).then(function (block) {
      console.log(block.number);
      post(block);
    });
  });

  eth_websocket._websocket.on("error", async () => {
    console.log(`Unable to connect to ${ep.subdomain} retrying in 3s...`);
    setTimeout(main, 3000);
  });
  eth_websocket._websocket.on("close", async (code) => {
    console.log(
      `Connection lost with code ${code}! Attempting reconnect in 3s...`
    );
    eth_websocket._websocket.terminate();
    setTimeout(main, 3000);
  });
};

main();
