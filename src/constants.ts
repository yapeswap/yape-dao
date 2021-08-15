import { Token } from "@yapeswap/yape-sdk";

export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const YAPE_ADDRESS = "0x757BC268bd50DA88b2d0cf1966652B18e56CA803";
export const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
export const YAPE_ETH_LP = "0x670120d4833633466C7DB4B515c53fa8C5B33B97";
export const YAPE_ROUTER = "0xCC00b641305c639D9f2b3c34067C69679EE1DBEF";
export const YAPE = new Token(
  1,
  YAPE_ADDRESS,
  18,
  "YAPE",
  "Yapeswap DAO Vision Token"
);
export const WETH = new Token(1, WETH_ADDRESS, 18);
