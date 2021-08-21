import React, { useEffect, useState } from "react";
import { Col, Row, Container, Button, Card, Form } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  compareAddress,
  errorHandler,
  safeTxHandler,
  TxStatus,
} from "../../../utils/utils";
import { BuyBack } from "./BuyBack";
import { useToasts } from "react-toast-notifications";
import { BigNumber, providers, constants } from "ethers";
import { MiningPool__factory } from "@workhard/protocol";
import { useWeb3React } from "@web3-react/core";
import { randomBytes } from "ethers/lib/utils";
import { RewindLP } from "./RewindLP";
import { DistributeRevenue } from "./DistributeRevenue";
import { YAPE_ADDRESS, YAPE_FEE_MANAGER } from "../../../constants";
import { useStores } from "../../../hooks/user-stores";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import config from "../../../config.json";
import { RewindAll } from "./RewindAll";

export const FeeManager: React.FC<{
  tokens: string[];
  lps: string[];
}> = ({ tokens, lps }) => {
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const { addToast } = useToasts();
  const { mineStore } = useStores();
  const { blockNumber } = useBlockNumber();
  const [balance, setBalance] = useState<BigNumber>();
  const [txStatus, setTxStatus] = useState<TxStatus>();

  // const rewardToken = YAPE_ADDRESS
  const rewardToken = YAPE_ADDRESS;
  const feeManager = YAPE_FEE_MANAGER;
  return (
    <Container>
      <Row>
        <Col md={6}>
          <h2>Rewind all</h2>
          <RewindAll tokens={lps} feeManager={feeManager} />
        </Col>
        <Col md={6}>
          <h2>Distribute</h2>
          <DistributeRevenue
            rewardToken={rewardToken}
            feeManager={feeManager}
          />
        </Col>
      </Row>
      <hr />
      <h2>Tokens</h2>
      <Row>
        {tokens
          ?.filter((token) => token !== rewardToken)
          .map((token) => (
            <Col md={6}>
              <BuyBack
                token={token}
                rewardToken={rewardToken}
                feeManager={feeManager}
              />
            </Col>
          ))}
      </Row>
      <hr />
      <h2>LPs</h2>
      <Row>
        {lps?.map((token) => (
          <Col md={6}>
            <RewindLP lpToken={token} feeManager={feeManager} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};
