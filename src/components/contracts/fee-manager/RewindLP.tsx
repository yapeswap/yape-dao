import { useWeb3React } from "@web3-react/core";
import { ERC20__factory } from "@workhard/protocol";
import { FeeManager__factory } from "@workhard/utils";
import { BigNumber, providers } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils";
import React, { useEffect, useState } from "react";
import { Col, Row, Form, Button, Card, Image } from "react-bootstrap";
import { useToasts } from "react-toast-notifications";
import { useStores } from "../../../hooks/user-stores";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { PoolType } from "../../../utils/ERC165Interfaces";
import {
  errorHandler,
  getTokenLogo,
  getTokenSymbol,
  getTokenType,
  handleTransaction,
  TokenType,
  TxStatus,
  usdFormatter,
} from "../../../utils/utils";
import { ConditionalButton } from "../../ConditionalButton";

export const RewindLP: React.FC<{
  lpToken: string;
  feeManager: string;
}> = ({ lpToken, feeManager }) => {
  const workhardCtx = useWorkhard();
  const [balance, setBalance] = useState<BigNumber>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [tokens, setTokens] = useState<string[]>();
  const { account, library } = useWeb3React<providers.Web3Provider>();
  const [tokenSymbol, setTokenSymbol] = useState<string>();
  const { addToast } = useToasts();
  const { mineStore } = useStores();
  const [lpPrice, setLPPrice] = useState<number>();
  const [value, setValue] = useState<string>();
  const { blockNumber } = useBlockNumber();

  useEffect(() => {
    if (workhardCtx && lpToken) {
      mineStore.lpBaseTokens(lpToken).then(setTokens);
    }
  }, [workhardCtx, lpToken]);

  useEffect(() => {
    if (!library) return;
    mineStore.loadLPTokenPrice(lpToken).then(setLPPrice);
  }, [library, lpToken]);

  const usdFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  useEffect(() => {
    if (workhardCtx && lpToken) {
      getTokenSymbol(lpToken, TokenType.ERC20, workhardCtx.web3.library)
        .then(setTokenSymbol)
        .catch(console.error);
    }
  }, [workhardCtx, lpToken]);

  useEffect(() => {
    if (!balance || !lpPrice) return;
    const revenue = parseFloat(formatEther(balance)) * lpPrice;
    setValue(usdFormatter.format(revenue > 0 ? revenue : 0));
  }, [lpPrice, balance]);

  useEffect(() => {
    if (!library) return;
    ERC20__factory.connect(lpToken, library)
      .balanceOf(feeManager)
      .then(setBalance);
  }, [lpToken, library, blockNumber]);

  const rewind = async () => {
    if (!account || !library || !blockNumber) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const fm = FeeManager__factory.connect(feeManager, library);
    handleTransaction(
      fm.connect(signer).rewindUniV2(lpToken, balance),
      setTxStatus,
      addToast,
      `Successfully distributed!`
    );
  };
  return (
    <Card>
      <Card.Header>
        {tokenSymbol}
        {tokens &&
          tokens.map((addr) => (
            <>
              {" "}
              <Image
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "50%",
                  marginRight: "-0.7rem",
                }}
                src={getTokenLogo(addr)}
                alt={""}
              />
            </>
          ))}{" "}
      </Card.Header>
      <Card.Body>
        <Card.Text>
          Amount
          <br />
          {balance && formatEther(balance)}
        </Card.Text>
        <Card.Text>
          Value
          <br />
          {value || "$ 0.00"}
        </Card.Text>
        <ConditionalButton
          enabledWhen={balance?.gt(0)}
          whyDisabled={"Not enough balance or failed to find the path."}
          onClick={() => rewind()}
        >
          Rewind
        </ConditionalButton>
      </Card.Body>
    </Card>
  );
};
