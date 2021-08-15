import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Image, Col, Row, Card, Button, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import { EmissionChart } from "../../components/views/EmissionChart";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { BigNumber } from "@ethersproject/bignumber";
import { useToasts } from "react-toast-notifications";
import {
  bigNumToFixed,
  errorHandler,
  fetchProjectMetadataFromIPFS,
  ProjectMetadata,
  uriToURL,
} from "../../utils/utils";
import { getAddress } from "ethers/lib/utils";
import { useIPFS } from "../../providers/IPFSProvider";
import { OverlayTooltip } from "../../components/OverlayTooltip";
import { Erc20Balance } from "../../components/contracts/erc20/Erc20Balance";
import { ApeSays } from "../../components/views/ApeSays";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Allocation } from "../../components/contracts/vision-emitter/Allocation";
import { useBlockNumber } from "../../providers/BlockNumberProvider";

const Dashboard = () => {
  const { addToast } = useToasts();

  const workhardCtx = useWorkhard();
  const { daoId } = workhardCtx || { daoId: 0 };

  const [emissionRule, setEmissionRule] = useState<{
    initialEmission: BigNumber;
    emissionCut: number;
    minimumRate: number;
    currentWeek: number;
  }>({
    initialEmission: BigNumber.from(0),
    emissionCut: 0,
    minimumRate: 0,
    currentWeek: 0,
  });

  const { ipfs } = useIPFS();
  const { blockNumber } = useBlockNumber();
  const [metadata, setMetadata] = useState<ProjectMetadata>();
  const [emissionStarted, setEmissionStarted] = useState<number>();
  const [mintable, setMintable] = useState<BigNumber>();
  const [burnedCommit, setBurnedCommit] = useState<BigNumber>();
  const [baseCurrencySymbol, setBaseCurrencySymbol] = useState<string>();
  const [visionSupply, setVisionSupply] = useState<BigNumber>();
  const [rightSupply, setRightSupply] = useState<BigNumber>();
  const [remainingTime, setRemainingTime] = useState<number>();

  useEffect(() => {
    if (daoId === 0) {
      // fast load for master dao
      setMetadata({
        name: "Work Hard Finance",
        description:
          "Work Hard Finance empowers contributors with the choice to be compensated now, in stablecoins, or in the future via liquid stock options. No more stressful haggling over what’s fair — your compensation, in your hands, real time.",
        image: "ipfs://QmPj8nm5d9hPVp7te9qiAWYvDkdnQaz1uNgU9mxN5ym5Ei",
        url: "https://workhard.finance",
      });
    }
    if (workhardCtx) {
      // get emission rule
      Promise.all([
        workhardCtx.dao.visionEmitter.INITIAL_EMISSION(),
        workhardCtx.dao.visionEmitter.emissionCutRate(),
        workhardCtx.dao.visionEmitter.minEmissionRatePerWeek(),
        workhardCtx.dao.visionEmitter.emissionWeekNum(),
      ])
        .then(([initialEmission, emissionCut, minimumRate, currentWeek]) => {
          setEmissionRule({
            initialEmission,
            emissionCut: emissionCut.toNumber(),
            minimumRate: minimumRate.toNumber(),
            currentWeek: currentWeek.toNumber(),
          });
        })
        .catch(errorHandler(addToast));
      workhardCtx.dao.visionEmitter
        .emissionStarted()
        .then((num) => setEmissionStarted(num.toNumber()))
        .catch(errorHandler(addToast));
      workhardCtx.dao.stableReserve
        .mintable()
        .then(setMintable)
        .catch(errorHandler(addToast));
      workhardCtx.dao.baseCurrency
        .symbol()
        .then(setBaseCurrencySymbol)
        .catch(errorHandler(addToast));
      workhardCtx.dao.vision
        .totalSupply()
        .then(setVisionSupply)
        .catch(errorHandler(addToast));
      workhardCtx.dao.right
        .totalSupply()
        .then(setRightSupply)
        .catch(errorHandler(addToast));
      workhardCtx.dao.commit
        .totalBurned()
        .then(setBurnedCommit)
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, daoId]);

  useEffect(() => {
    if (!!workhardCtx && !!ipfs) {
      const projId = daoId || 0;
      workhardCtx.project
        .tokenURI(projId)
        .then(async (uri) => {
          setMetadata(await fetchProjectMetadataFromIPFS(ipfs, uri));
        })
        .catch(errorHandler(addToast));
    }
  }, [workhardCtx, daoId, ipfs]);

  useEffect(() => {
    setRemainingTime(
      Math.max(1629131191 - Math.floor(Date.now() / 1000), 0) / 3600
    );
  }, [blockNumber]);

  const poolName = (address: string): string => {
    if (workhardCtx) {
      if (
        getAddress(address) ===
        getAddress(workhardCtx.periphery.liquidityMining.address)
      ) {
        return "Liquidity Providers";
      } else if (
        getAddress(address) ===
        getAddress(workhardCtx.periphery.commitMining.address)
      ) {
        return "Commit Burners";
      }
    }
    return address;
  };

  const fetching = (
    <Page>
      <ApeSays say={`Loading...`} />
    </Page>
  );
  const fetched = (
    <Page>
      <Row>
        <Col md={4}>
          <Image
            src={process.env.PUBLIC_URL + "/images/YAPE-TOKEN.png"}
            style={{ maxWidth: "70%" }}
          />
        </Col>
        <Col md={8}>
          <h2>Welcome to Yapeswap DAO page!</h2>
          <p>{metadata?.description}</p>
          <p className={"text-primary"}>
            <strong>
              {remainingTime === 0
                ? `Emission started!`
                : `Emission starts in ${remainingTime?.toFixed(1)} hours!`}
            </strong>
          </p>
        </Col>
      </Row>
      <hr />
      <h2>
        <b>Your balance</b>
      </h2>
      <Row>
        <Col md={4} style={{ padding: 0 }}>
          <Erc20Balance
            title={workhardCtx?.metadata.commitSymbol || "COMMIT"}
            description={
              "Show your true, long-term belief in your project. Burn cYAPE to continuously mine YAPE."
            }
            symbolAlt={" "}
          >
            <Button as={Link} to={"work"}>
              Go to work
            </Button>
          </Erc20Balance>
        </Col>
        <Col md={4} style={{ padding: 0 }}>
          <Erc20Balance
            title={workhardCtx?.metadata.visionSymbol || "VISION"}
            description={"Yapeswap DAO token"}
            address={workhardCtx?.dao.vision.address}
            symbolAlt={" "}
          >
            <Button as={Link} to={"mine"}>
              Go to mine
            </Button>
          </Erc20Balance>
        </Col>
        <Col md={4} style={{ padding: 0 }}>
          <Erc20Balance
            title={workhardCtx?.metadata.rightSymbol || "RIGHT"}
            description={
              "Lock your YAPE and get veYAPE. You can get voting powers and protocol revenues."
            }
            address={workhardCtx?.dao.right.address}
            symbolAlt={" "}
          >
            <Button as={Link} to={"gov"}>
              Go to lock ${workhardCtx?.metadata.visionSymbol}
            </Button>
          </Erc20Balance>
        </Col>
      </Row>
      <br />
      <Row>
        <Col md={6}>
          <h2>
            <b>Emission</b> schedule
          </h2>
          <EmissionChart {...emissionRule} />
          <p>
            Emission started at{" "}
            {emissionStarted && new Date(emissionStarted * 1000).toDateString()}{" "}
            and its first distribution was{" "}
            {emissionStarted &&
              new Date(
                emissionStarted * 1000 + 86400 * 7 * 1000
              ).toDateString()}
          </p>
        </Col>
        <Col md={6}>
          <h2>
            <b>Allocation</b>
          </h2>
          <Allocation />
        </Col>
      </Row>
      <h2>
        <b>Statistics</b>
      </h2>
      <Row>
        <Col md={3} style={{ padding: 0 }}>
          <Card>
            <div style={{ position: "absolute", right: "1rem", top: "1rem" }}>
              <OverlayTooltip
                tip={`Governance can mint more ${
                  workhardCtx?.metadata.commitSymbol || "COMMIT"
                } and give grants to contributors.`}
              >
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  style={{ cursor: "pointer" }}
                />
              </OverlayTooltip>
            </div>
            <Card.Body>
              <Card.Title className={"text-primary"}>
                Mintable COMMIT
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(mintable || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${baseCurrencySymbol}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} style={{ padding: 0 }}>
          <Card>
            <div style={{ position: "absolute", right: "1rem", top: "1rem" }}>
              <OverlayTooltip
                tip={`A stablecoin to tokenize your revenue stream. Pay your workers with value-added money.`}
              >
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  style={{ cursor: "pointer" }}
                />
              </OverlayTooltip>
            </div>
            <Card.Body>
              <Card.Title className={"text-primary"}>
                Burned {workhardCtx?.metadata.commitSymbol || "COMMIT"}
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(burnedCommit || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${workhardCtx?.metadata.commitSymbol || "COMMIT"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} style={{ padding: 0 }}>
          <Card>
            <div style={{ position: "absolute", right: "1rem", top: "1rem" }}>
              <OverlayTooltip
                tip={`Liquid stock options for your project. Believers are ${
                  workhardCtx?.metadata.visionSymbol || "VISION"
                } long term HODLers. Unbelievers can easily exit.`}
              >
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  style={{ cursor: "pointer" }}
                />
              </OverlayTooltip>
            </div>
            <Card.Body>
              <Card.Title className={"text-primary"}>
                Total {workhardCtx?.metadata.visionSymbol || "VISION"}
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(visionSupply || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${workhardCtx?.metadata.visionSymbol || "VISION"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} style={{ padding: 0 }}>
          <Card>
            <div style={{ position: "absolute", right: "1rem", top: "1rem" }}>
              <OverlayTooltip
                tip={`
                  Reward your long term ${
                    workhardCtx?.metadata.visionSymbol || "VISION"
                  } believers with access to devidends and voting power.`}
              >
                <FontAwesomeIcon
                  icon={faInfoCircle}
                  style={{ cursor: "pointer" }}
                />
              </OverlayTooltip>
            </div>
            <Card.Body>
              <Card.Title className={"text-primary"}>
                Total {workhardCtx?.metadata.rightSymbol || "RIGHT"}
              </Card.Title>
              <Card.Text style={{ fontSize: "2rem" }}>
                {bigNumToFixed(rightSupply || 0)}
                <span style={{ fontSize: "1rem" }}>
                  {" "}
                  {`$${workhardCtx?.metadata.rightSymbol || "RIGHT"}`}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <br />
      <br />
      <h2>
        <b>Contracts</b>
      </h2>
      <Row>
        <Col md={7}>
          <Table>
            <thead>
              <tr>
                <th scope="col">Contract Name</th>
                <th scope="col">Address</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Workhard Project Contract", workhardCtx?.project.address],
                ["Multisig", workhardCtx?.dao.multisig.address],
                ["Timelock", workhardCtx?.dao.timelock.address],
                [
                  workhardCtx?.metadata.visionName,
                  workhardCtx?.dao.vision.address,
                ],
                [
                  workhardCtx?.metadata.commitName,
                  workhardCtx?.dao.commit.address,
                ],
                [
                  workhardCtx?.metadata.rightName,
                  workhardCtx?.dao.right.address,
                ],
                [
                  workhardCtx?.metadata.baseCurrencySymbol,
                  workhardCtx?.dao.baseCurrency.address,
                ],
                ["Stable Reserve", workhardCtx?.dao.stableReserve.address],
                [
                  "Contribution Board",
                  workhardCtx?.dao.contributionBoard.address,
                ],
                ["Marketplace", workhardCtx?.dao.marketplace.address],
                ["Dividend Pool", workhardCtx?.dao.dividendPool.address],
                ["Vote Counter", workhardCtx?.dao.voteCounter.address],
                ["Workers Union", workhardCtx?.dao.workersUnion.address],
                ["Token Emitter", workhardCtx?.dao.visionEmitter.address],
                ["Voting Escrow", workhardCtx?.dao.votingEscrow.address],
                [
                  "Yapeswap Router",
                  "0xCC00b641305c639D9f2b3c34067C69679EE1DBEF",
                ],
                [
                  "Yapeswap Factory",
                  "0x46aDc1C052Fafd590F56C42e379d7d16622835a2",
                ],
                [
                  "Yapeswap FeeManager",
                  "0x44DeD95dB022FeA1C78a5a909a337291F0D081b6",
                ],
                [
                  `${workhardCtx?.metadata.visionSymbol}/ETH LP`,
                  workhardCtx?.periphery.visionLP.address,
                ],
              ].map((contract) => (
                <tr>
                  <td>{contract[0]}</td>
                  <td>
                    <>
                      <a
                        href={`https://etherscan.io/address/${contract[1]}`}
                        target="_blank"
                      >
                        {contract[1]}
                      </a>
                    </>
                  </td>
                  <td>
                    <CopyToClipboard
                      text={contract[1] || ""}
                      onCopy={() =>
                        addToast({
                          variant: "info",
                          content: "copied!",
                        })
                      }
                    >
                      <FontAwesomeIcon
                        icon={faCopy}
                        style={{ cursor: "pointer" }}
                      />
                    </CopyToClipboard>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Page>
  );

  return !!metadata && !!workhardCtx ? fetched : fetching;
};

export default Dashboard;
