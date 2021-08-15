import React, { useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import {
  Card,
  Button,
  Form,
  InputGroup,
  Image,
  ProgressBar,
  Row,
  Modal,
} from "react-bootstrap";
import {
  useWorkhard,
  WorkhardLibrary,
} from "../../../providers/WorkhardProvider";
import { formatEther, getAddress, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import {
  ERC20StakeMiningV1__factory,
  ERC20__factory,
  MiningPool__factory,
} from "@workhard/protocol";
import {
  errorHandler,
  getTokenLogo,
  getVariantForProgressBar,
  handleTransaction,
  isApproved,
  TxStatus,
  usdFormatter,
  weiToEth,
} from "../../../utils/utils";
import {
  CoingeckoTokenDetails,
  getTokenDetailsFromCoingecko,
} from "../../../utils/coingecko";
import { useToasts } from "react-toast-notifications";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { Col } from "react-bootstrap";
import { ConditionalButton } from "../../ConditionalButton";
import { UniswapV2ERC20__factory } from "@workhard/protocol/dist/build/@uniswap";

export interface ERC20StakeMiningV1Props {
  poolIdx: number;
  title: string;
  tokenName?: string;
  poolAddress: string;
  totalEmission: BigNumber;
  apy: number;
  tvl: number;
  emissionWeightSum: BigNumber;
  description?: string;
  link?: string;
  tokens?: string[];
}

export const ERC20StakeMiningV1: React.FC<ERC20StakeMiningV1Props> = ({
  poolIdx,
  title,
  tokenName,
  poolAddress,
  apy,
  tvl,
  description,
  totalEmission,
  emissionWeightSum,
  link,
  tokens,
}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const workhardCtx = useWorkhard();
  const { addToast } = useToasts();

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const [tokenAddress, setTokenAddress] = useState<string>();
  const [tokenBalance, setTokenBalance] = useState<BigNumber>();
  const [symbol, setSymbol] = useState<string>();
  const [stakedAmount, setStakedAmount] = useState<BigNumber>();
  const [totalStake, setTotalStake] = useState<BigNumber>();
  const [tokenPrice, setTokenPrice] = useState<number>();
  const [tokenDetails, setTokenDetails] = useState<CoingeckoTokenDetails>();
  const [weight, setWeight] = useState<BigNumber>();
  const [allocatedVISION, setAllocatedVISION] = useState<BigNumber>(
    constants.Zero
  );
  const [stakeOrWithdraw, toggleStakeOrWithdraw] = useState<boolean>(true);
  const [stakePercent, setStakePercent] = useState<number>();
  const [allowance, setAllowance] = useState<BigNumber>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [amount, setAmount] = useState<string>("0");
  const [mined, setMined] = useState<BigNumber>();
  // const [apy, setAPY] = useState<number>();

  const getMaxAmount = () =>
    stakeOrWithdraw
      ? formatEther(tokenBalance || "0")
      : formatEther(stakedAmount || "0");

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      MiningPool__factory.connect(poolAddress, library)
        .baseToken()
        .then(setTokenAddress)
        .catch(errorHandler(addToast));
      workhardCtx.dao.visionEmitter
        .getPoolWeight(poolIdx)
        .then(setWeight)
        .catch(errorHandler(addToast));
    }
  }, [account, workhardCtx]);

  useEffect(() => {
    if (weight) {
      if (emissionWeightSum.eq(0)) {
        setAllocatedVISION(BigNumber.from(0));
      } else {
        setAllocatedVISION(totalEmission.mul(weight).div(emissionWeightSum));
      }
    }
  }, [weight]);
  useEffect(() => {
    if (!!account && !!tokenAddress) {
      const token = ERC20__factory.connect(tokenAddress, library);
      token
        .balanceOf(account)
        .then(setTokenBalance)
        .catch(errorHandler(addToast));
      getTokenDetailsFromCoingecko(tokenAddress)
        .then(setTokenDetails)
        .catch(errorHandler(addToast));
      const pool = ERC20StakeMiningV1__factory.connect(poolAddress, library);
      pool
        .dispatchedMiners(account)
        .then(setStakedAmount)
        .catch(errorHandler(addToast));
      pool.totalMiners().then(setTotalStake).catch(errorHandler(addToast));
      pool.mined(account).then(setMined).catch(errorHandler(addToast));
      ERC20__factory.connect(tokenAddress, library)
        .allowance(account, poolAddress)
        .then(setAllowance)
        .catch(errorHandler(addToast));
    }
  }, [account, tokenAddress, txStatus, blockNumber]);

  useEffect(() => {
    if (stakedAmount && tokenBalance) {
      const sum = stakedAmount.add(tokenBalance);
      const percent = sum.eq(0) ? 0 : stakedAmount.mul(100).div(sum).toNumber();
      setStakePercent(percent);
    }
  }, [stakedAmount, tokenBalance, txStatus]);

  useEffect(() => {
    if (!!tokenAddress) {
      ERC20__factory.connect(tokenAddress, library)
        .symbol()
        .then(setSymbol)
        .catch(errorHandler(addToast));
    }
  }, [tokenAddress, library]);

  const approve = () => {
    if (!account || !tokenAddress) {
      alert("Not connected");
      return;
    }
    if (isApproved(allowance, amount)) {
      alert("Already approved");
      return;
    }
    const signer = library.getSigner(account);
    const token = ERC20__factory.connect(tokenAddress, library);
    handleTransaction(
      token.connect(signer).approve(poolAddress, constants.MaxUint256),
      setTxStatus,
      addToast,
      `Approved MiningPool ${poolAddress}`
    );
    return;
  };

  const stake = () => {
    if (!account) {
      alert("Not connected");
      return;
    }
    if (!isApproved(allowance, amount)) {
      alert("Not approved");
      return;
    }
    const signer = library.getSigner(account);
    const erc20StakeMiningV1 = ERC20StakeMiningV1__factory.connect(
      poolAddress,
      library
    );
    const amountToStakeInWei = parseEther(amount || "0");
    if (!tokenBalance) {
      alert("Fetching balance..");
      return;
    } else if (tokenBalance && amountToStakeInWei.gt(tokenBalance)) {
      alert("Not enough amount.");
      return;
    }
    handleTransaction(
      erc20StakeMiningV1.connect(signer).stake(amountToStakeInWei),
      setTxStatus,
      addToast,
      `Successfully staked!`
    );
  };

  const withdraw = () => {
    if (!account) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    const erc20StakeMiningV1 = ERC20StakeMiningV1__factory.connect(
      poolAddress,
      library
    );
    // const stakingToken =
    const amountToWithdrawInWei = parseEther(amount || "0");
    if (!stakedAmount) {
      alert("Fetching balance..");
      return;
    } else if (stakedAmount && amountToWithdrawInWei.gt(stakedAmount)) {
      alert("Not enough amount.");
      return;
    }
    handleTransaction(
      erc20StakeMiningV1.connect(signer).withdraw(amountToWithdrawInWei),
      setTxStatus,
      addToast,
      `Successfully withdrew!`
    );
  };

  const mine = () => {
    if (!account || !library) {
      alert("Not connected");
      return;
    }
    if (!mined || mined.eq(0)) {
      alert(`No ${workhardCtx?.metadata.visionSymbol || "$VISION"} mined`);
      return;
    }
    const signer = library.getSigner(account);
    const erc20StakeMiningV1 = ERC20StakeMiningV1__factory.connect(
      poolAddress,
      library
    );
    handleTransaction(
      erc20StakeMiningV1.connect(signer).mine(),
      setTxStatus,
      addToast,
      `Successfully mined!`
    );
  };

  const exit = () => {
    if (!account || !library) {
      alert("Not connected");
      return;
    }
    if (!mined || mined.eq(0)) {
      alert(`No ${workhardCtx?.metadata.visionSymbol || "$VISION"} mined`);
      return;
    }
    const signer = library.getSigner(account);
    const erc20StakeMiningV1 = ERC20StakeMiningV1__factory.connect(
      poolAddress,
      library
    );
    // const stakingToken =
    handleTransaction(
      erc20StakeMiningV1.connect(signer).exit(),
      setTxStatus,
      addToast,
      `Successfully exited!`
    );
  };
  const isStakableAmount = () => {
    try {
      return tokenBalance?.gte(parseEther(amount));
    } catch (e) {
      console.log(e);
      return false;
    }
  };

  return (
    <div>
      <Modal
        show={show}
        onHide={handleClose}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header>
          <Modal.Title>
            {title}{" "}
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
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {description && (
            <>
              <p>{description}</p>
              <hr />
            </>
          )}
          <Row>
            <Col style={{ marginBottom: "1rem" }}>
              <Card.Title>APY</Card.Title>
              <Card.Text>
                <span style={{ fontSize: "1.5rem" }}>{apy?.toFixed(0)}</span> %
              </Card.Text>
            </Col>
            <Col style={{ marginBottom: "1rem", minWidth: "11rem" }}>
              <Card.Title>Mined</Card.Title>
              <Card.Text style={{ fontSize: "1.5rem" }}>
                {parseFloat(formatEther(mined || 0)).toFixed(2)}{" "}
                <span style={{ fontSize: "0.75rem" }}>
                  {workhardCtx?.metadata.visionSymbol || "VISION"}
                </span>
              </Card.Text>
            </Col>
            <Col style={{ marginBottom: "1rem", minWidth: "12rem" }}>
              <Card.Title>Weekly allocation</Card.Title>
              <Card.Text style={{ fontSize: "1.5rem" }}>
                {parseFloat(formatEther(allocatedVISION)).toFixed(2)}{" "}
                <span style={{ fontSize: "0.75rem" }}>
                  {workhardCtx?.metadata.visionSymbol || "VISION"}
                </span>
              </Card.Text>
            </Col>
          </Row>
          <hr />
          <Form>
            <Form.Group>
              <InputGroup className="mb-2">
                <InputGroup.Prepend>
                  <InputGroup.Text>
                    <span
                      onClick={() => {
                        toggleStakeOrWithdraw(true);
                        setAmount("");
                      }}
                      style={{
                        cursor: stakeOrWithdraw ? undefined : "pointer",
                        textDecoration: stakeOrWithdraw
                          ? "underline"
                          : undefined,
                      }}
                    >
                      Stake
                    </span>
                    /
                    <span
                      onClick={() => {
                        toggleStakeOrWithdraw(false);
                        setAmount("");
                      }}
                      style={{
                        cursor: stakeOrWithdraw ? "pointer" : undefined,
                        textDecoration: stakeOrWithdraw
                          ? undefined
                          : "underline",
                      }}
                    >
                      Withdraw
                    </span>
                  </InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  value={amount}
                  onChange={({ target: { value } }) => setAmount(value)}
                  placeholder={getMaxAmount()}
                />
                <InputGroup.Append
                  style={{ cursor: "pointer" }}
                  onClick={() => setAmount(getMaxAmount())}
                >
                  <InputGroup.Text>MAX</InputGroup.Text>
                </InputGroup.Append>
              </InputGroup>
            </Form.Group>
            <ProgressBar
              variant={getVariantForProgressBar(stakePercent || 0)}
              animated
              now={stakePercent}
            />
            <Card.Text>
              {weiToEth(stakedAmount || 0, 6)} /
              {weiToEth(stakedAmount?.add(tokenBalance || 0) || 0, 6)} of your{" "}
              {tokenName || tokenDetails?.name} is staked.
            </Card.Text>
            <Row>
              <Col md={8}>
                <ConditionalButton
                  enabledWhen={!stakedAmount?.isZero()}
                  whyDisabled="you are not mining."
                  variant="outline-primary"
                  onClick={mine}
                >
                  Mine
                </ConditionalButton>{" "}
                <ConditionalButton
                  enabledWhen={!stakedAmount?.isZero()}
                  whyDisabled="you are not mining."
                  variant="outline-primary"
                  onClick={exit}
                >
                  Mine & Exit
                </ConditionalButton>{" "}
                <Button
                  as={"a"}
                  href={
                    tokens &&
                    `https://app.yape.exchange/#/add/ETH/${tokens[0]}/${tokens[1]}`
                  }
                  disabled={!tokens}
                  target={"blank"}
                >
                  Go to add liquidity{" "}
                  <FontAwesomeIcon
                    icon={faExternalLinkAlt}
                    style={{ cursor: "pointer" }}
                  />
                </Button>
              </Col>
              <Col md={4} style={{ textAlign: "end" }}>
                <ConditionalButton
                  variant="success"
                  enabledWhen={
                    isStakableAmount() && txStatus !== TxStatus.PENDING
                  }
                  whyDisabled="not enough balance"
                  onClick={
                    stakeOrWithdraw
                      ? isApproved(allowance, amount)
                        ? stake
                        : approve
                      : withdraw
                  }
                >
                  {stakeOrWithdraw
                    ? isApproved(allowance, amount)
                      ? "Stake"
                      : "Approve"
                    : "Withdraw"}
                </ConditionalButton>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
      </Modal>
      <Card onClick={handleShow} style={{ cursor: "pointer" }}>
        <Card.Header>
          {title}
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
          <Row>
            <Col style={{ marginBottom: "1rem" }}>
              <Card.Title>APY</Card.Title>
              <Card.Text>
                <span style={{ fontSize: "1.5rem" }}>{apy?.toFixed(0)}</span> %
              </Card.Text>
            </Col>
            <Col style={{ marginBottom: "1rem", minWidth: "11rem" }}>
              <Card.Title>Mined</Card.Title>
              <Card.Text style={{ fontSize: "1.5rem" }}>
                {parseFloat(formatEther(mined || 0)).toFixed(2)}{" "}
                <span style={{ fontSize: "0.75rem" }}>
                  {workhardCtx?.metadata.visionSymbol || "VISION"}
                </span>
              </Card.Text>
            </Col>
          </Row>
          Total: {usdFormatter.format(tvl)}
        </Card.Body>
      </Card>
    </div>
  );
};
