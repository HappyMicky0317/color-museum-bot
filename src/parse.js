import { createRequire } from "module";
const require = createRequire(import.meta.url);

import abiDecoder from "abi-decoder";
const IUniswapV2RouterABI = require("./abi/IUniswapV2Router02.json");

// Easily decode UniswapV2 Router data
abiDecoder.addABI(IUniswapV2RouterABI);

// Only does swapExactETHForTokens
// You'll need to extend it yourself :P
export const parseUniv2RouterTx = (txData) => {
  let data = null;
  try {
    data = abiDecoder.decodeMethod(txData);
  } catch (e) {
    return null;
  }

  var transactionType = 0;
  switch(data.name) {
    case "swapETHForExactTokens":
      transactionType = 1;
      break;
    case "swapExactETHForTokens":
      transactionType = 2;
      break;
    case "swapExactETHForTokensSupportingFeeOnTransferTokens":
      transactionType = 3;
      break;
    case "swapExactTokensForETH":
      transactionType = 4;
      break;
    case "swapExactTokensForETHSupportingFeeOnTransferTokens":
      transactionType = 5;
      break;
    case "swapExactTokensForTokens":
      transactionType = 6;
      break;
    case "swapExactTokensForTokensSupportingFeeOnTransferTokens":
      transactionType = 7;
      break;
    case "swapTokensForExactETH":
      transactionType = 8;
      break;
    case "swapTokensForExactTokens":
      transactionType = 9;
      break;
    default:
      transactionType = 0;
  }
  if(transactionType == 0)
    return;
  console.log("Transaction type is", transactionType,"\n",data);
  data.transaction_type = transactionType;
  return data;
};
