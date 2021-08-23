import React, { useEffect, useState } from "react";
import { useRouteMatch } from "react-router-dom";
import { useWeb3React } from "@web3-react/core";
import { Container, Row } from "react-bootstrap";
import { ethers } from "ethers";
import NavBar from "../components/nav/NavBar";
import Footer from "../components/Footer";
import { Menu } from "../contexts/menu";
import {
  isOnTargetNetwork,
  getTargetNetworkName,
  getGnosisAPI,
} from "../utils/utils";
import { ApeSays } from "../components/views/ApeSays";
import { useWorkhard } from "../providers/WorkhardProvider";
import { getAddress } from "ethers/lib/utils";

export type PageProps = React.ComponentProps<any>;

const Page = (props: React.ComponentProps<any>) => {
  const {
    account,
    active,
    chainId,
  } = useWeb3React<ethers.providers.Web3Provider>();
  const workhardCtx = useWorkhard();
  const targetNetwork = getTargetNetworkName();
  const onTargetNetwork = isOnTargetNetwork(chainId);
  const [hasPermission, setHasPermission] = useState<boolean>();
  useEffect(() => {
    if (!!workhardCtx && !!account && !!chainId) {
      const gnosisAPI = getGnosisAPI(chainId);
      if (gnosisAPI) {
        fetch(gnosisAPI + `safes/${workhardCtx.dao.multisig.address}/`)
          .then(async (response) => {
            const result = await response.json();
            if (
              (result.owners as string[])
                .map(getAddress)
                .includes(getAddress(account))
            ) {
              setHasPermission(true);
            }
          })
          .catch((_) => {
            setHasPermission(false);
          });
      }
    }
  }, [workhardCtx, account, chainId]);
  const match = useRouteMatch<{ daoId?: string }>("/:daoId?/");
  const parsed = parseInt(match?.params.daoId || "0");
  const daoId = Number.isNaN(parsed) ? 0 : parsed;
  let menus: Menu[];
  let secondary: Menu[] | undefined;
  let adminMenus: Menu[] | undefined;
  if (daoId === 0) {
    menus = [
      {
        name: "Mine",
        url: "/mine",
      },
      {
        name: "Work",
        url: "/work",
      },
      {
        name: "Gov",
        url: "/gov",
      },
      // {
      //   name: "Store",
      //   url: "/store",
      // },
      // {
      //   name: "DAOs",
      //   url: "/dao",
      // },
    ];
    adminMenus = [
      {
        name: "Multisig",
        url: "/multisig",
      },
    ];
  } else {
    menus = [
      {
        name: "Store",
        url: "/store",
      },
    ];
    secondary = [
      {
        name: "Mine",
        url: "/mine",
      },
      {
        name: "Work",
        url: "/work",
      },
      {
        name: "Gov",
        url: "/gov",
      },
    ];
    adminMenus = [
      {
        name: "Multisig",
        url: "/multisig",
      },
    ];
  }
  return (
    <Container
      style={{
        minHeight: "100vh",
        paddingTop: "98px",
      }}
    >
      <NavBar
        menus={menus}
        secondary={secondary}
        adminMenus={hasPermission ? adminMenus : undefined}
      />
      <Row>
        <Container>
          {!active && <ApeSays say={"Ape Connect Strong"} />}
          {active && !onTargetNetwork && (
            <ApeSays say={`You're not on ${targetNetwork} ser?`} />
          )}
          {active && onTargetNetwork && props.children}
        </Container>
      </Row>
      <br />
      <Footer />
    </Container>
  );
};

export default Page;
