import { useWeb3React } from "@web3-react/core";
import { ERC20__factory } from "@workhard/protocol";
import { FeeManager__factory } from "@workhard/utils";
import { YapeRebalancer__factory } from "@yapeswap/yape-core";
import { BigNumber, providers } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import { Button, Card } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { YAPE_REBALANCER } from "../../../constants";
import { useStores } from "../../../hooks/user-stores";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import {
  errorHandler,
  handleTransaction,
  TxStatus,
} from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";

export const RewindAll: React.FC<{
  tokens: string[];
  feeManager: string;
}> = ({ tokens, feeManager }) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const { mineStore } = useStores();

  const [balances, setBalances] = useState<BigNumber[]>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [totalVal, setTotalVal] = useState<string>();
  useEffect(() => {
    if (!library) return;
    Promise.all(
      tokens.map((token) =>
        ERC20__factory.connect(token, library).balanceOf(feeManager)
      )
    )
      .then(setBalances)
      .catch(errorHandler(addToast));
  }, [tokens, library, blockNumber, txStatus]);

  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  useEffect(() => {
    if (!balances) return;
    Promise.all(tokens.map((token) => mineStore.loadLPTokenPrice(token))).then(
      (prices) => {
        console.log("prices", prices);
        const sum = prices
          .map(
            (price, i) => parseFloat(formatEther(balances[i])) * (price || 0)
          )
          .reduce((acc, val) => acc + val, 0);
        setTotalVal(usdFormatter.format(sum));
      }
    );
  }, [tokens, balances, blockNumber]);

  const rewindAll = async () => {
    if (!account || !library || !blockNumber) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const tokensToRewind = tokens.filter(
      (_, i) => balances && balances[i].gt(0)
    );
    const fm = FeeManager__factory.connect(feeManager, library);
    handleTransaction(
      fm.connect(signer).rewindAll(tokensToRewind),
      setTxStatus,
      addToast,
      `Successfully rewinded!`
    );
  };

  const rebalanceAll = async () => {
    if (!account || !library || !blockNumber) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const pairsToRebalance = tokens;
    // const tokensToRewind = tokens.filter(
    //   (_, i) => balances && balances[i].gt(0)
    // );
    const rebalancer = YapeRebalancer__factory.connect(
      YAPE_REBALANCER,
      library
    );
    handleTransaction(
      rebalancer.connect(signer).rebalanceAll(pairsToRebalance),
      setTxStatus,
      addToast,
      `Successfully rewinded!`
    );
  };
  return (
    <Card>
      <Card.Body>
        <Card.Text>
          Value
          <br />
          {totalVal}
        </Card.Text>
        <ConditionalButton
          enabledWhen={
            tokens.filter((_, i) => balances && balances[i]?.gt(0)).length > 0
          }
          whyDisabled={"No YAPE to distribute"}
          onClick={() => rewindAll()}
        >
          Rewind all
        </ConditionalButton>{" "}
        <ConditionalButton
          enabledWhen={tokens.length > 0}
          whyDisabled={"No lp to rebalance"}
          onClick={() => rebalanceAll()}
        >
          Rebalance all
        </ConditionalButton>
      </Card.Body>
    </Card>
  );
};
