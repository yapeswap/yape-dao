import React from "react";
import { action, get, observable } from "mobx";
import { formatEther, formatUnits, getAddress } from "ethers/lib/utils";
import { getPriceFromCoingecko } from "../utils/coingecko";
import { BigNumber, Contract, Signer } from "ethers";
import { Provider } from "@ethersproject/abstract-provider";
import { WorkhardLibrary } from "../providers/WorkhardProvider";
import { weiToEth } from "../utils/utils";
import { ERC20__factory, MiningPool__factory } from "@workhard/protocol";
import { getPool, getPoolAddress, getPoolContract } from "../utils/uniV3";
import { UniswapV2Pair__factory } from "@workhard/protocol/dist/build/@uniswap";
import {
  getYearnVaultData,
  MAX_SHARE_FACTOR,
  MIN_SHARE_FACTOR,
  YearnVaultData,
} from "../utils/yearn";

export class MineStore {
  @observable public lib: WorkhardLibrary | undefined;
  @observable public pools: string[] = [];
  @observable public yearnData: { [tokenAddr: string]: YearnVaultData } = {};
  @observable public apys: { [poolAddr: string]: number } = {};
  @observable public tvls: { [poolAddr: string]: number } = {};
  @observable public minRevs: { [poolAddr: string]: number } = {};
  @observable public maxRevs: { [poolAddr: string]: number } = {};
  @observable public maxApys: { [poolAddr: string]: number | undefined } = {};
  @observable public lpBase: {
    [poolAddr: string]: { token0: string; token1: string };
  } = {};
  @observable public baseTokens: {
    [poolAddr: string]: string;
  } = {};
  @observable public coingeckoPriceData: {
    [poolAddr: string]: number;
  } = {};
  @observable public decimals: {
    [poolAddr: string]: number;
  } = {};
  @observable public symbols: {
    [poolAddr: string]: string;
  } = {};
  @observable public distributable: boolean = false;
  @observable public visionPrice: number | undefined = 0;
  @observable public commitPrice: number | undefined = 0;
  @observable public ethPerVision: number | undefined = 0;
  @observable public visionPerLP: number = 0;
  @observable public ethPrice: number | undefined = 0;
  @observable public emission: BigNumber = BigNumber.from(0);
  @observable public emissionWeightSum: BigNumber = BigNumber.from(0);
  @observable private initialContributorPool: string | undefined;
  @observable private commitDaiUniV3Pool: Contract | undefined;

  @get
  liquidityMiningIdx = () => {
    return this.pools.findIndex(
      (v) =>
        !!v && getAddress(v) === this.lib?.periphery.liquidityMining.address
    );
  };

  @get
  commitMiningIdx = () => {
    return this.pools.findIndex(
      (v) => !!v && getAddress(v) === this.lib?.periphery.commitMining.address
    );
  };

  @get
  apy = (poolAddress: string) => {
    return this.apys[poolAddress] || NaN;
  };

  @get
  tvl = (poolAddress: string) => {
    return this.tvls[poolAddress] || NaN;
  };

  @get
  getVisionPrice = () => {
    this.loadVisionPrice();
    return this.visionPrice || NaN;
  };

  @get
  maxAPY = (poolAddress: string) => {
    return this.maxApys[poolAddress] || NaN;
  };

  @get
  getBaseToken = async (poolAddr: string): Promise<string | undefined> => {
    if (!this.baseTokens[poolAddr]) {
      await this.loadBaseToken(poolAddr);
    }
    return this.baseTokens[poolAddr];
  };

  @get
  symbol = (erc20: string): string => {
    if (!this.symbols[erc20]) {
      this.loadSymbol(erc20);
    }
    return this.symbols[erc20];
  };

  @get
  minYearnRev = (): number => {
    return this.pools
      .map((addr) => {
        return this.minRevs[addr] || 0;
      })
      .reduce((acc, rev) => acc + rev, 0);
  };

  @get
  maxYearnRev = (): number => {
    return this.pools
      .map((addr) => {
        return this.maxRevs[addr] || 0;
      })
      .reduce((acc, rev) => acc + rev, 0);
  };

  @get
  decimal = (erc20: string): number => {
    if (!this.decimals[erc20]) {
      this.loadDecimal(erc20);
    }
    return this.decimals[erc20];
  };

  @get
  lpBaseTokens = async (lpToken: string): Promise<string[] | undefined> => {
    if (!this.lpBase[lpToken]) {
      await this.loadReserveTokens(lpToken);
    }
    if (this.lpBase[lpToken]) {
      return [this.lpBase[lpToken].token0, this.lpBase[lpToken].token1];
    } else {
      return undefined;
    }
  };

  @action
  init = async (whfLibrary: WorkhardLibrary | undefined) => {
    this.lib = whfLibrary;
    await this.loadInitialData();
  };

  @action
  loadInitialData = async () => {
    await this.loadPools();
    await this.loadYearnData();
    await this.loadAPYs();
  };

  @action
  loadEthPrice = async () => {
    this.ethPrice = await this.getTokenPrice(
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    );
  };

  @action
  getTokenPrice = async (token: string): Promise<number> => {
    if (!this.yearnData[token]) {
      await this.loadYearnData();
    }
    if (!this.yearnData[token]) {
      this.coingeckoPriceData[token] =
        (await getPriceFromCoingecko(token)) || NaN;
    }
    return this.yearnData[token]?.tvl.price || this.coingeckoPriceData[token];
  };

  @action
  loadPools = async () => {
    if (this.lib) {
      const poolLength =
        (await this.lib.dao.visionEmitter.getNumberOfPools()) || 0;
      const _pools = [];
      for (let i = 0; i < poolLength.toNumber(); i++) {
        _pools.push(await this.lib?.dao.visionEmitter?.pools(i));
      }
      this.pools = _pools;
      this.initialContributorPool = await this.lib.dao.visionEmitter.initialContributorPool();
    }
    await this.loadVisionPrice();
    await this.loadCommitPrice();
    await this.loadAPYs();
  };

  @action
  loadVisionPrice = async () => {
    if (!this.ethPrice) {
      await this.loadEthPrice();
    }
    if (this.lib && !!this.ethPrice) {
      const {
        reserve0: reservedVISION,
        reserve1: reservedETH,
      } = await this.lib.periphery.visionLP.getReserves();
      const supply = await this.lib.periphery.visionLP.totalSupply();
      const visionPerLP = (2 * weiToEth(reservedVISION)) / weiToEth(supply);
      const ethPerVision = weiToEth(reservedETH) / weiToEth(reservedVISION);
      this.visionPerLP = visionPerLP;
      this.ethPerVision = ethPerVision;
      this.visionPrice = this.ethPrice * ethPerVision;
    }
    return this.visionPrice;
  };

  @action
  loadCommitPrice = async () => {
    if (!this.commitDaiUniV3Pool && !!this.lib) {
      const poolAddress = await getPoolAddress(
        this.lib.web3.library,
        this.lib.dao.baseCurrency.address,
        this.lib.dao.commit.address
      );
      if (poolAddress) {
        const pool = await getPoolContract(poolAddress, this.lib.web3.library);
        this.commitDaiUniV3Pool = pool;
      }
      if (this.commitDaiUniV3Pool) {
        const pool = await getPool(this.commitDaiUniV3Pool);
        this.commitPrice = parseFloat(pool.token1Price.toFixed());
      }
    }
  };

  @action
  loadAPYs = async () => {
    const promises = [];
    if (this.pools && this.lib) {
      for (let pool of this.pools) {
        if (pool === this.lib.periphery.commitMining.address) {
          promises.push(this.loadCommitMiningAPY());
        } else {
          promises.push(this.loadLiquidityMiningAPY(pool));
        }
      }
      promises.push(this.loadInitialContributorSharePoolAPY());
    }
    return Promise.all(promises);
  };

  @action
  loadEmission = async () => {
    if (this.lib) {
      this.emission = await this.lib.dao.visionEmitter.emission();
    }
  };

  @action
  loadEmissionWeightSum = async () => {
    if (this.lib) {
      this.emissionWeightSum = (
        await this.lib.dao.visionEmitter.emissionWeight()
      ).sum;
    }
  };

  @action
  isDistributable = (account: Signer | Provider) => {
    if (this.lib) {
      this.lib.dao.visionEmitter
        .connect(account)
        .estimateGas.distribute()
        .then((_) => (this.distributable = true))
        .catch((_) => (this.distributable = false));
    }
  };

  @action
  loadLiquidityMiningAPY = async (pool: string) => {
    const baseToken = await this.getBaseToken(pool);
    if (!baseToken || !this.lib) {
      return;
    }
    const lpPrice = await this.loadLPTokenPrice(baseToken);
    if (!lpPrice) return;
    const miningPool = await MiningPool__factory.connect(
      pool,
      this.lib.web3.library
    );
    const totalMiners = await miningPool.totalMiners();

    let visionPerYear: number;
    try {
      const yearlyMiningRatePerStakedToken = (await miningPool.miningRate())
        .mul(86400 * 365)
        .div(totalMiners)
        .div(10000)
        .toNumber();
      visionPerYear = totalMiners.eq(0)
        ? Infinity
        : yearlyMiningRatePerStakedToken;
    } catch {
      visionPerYear = NaN;
    }
    const apy =
      1000000 * ((visionPerYear / (lpPrice || NaN)) * (this.visionPrice || 0));
    this.apys[pool] = apy;
    const tvl =
      parseFloat(formatUnits(totalMiners, await this.loadDecimal(baseToken))) *
      lpPrice;
    this.tvls[pool] = tvl;
    await this.loadYearnRevenues(pool, baseToken, tvl);
  };

  @action
  loadYearnRevenues = async (
    pool: string,
    baseToken: string,
    pairTVL: number
  ) => {
    const tokens = await this.lpBaseTokens(baseToken);
    if (!tokens) throw Error("Failed to find tokens.");
    if (!this.yearnData[tokens[0]]) {
      await this.loadYearnData();
    }
    const tvl = pairTVL * 0.5;
    const { minRev, maxRev } = tokens
      .map((token) => {
        const yearnData = this.yearnData[token];
        if (!yearnData)
          return {
            minRev: 0,
            maxRev: 0,
          };
        const yearnFeeInYearly =
          (yearnData.apy.fees.management || 0) * tvl +
          (yearnData.apy.fees.performance || 0) * tvl * yearnData.apy.gross_apr;
        const yearnRevenueInYearly = tvl * yearnData.apy.net_apy;
        const rev = {
          minRev: yearnRevenueInYearly + yearnFeeInYearly * MIN_SHARE_FACTOR,
          maxRev: yearnRevenueInYearly + yearnFeeInYearly * MAX_SHARE_FACTOR,
        };
        return rev;
      })
      .reduce(
        (acc, revenue) => ({
          minRev: acc.minRev + revenue.minRev,
          maxRev: acc.maxRev + revenue.maxRev,
        }),
        { minRev: 0, maxRev: 0 }
      );
    this.minRevs[pool] = minRev;
    this.maxRevs[pool] = maxRev;
  };

  @action
  loadCommitMiningAPY = async () => {
    if (this.lib) {
      const totalMiners = await this.lib.periphery.commitMining.totalMiners();
      const visionPerYear = totalMiners.eq(0)
        ? Infinity
        : (await this.lib.periphery.commitMining.miningRate())
            .mul(86400 * 365)
            .div(totalMiners)
            .toNumber();

      let commitPrice =
        this.commitPrice ||
        (await this.getTokenPrice(this.lib.dao.commit.address));
      commitPrice = Math.min(commitPrice || 1, 2);
      if (commitPrice) {
        const apy =
          100 *
            ((visionPerYear * (this.visionPrice || 0)) / (commitPrice || NaN)) -
          100;
        this.apys[this.lib.periphery.commitMining.address] = apy;
        this.maxApys[this.lib.periphery.commitMining.address] = undefined;
        this.tvls[this.lib.periphery.commitMining.address] = parseFloat(
          formatEther(totalMiners)
        );
      } else {
        const apy = 100 * (visionPerYear * (this.visionPrice || 0)) - 100;
        this.apys[this.lib.periphery.commitMining.address] = apy * 0.5;
        this.maxApys[this.lib.periphery.commitMining.address] = apy;
        this.tvls[this.lib.periphery.commitMining.address] = parseFloat(
          formatEther(totalMiners)
        );
      }
    }
  };

  @action
  loadInitialContributorSharePoolAPY = async () => {
    if (this.lib && this.initialContributorPool) {
      const initialContributorPool = MiningPool__factory.connect(
        this.initialContributorPool,
        this.lib.web3.library
      );
      const totalMiners = await initialContributorPool.totalMiners();
      const visionPerYear = totalMiners.eq(0)
        ? Infinity
        : (await initialContributorPool.miningRate())
            .mul(86400 * 365)
            .div(totalMiners)
            .toNumber();

      const apy = 100 * (visionPerYear * (this.visionPrice || 0)) - 100;
      this.apys[this.initialContributorPool] = apy;
    }
  };

  @action
  loadERC20StakingAPY = async (poolAddress: string) => {
    if (this.lib) {
      const miningPool = MiningPool__factory.connect(
        poolAddress,
        this.lib.web3.library
      );
      const totalMiners = await miningPool.totalMiners();
      const miningRate = await miningPool.miningRate();
      const visionPerYear = totalMiners.eq(0)
        ? Infinity
        : miningRate
            .mul(86400 * 365)
            .div(totalMiners)
            .toNumber();
      const baseToken = await miningPool.baseToken();
      const baseTokenPrice = await this.getTokenPrice(baseToken);
      const apy =
        100 *
        ((visionPerYear * (this.visionPrice || 0)) / (baseTokenPrice || NaN));
      this.apys[poolAddress] = apy;
    }
  };

  @action
  loadERC20BurnAPY = async (poolAddress: string) => {
    if (this.lib) {
      const miningPool = MiningPool__factory.connect(
        poolAddress,
        this.lib.web3.library
      );
      const totalMiners = await miningPool.totalMiners();
      const miningRate = await miningPool.miningRate();
      const visionPerYear = totalMiners.eq(0)
        ? Infinity
        : miningRate
            .mul(86400 * 365)
            .div(totalMiners)
            .toNumber();
      const baseToken = await miningPool.baseToken();
      const baseTokenPrice = await this.getTokenPrice(baseToken);
      const apy =
        100 *
          ((visionPerYear * (this.visionPrice || 0)) /
            (baseTokenPrice || NaN)) -
        100;
      this.apys[poolAddress] = apy;
    }
  };

  @action
  loadLPTokenPrice = async (lpToken: string): Promise<number | undefined> => {
    if (!this.lib) return;
    const tokens = await this.lpBaseTokens(lpToken);
    if (!tokens) return;
    const [token0, token1] = tokens;

    let decimal0 = await this.loadDecimal(token0);
    let decimal1 = await this.loadDecimal(token1);

    const pair = UniswapV2Pair__factory.connect(lpToken, this.lib.web3.library);
    const supply = await pair.totalSupply();
    const [reserve0, reserve1] = await pair.getReserves();
    const amount0 = parseFloat(formatUnits(reserve0, decimal0));
    const amount1 = parseFloat(formatUnits(reserve1, decimal1));

    const [price0, price1] = await Promise.all([
      this.getTokenPrice(token0),
      this.getTokenPrice(token1),
    ]);
    let totalVal: number;
    if (!!price0 && !!price1) {
      totalVal = amount0 * price0 + amount1 * price1;
    } else if (!price0 && !!price1) {
      totalVal = 2 * amount1 * price1;
    } else if (!!price0 && !price1) {
      totalVal = 2 * amount0 * price0;
    } else {
      totalVal = 0;
    }
    const lpPrice = totalVal / Number.parseFloat(formatEther(supply));
    this.coingeckoPriceData[lpToken] = lpPrice;
    return lpPrice;
  };

  @action
  loadDecimal = async (erc20: string): Promise<number> => {
    let decimal = this.decimals[erc20];
    if (decimal === undefined && !!this.lib) {
      try {
        decimal = await ERC20__factory.connect(
          erc20,
          this.lib.web3.library
        ).decimals();
      } catch {
        decimal = 18;
      }
    }
    return decimal;
  };

  @action
  loadReserveTokens = async (lpToken: string) => {
    if (this.lib) {
      const pair = UniswapV2Pair__factory.connect(
        lpToken,
        this.lib.web3.library
      );
      try {
        const [token0, token1] = await Promise.all([
          pair.token0(),
          pair.token1(),
        ]);
        this.lpBase[lpToken] = {
          token0,
          token1,
        };
      } catch {
        // not a pair token
      }
    }
  };
  @action
  loadBaseToken = async (poolAddr: string) => {
    if (this.lib) {
      const baseToken = await MiningPool__factory.connect(
        poolAddr,
        this.lib.web3.library
      ).baseToken();
      this.baseTokens[poolAddr] = baseToken;
    }
  };
  @action
  loadSymbol = async (erc20: string): Promise<string> => {
    let symbol = this.symbols[erc20];
    if (!symbol && !!this.lib) {
      symbol = await ERC20__factory.connect(
        erc20,
        this.lib.web3.library
      ).symbol();
      this.symbols[erc20] = symbol;
    }
    return symbol;
  };
  @action
  loadYearnData = async (): Promise<void> => {
    const yearnData = await getYearnVaultData();
    yearnData?.forEach((data) => {
      this.yearnData[data.token.address] = data;
    });
  };
}
