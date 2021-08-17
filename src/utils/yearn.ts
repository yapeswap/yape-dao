export const MAX_SHARE_FACTOR = 0.5;
export const MIN_SHARE_FACTOR = 0.1;

export interface YearnVaultData {
  inception: number;
  address: string;
  symbol: string;
  name: string;
  display_name: string;
  icon: string;
  token: {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    display_name: string;
    icon: string;
  };
  tvl: {
    total_assets: number;
    price: number;
    tvl: number;
  };
  apy: {
    type: string;
    gross_apr: number;
    net_apy: number;
    fees: {
      performance: number | null;
      withdrawal: number | null;
      management: number | null;
      keep_crv: number | null;
      cvx_keep_crv: number | null;
    };
    points: {
      week_ago: number;
      month_ago: number;
      inception: number;
    };
    composite: null;
  };
  strategies: any[];
  endorsed: boolean;
  version: string;
  decimals: number;
  type: string;
  emergency_shutdown: boolean;
  updated: number;
  migration: any | null;
  new: boolean;
  special: boolean;
}

export const getYearnVaultData = (): Promise<YearnVaultData[] | undefined> => {
  return new Promise<YearnVaultData[] | undefined>((resolve) => {
    fetch(`https://api.yearn.finance/v1/chains/1/vaults/all`)
      .then((res) => res.json())
      .then((json) => {
        resolve(json);
      })
      .catch(() => resolve(undefined));
  });
};
