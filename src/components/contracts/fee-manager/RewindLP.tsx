import { isAddress } from "@ethersproject/address";
import { useWeb3React } from "@web3-react/core";
import { providers } from "ethers";
import React, { useEffect, useState } from "react";
import { Col, Row, Form, Button, Card } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { PoolType } from "../../../utils/ERC165Interfaces";
import {
  errorHandler,
  getTokenSymbol,
  getTokenType,
  TokenType,
} from "../../../utils/utils";

export const RewindLP: React.FC<{
  token: string;
  rewardToken: string;
}> = ({ token }) => {
  const { library } = useWeb3React<providers.Web3Provider>();
  const { addToast } = useToasts();
  return (
    <Card>
      <Card.Body>
        <Form>
          <Form.Group>
            <Form.Label>Token Address{token}</Form.Label>
          </Form.Group>
        </Form>
        <Button>Swap</Button>
      </Card.Body>
    </Card>
  );
};
