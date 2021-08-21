import React, { useEffect, useState } from "react";
import { BigNumber, constants } from "ethers";
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  InputGroup,
  Modal,
  ProgressBar,
  Row,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { formatEther, parseEther } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import {
  ERC20__factory,
  ERC20BurnMiningV1__factory,
  MiningPool__factory,
} from "@workhard/protocol";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import {
  // errorHandler,
  getTokenLogo,
  getVariantForProgressBar,
  handleTransaction,
  isApproved,
  TxStatus,
  usdFormatter,
} from "../../../utils/utils";
import {
  CoingeckoTokenDetails,
  getPriceFromCoingecko,
  getTokenDetailsFromCoingecko,
} from "../../../utils/coingecko";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { useToasts } from "react-toast-notifications";
import { ConditionalButton } from "../../ConditionalButton";

export interface ERC20BurnMiningV1Props {
  poolIdx: number;
  title: string;
  tokenName?: string;
  poolAddress: string;
  totalEmission: BigNumber;
  emissionWeightSum: BigNumber;
  apy: number;
  tvl: number;
  maxAPY?: number;
  description?: string;
  collapsible?: boolean;
  link?: string;
  tokens?: string[];
}

export const ERC20BurnMiningV1: React.FC<ERC20BurnMiningV1Props> = ({
  poolIdx,
  title,
  tokenName,
  poolAddress,
  totalEmission,
  apy,
  maxAPY,
  tvl,
  description,
  collapsible,
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
  const [burnedAmount, setBurnedAmount] = useState<BigNumber>();
  const [totalBurn, setTotalBurn] = useState<BigNumber>();
  const [tokenPrice, setTokenPrice] = useState<number>();
  const [tokenDetails, setTokenDetails] = useState<CoingeckoTokenDetails>();
  const [weight, setWeight] = useState<BigNumber>();
  const [allocatedVISION, setAllocatedVISION] = useState<BigNumber>(
    constants.Zero
  );
  const [allowance, setAllowance] = useState<BigNumber>();
  const [burnPercent, setBurnPercent] = useState<number>();
  const [amount, setAmount] = useState<string>();
  const [mined, setMined] = useState<BigNumber>();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  // const [annualRevenue, setAnnualRevenue] = useState<number>();

  const getMaxAmount = () => formatEther(tokenBalance || "0");

  useEffect(() => {
    if (!!account && !!workhardCtx) {
      MiningPool__factory.connect(poolAddress, library)
        .baseToken()
        .then(setTokenAddress)
        .catch(console.error);
      workhardCtx.dao.visionEmitter
        .getPoolWeight(poolIdx)
        .then(setWeight)
        .catch(console.error);
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
      token.balanceOf(account).then(setTokenBalance).catch(console.error);
      getPriceFromCoingecko(tokenAddress)
        .then(setTokenPrice)
        .catch(console.error);
      getTokenDetailsFromCoingecko(tokenAddress)
        .then(setTokenDetails)
        .catch(console.error);
      const pool = ERC20BurnMiningV1__factory.connect(poolAddress, library);
      pool.dispatchedMiners(account).then(setBurnedAmount).catch(console.error);
      pool.totalMiners().then(setTotalBurn).catch(console.error);
      pool.mined(account).then(setMined).catch(console.error);
      ERC20__factory.connect(tokenAddress, library)
        .allowance(account, poolAddress)
        .then(setAllowance)
        .catch(console.error);
    }
  }, [account, tokenAddress, txStatus, blockNumber]);

  useEffect(() => {
    if (!!tokenAddress) {
      ERC20__factory.connect(tokenAddress, library)
        .symbol()
        .then(setSymbol)
        .catch(console.error);
    }
  }, [tokenAddress, library]);

  useEffect(() => {
    if (burnedAmount && tokenBalance) {
      const sum = burnedAmount.add(tokenBalance);
      const percent = sum.eq(0) ? 0 : burnedAmount.mul(100).div(sum).toNumber();
      setBurnPercent(percent);
    }
  }, [burnedAmount, tokenBalance]);

  // useEffect(() => {
  //   if (weight && tokenPrice && totalBurn) {
  //     const visionPerWeek = parseFloat(
  //       formatEther(totalEmission.mul(weight).div(emissionWeightSum))
  //     );
  //     const totalBurnedToken = parseFloat(formatEther(totalBurn));
  //     setAnnualRevenue(
  //       100 *
  //         ((visionPerWeek * visionPrice * 52) /
  //           (totalBurnedToken * tokenPrice) -
  //           1)
  //     );
  //   } else {
  //     setAnnualRevenue(NaN);
  //   }
  // }, [weight, tokenPrice, totalBurn]);

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

  const burn = () => {
    if (!account) {
      alert("Not connected");
      return;
    }
    if (
      !window.confirm(
        "You are burning your cYAPE! NOT Staking.\n\nBurning your cYAPE means you're acquiring YAPE instead of redeemable DAI! The jungle is pleased with your dedication."
      )
    ) {
      return;
    }
    if (!isApproved(allowance, amount)) {
      alert("Not approved");
      return;
    }
    const signer = library.getSigner(account);
    const erc20BurnMiningV1 = ERC20BurnMiningV1__factory.connect(
      poolAddress,
      library
    );
    const amountToBurnInWei = parseEther(amount || "0");
    if (!tokenBalance) {
      alert("Fetching balance..");
      return;
    } else if (tokenBalance && amountToBurnInWei.gt(tokenBalance)) {
      alert("Not enough amount.");
      return;
    }
    handleTransaction(
      erc20BurnMiningV1.connect(signer).burn(amountToBurnInWei),
      setTxStatus,
      addToast,
      "Successfully burned!"
    );
  };

  const exit = () => {
    if (!account) {
      alert("Not connected");
      return;
    }
    if (
      !window.confirm(
        "Are you aware of what you're doing? If you withdraw your mined YAPE, you won't be able to earn any more rewards"
      )
    ) {
      return;
    }
    const signer = library.getSigner(account);
    const erc20BurnMiningV1 = ERC20BurnMiningV1__factory.connect(
      poolAddress,
      library
    );

    handleTransaction(
      erc20BurnMiningV1.connect(signer).exit(),
      setTxStatus,
      addToast,
      "Successfully exited!"
    );
  };
  const isBurnableCommitAmount = () => {
    try {
      if (amount) {
        return tokenBalance?.gte(parseEther(amount));
      }
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
              <Card.Title>
                ARR{" "}
                <OverlayTooltip
                  tip={
                    "Annual Revenue Run Rate = (earned vision - burned commit) * 12 months / burned commit"
                  }
                >
                  <FontAwesomeIcon
                    icon={faInfoCircle}
                    style={{ cursor: "pointer" }}
                  />
                </OverlayTooltip>
              </Card.Title>
              <Card.Text>
                <span style={{ fontSize: "1.5rem" }}>
                  {apy.toFixed(0)}
                  {maxAPY ? ` ~ ${maxAPY.toFixed(0)}` : ""}
                </span>{" "}
                %
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
                  <InputGroup.Text>Burn</InputGroup.Text>
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
              variant={getVariantForProgressBar(burnPercent || 0)}
              animated
              now={burnPercent}
            />
            <Card.Text>
              Burned: {formatEther(burnedAmount || 0)} / Balance:{" "}
              {formatEther(
                BigNumber.from(tokenBalance || 0).add(burnedAmount || 0)
              )}
            </Card.Text>
            <Row>
              <Col>
                <ConditionalButton
                  enabledWhen={!burnedAmount?.isZero()}
                  whyDisabled="you are not mining"
                  variant="outline-danger"
                  onClick={exit}
                >
                  Stop mining and withdraw rewards
                </ConditionalButton>
              </Col>
              <Col style={{ textAlign: "end" }}>
                <ConditionalButton
                  variant="danger"
                  enabledWhen={
                    isBurnableCommitAmount() && txStatus !== TxStatus.PENDING
                  }
                  whyDisabled={
                    isBurnableCommitAmount() ? "pending" : "not enough balance"
                  }
                  onClick={isApproved(allowance, amount) ? burn : approve}
                >
                  {isApproved(allowance, amount) ? "Burn" : "Approve"}
                </ConditionalButton>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
      </Modal>
      <Card onClick={handleShow} style={{ cursor: "pointer" }}>
        <Card.Header>
          {title}{" "}
          {tokens &&
            tokens.map((addr) => (
              <>
                {" "}
                <Image
                  style={{ height: "1.5rem", borderRadius: "50%" }}
                  src={getTokenLogo(addr)}
                  alt={""}
                />
              </>
            ))}
        </Card.Header>
        <Card.Body>
          <Row>
            <Col style={{ marginBottom: "1rem" }}>
              <Card.Title>
                ARR{" "}
                <OverlayTooltip
                  tip={
                    "Annual Revenue Run Rate = (earned vision - burned commit) * 12 months / burned commit"
                  }
                >
                  <FontAwesomeIcon
                    icon={faInfoCircle}
                    style={{ cursor: "pointer" }}
                  />
                </OverlayTooltip>
              </Card.Title>
              <Card.Text>
                <span style={{ fontSize: "1.5rem" }}>
                  {apy.toFixed(0)}
                  {maxAPY ? ` ~ ${maxAPY.toFixed(0)}` : ""}
                </span>{" "}
                %
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
          Total: {usdFormatter.format(tvl).replace("$", "")} cYAPE
        </Card.Body>
      </Card>
    </div>
  );
};
