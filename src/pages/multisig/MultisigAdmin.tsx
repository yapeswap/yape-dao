import React, { useState } from "react";
import Page from "../../layouts/Page";
import { Col, Row, Nav, Tab, Button, Container } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { ApeSays } from "../../components/views/ApeSays";
import { SetEmission } from "../../components/contracts/vision-emitter/SetEmission";
import { MultisigProposal } from "./tabs/MultisigProposal";
import { getNetworkName } from "@workhard/protocol";
import { useWeb3React } from "@web3-react/core";
import { providers } from "ethers";
import { ProjectDetails } from "./tabs/ProjectDetails";
import { SerHelpPlz } from "../../components/views/HelpSer";
import { FeeManager } from "../../components/contracts/fee-manager/FeeManager";

export const MultisigAdmin = () => {
  const history = useHistory();
  const { chainId } = useWeb3React<providers.Web3Provider>();
  const { subtab } = useParams<{ subtab?: string }>();
  const workhardCtx = useWorkhard();
  const { daoId } = workhardCtx || { daoId: 0 };
  const [tabKey, setTabKey] = useState<string>(subtab || "project-details");

  const fetching = (
    <Page>
      <ApeSays say={`Loading...`} />
    </Page>
  );

  const getGnosisLink = () => {
    let hostname: string;
    if (!chainId) return undefined;
    if (getNetworkName(chainId) === "rinkeby") {
      hostname = `rinkeby.gnosis-safe.io`;
    } else if (getNetworkName(chainId) === "mainnet") {
      hostname = `gnosis-safe.io`;
    } else {
      return undefined;
    }
    const multisig = workhardCtx?.dao.multisig.address;
    return `https://${hostname}/app/#/safes/${multisig}/transactions`;
  };

  const fetched = (
    <Page>
      <Tab.Container activeKey={tabKey} onSelect={(k) => k && setTabKey(k)}>
        <Row>
          <Col sm={3}>
            <Nav
              variant="pills"
              className="flex-column"
              defaultActiveKey={"project-details"}
            >
              <Nav.Item>
                <Nav.Link eventKey="project-details">Project details</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="emission">Emission setting</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="fee-manager">Fee manager</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="transaction">Multisig transaction</Nav.Link>
              </Nav.Item>
            </Nav>
            <hr />
            <Button
              variant="outline-info"
              as={"a"}
              href={getGnosisLink()}
              target="_blank"
            >
              Go to Gnosis Safe
            </Button>
          </Col>
          <Col sm={9}>
            <Tab.Content>
              <Tab.Pane
                eventKey="project-details"
                onEnter={() => {
                  history.push("/multisig/project-details");
                }}
              >
                <ProjectDetails />
              </Tab.Pane>
              <Tab.Pane
                eventKey="emission"
                onEnter={() => {
                  history.push("/multisig/emission");
                }}
              >
                <SetEmission />
              </Tab.Pane>
              <Tab.Pane
                eventKey="fee-manager"
                onEnter={() => {
                  history.push("/multisig/fee-manager");
                }}
              >
                <FeeManager
                  tokens={[
                    "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
                    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
                    "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
                    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
                    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
                    "0x757BC268bd50DA88b2d0cf1966652B18e56CA803", // YAPE
                  ]}
                  lps={[
                    "0x670120d4833633466C7DB4B515c53fa8C5B33B97",
                    "0x46aDc1C052Fafd590F56C42e379d7d16622835a2",
                    "0x670120d4833633466C7DB4B515c53fa8C5B33B97",
                    "0x8e5b9D85C8BBd309F571dba0c82DdacAcA897805",
                    "0xE3b43bE5aB96629493F948229EFBEe2c0787Ed25",
                    "0xEC5ED926ed8cFE13dae06Ed5649d0C497F2216B6",
                    "0x0415Af9F90a1F774eDC426047d945b474417c0AA",
                    "0x435566318b61d0e4c8e17302ac2FA9e3D6b564bd",
                    "0x4A034E9E5C9AE28A8D56506c0aB2FD06D67144da",
                    "0x386A1b3f23F6B6046604842356911DCF0273a56b",
                    "0xB8eF9ae19bAcd37bfeD71495b98B10A6f0370C0d",
                    "0x23c1653E9e13Eefe2e1b5954Bfef00a2DB0483b6",
                  ]}
                />
              </Tab.Pane>
              <Tab.Pane
                eventKey="transaction"
                onEnter={() => {
                  history.push("/multisig/transaction");
                }}
              >
                <MultisigProposal />
              </Tab.Pane>
            </Tab.Content>
            <hr />
            <Container>
              <SerHelpPlz>
                <p>
                  Here, you are scheduling a governance transaction to the
                  timelock contract using Gnosis Multisig Wallet. Confirm the
                  scheduling on Gnosis and go to transaction tab in Gov menu.
                  You will be able to execute them after the timelock delay.
                </p>
              </SerHelpPlz>
            </Container>
          </Col>
        </Row>
      </Tab.Container>
    </Page>
  );

  return !!workhardCtx ? fetched : fetching;
};
