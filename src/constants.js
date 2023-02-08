// Globals
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import dotenv from "dotenv";
dotenv.config();
import { ERC721OrderFeatureABI } from "../src/ERC721OrdersFeature.js";

import { ethers } from "ethers";

export var REAL_MODE = process.env.REAL_MODE == '1' ? true : false;
export var infura_http_provider = REAL_MODE ? process.env.RPC_URL : process.env.RPC_URL_TEST;
export var infura_ws_provider = REAL_MODE ? process.env.RPC_URL_WSS : process.env.RPC_URL_WSS_TEST;
export var contract_address = REAL_MODE ? process.env.CONTRACT_ADDRESS : process.env.CONTRACT_ADDRESS_ROPSTEN;
export var API_URL = REAL_MODE ? "https://orders.color.museum/api/v1" : "http://localhost:3001/api/v1";

export const wssProvider = new ethers.providers.WebSocketProvider(
  infura_ws_provider
);

// Used to send transactions, needs ether
export const searcherWallet = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  wssProvider
);
