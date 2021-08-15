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
import config from "../../../config.json";
import { DistributeReward } from "./DistributeRevenue";
import { USDC_ADDRESS, YAPE_ADDRESS } from "../../../constants";

export const FeeManager: React.FC<{
  tokens: string[];
  lps: string[];
}> = ({ tokens, lps }) => {
  // const rewardToken = YAPE_ADDRESS
  const rewardToken = USDC_ADDRESS;
  return (
    <Container>
      <h2>Tokens</h2>
      <Row>
        {tokens
          ?.filter((token) => token !== rewardToken)
          .map((token) => (
            <Col md={6}>
              <BuyBack
                token={token}
                rewardToken={rewardToken}
                feeManager={config.feeManager}
              />
            </Col>
          ))}
      </Row>
      {/* <hr />
      <h2>LPs</h2>
      <Row>
        {lps?.map((token) => (
          <Col md={6}>
            <RewindLP token={token} rewardToken={token} />
          </Col>
        ))}
      </Row> */}
    </Container>
  );
};
