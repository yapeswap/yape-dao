import JSBI from "jsbi";
import { useWeb3React } from "@web3-react/core";
import { ERC20__factory } from "@workhard/protocol";
import { FeeManager__factory } from "@workhard/utils";
import { BigNumber, Contract, providers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { useStores } from "../../../hooks/user-stores";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import {
  WETH,
  WETH_ADDRESS,
  YAPE,
  YAPE_ADDRESS,
  YAPE_ETH_LP,
  YAPE_ROUTER,
} from "../../../constants";
import { pool2Factory } from "../../../config.json";
import {
  UniswapV2Factory,
  UniswapV2Factory__factory,
  UniswapV2Pair__factory,
} from "@workhard/protocol/dist/build/@uniswap";
import { abi as IUniswapV2Router02ABI } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { ConditionalButton } from "../../ConditionalButton";
import { handleTransaction, TxStatus } from "../../../utils/utils";

export const BuyBack: React.FC<{
  token: string;
  rewardToken: string;
  feeManager: string;
}> = ({ token, rewardToken, feeManager }) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const { addToast } = useToasts();
  const { mineStore } = useStores();
  const { blockNumber } = useBlockNumber();

  const [balance, setBalance] = useState<BigNumber>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [price, setPrice] = useState<number>();
  const [decimal, setDecimal] = useState<number>();
  const [value, setValue] = useState<string>();
  const [route, setRoute] = useState<{
    amountIn: BigNumber;
    amountOut: BigNumber;
    path: string[];
  }>();

  useEffect(() => {
    if (!library) return;
    ERC20__factory.connect(token, library)
      .balanceOf(feeManager)
      .then(setBalance);
  }, [token, library, blockNumber]);

  useEffect(() => {
    if (!library) return;
    mineStore.loadDecimal(token).then(setDecimal);
    mineStore.getTokenPrice(token).then(setPrice);
  }, [library, token]);

  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  useEffect(() => {
    if (!balance || !price || !decimal) return;
    const revenue = parseFloat(formatUnits(balance, decimal)) * price;
    setValue(usdFormatter.format(revenue > 0 ? revenue : 0));
  }, [price, balance, decimal]);

  useEffect(() => {
    if (balance?.gt(0) && !!library) {
      getRoute(balance)
        .then(setRoute)
        .catch((e) => {
          console.log("Failed to find route");
          console.error(e);
        });
    }
  }, [token, balance, blockNumber, decimal]);

  const getRoute = async (balance: BigNumber) => {
    if (!library) return undefined;

    const chainId = 1;
    const factory = UniswapV2Factory__factory.connect(pool2Factory, library);
    const router = new Contract(YAPE_ROUTER, IUniswapV2Router02ABI, library);
    let wethAmount: BigNumber;
    const path = [token];
    if (token === WETH_ADDRESS) {
      wethAmount = balance;
      path.push(rewardToken);
    } else {
      path.push(WETH_ADDRESS);
      path.push(rewardToken);
      const pair0 = await factory.getPair(token, WETH_ADDRESS);
      const [reserve0, reserve1] = await UniswapV2Pair__factory.connect(
        pair0,
        library
      ).getReserves();
      const [token0, token1] = (await mineStore.lpBaseTokens(pair0)) || [];
      wethAmount = await router.quote(
        balance,
        token === token0 ? reserve0 : reserve1,
        token === token0 ? reserve1 : reserve0
      );
    }

    const pair1 = await factory.getPair(WETH_ADDRESS, rewardToken);
    const [token0, token1] = (await mineStore.lpBaseTokens(pair1)) || [];
    const [reserve0, reserve1] = await UniswapV2Pair__factory.connect(
      pair1,
      library
    ).getReserves();
    const amountOut: BigNumber = await router.quote(
      wethAmount,
      WETH_ADDRESS === token0 ? reserve0 : reserve1,
      WETH_ADDRESS === token0 ? reserve1 : reserve0
    );

    return {
      amountIn: balance,
      amountOut,
      path,
    };
  };

  const swap = async (slippage: number) => {
    if (!account || !library || !blockNumber) {
      alert("Not connected");
      return;
    }
    if (!route) {
      alert("No route exists");
      return;
    }
    const signer = library.getSigner(account);
    const minAmountOut = route.amountOut.mul(100 - slippage).div(100);
    const { timestamp } = await library.getBlock(blockNumber);

    const router = new Contract(YAPE_ROUTER, IUniswapV2Router02ABI, library);
    const popTx = await router.populateTransaction.swapExactTokensForTokens(
      route.amountIn,
      minAmountOut,
      route.path,
      feeManager,
      timestamp + 120
    );
    const fm = FeeManager__factory.connect(feeManager, library);
    handleTransaction(
      fm
        .connect(signer)
        .swap(YAPE_ROUTER, route.path[0], route.amountIn, popTx.data, {
          gasLimit: 600000,
        }),
      setTxStatus,
      addToast,
      `Successfully swapped!`
    );
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>{mineStore.symbol(token)}</Card.Title>
      </Card.Header>
      <Card.Body>
        <Card.Text>
          Amount
          <br />
          {balance && formatUnits(balance, decimal)}
        </Card.Text>
        <Card.Text>
          Value
          <br />
          {value}
        </Card.Text>
        <ConditionalButton
          enabledWhen={!!route}
          whyDisabled={"Not enough balance or failed to find the path."}
          onClick={() => swap(1)}
        >
          Buy-back YAPE (1% slippage)
        </ConditionalButton>
      </Card.Body>
    </Card>
  );
};
