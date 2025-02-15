import { useWeb3React } from "@web3-react/core";
import { ERC20__factory } from "@workhard/protocol";
import { FeeManager__factory } from "@workhard/utils";
import { BigNumber, providers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import { Button, Card } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { useStores } from "../../../hooks/user-stores";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { handleTransaction, TxStatus } from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";

export const DistributeRevenue: React.FC<{
  rewardToken: string;
  feeManager: string;
}> = ({ rewardToken, feeManager }) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const { mineStore } = useStores();

  const [balance, setBalance] = useState<BigNumber>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [price, setPrice] = useState<number>();
  const [decimal, setDecimal] = useState<number>();
  const [value, setValue] = useState<string>();
  useEffect(() => {
    if (!library) return;
    ERC20__factory.connect(rewardToken, library)
      .balanceOf(feeManager)
      .then(setBalance);
  }, [rewardToken, library, blockNumber, txStatus]);

  useEffect(() => {
    if (!library) return;
    mineStore.loadDecimal(rewardToken).then(setDecimal);
    mineStore.loadVisionPrice().then(setPrice);
  }, [library, rewardToken]);
  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  useEffect(() => {
    if (!balance || !price || !decimal) return;
    const revenue = parseFloat(formatUnits(balance, decimal)) * price;
    setValue(usdFormatter.format(revenue > 0 ? revenue : 0));
  }, [price, balance, decimal]);

  const distribute = async () => {
    if (!account || !library || !blockNumber) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const fm = FeeManager__factory.connect(feeManager, library);
    handleTransaction(
      fm.connect(signer).distribute(balance),
      setTxStatus,
      addToast,
      `Successfully distributed!`
    );
  };

  return (
    <Card>
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
          enabledWhen={balance?.gt(0)}
          whyDisabled={"No YAPE to distribute"}
          onClick={() => distribute()}
        >
          Distribute
        </ConditionalButton>
      </Card.Body>
    </Card>
  );
};
