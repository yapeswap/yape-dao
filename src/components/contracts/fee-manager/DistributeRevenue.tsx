import { isAddress } from "@ethersproject/address";
import { useWeb3React } from "@web3-react/core";
import { ERC20__factory } from "@workhard/protocol";
import { BigNumber, providers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import { Col, Row, Form, Button, Card } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { useStores } from "../../../hooks/user-stores";

export const DistributeReward: React.FC<{
  token: string;
  rewardToken: string;
  feeManager: string;
}> = ({ token, rewardToken, feeManager }) => {
  const { library } = useWeb3React<providers.Web3Provider>();
  const { addToast } = useToasts();
  const { mineStore } = useStores();

  const [balance, setBalance] = useState<BigNumber>();
  const [price, setPrice] = useState<number>();
  const [decimal, setDecimal] = useState<number>();
  const [asset, setAsset] = useState<string>();
  useEffect(() => {
    if (!library) return;
    ERC20__factory.connect(token, library)
      .balanceOf(feeManager)
      .then(setBalance);
  }, [token, library]);

  useEffect(() => {
    if (!library) return;
    mineStore.loadDecimal(token).then(setDecimal);
    mineStore.loadVisionPrice().then(setPrice);
  }, [library, token]);
  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  useEffect(() => {
    if (!balance || !price || !decimal) return;
    const revenue = parseFloat(formatUnits(balance, decimal)) * price;
    setAsset(usdFormatter.format(revenue > 0 ? revenue : 0));
  }, [price, balance, decimal]);
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
          {asset}
        </Card.Text>
        <Button>Distribute</Button>
      </Card.Body>
    </Card>
  );
};
