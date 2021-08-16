import React, { useEffect, useState } from "react";
import Page from "../../layouts/Page";
import { Col, Row } from "react-bootstrap";
import { ERC20StakeMiningV1 } from "../../components/contracts/mining-pool/ERC20StakeMiningV1";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { BigNumber } from "@ethersproject/bignumber";
import { useWeb3React } from "@web3-react/core";
import { ERC20BurnMiningV1 } from "../../components/contracts/mining-pool/ERC20BurnMiningV1";
import { errorHandler, handleTransaction, TxStatus } from "../../utils/utils";
import { useToasts } from "react-toast-notifications";
import { observer } from "mobx-react";
import { SerHelpPlz } from "../../components/views/HelpSer";
import { TitleButSer } from "../../components/views/TitleButSer";
import {
  ContributionBoard__factory,
  InitialContributorShare__factory,
} from "@workhard/protocol";
import { InitialContributorSharePool } from "../../components/contracts/mining-pool/InitialContributorSharePool";
import { useBlockNumber } from "../../providers/BlockNumberProvider";
import { MiningPool } from "../../components/views/MiningPool";
import { Link } from "react-router-dom";
import { useStores } from "../../hooks/user-stores";
import { WETH_ADDRESS, YAPE_ADDRESS } from "../../constants";

const Mine = observer(() => {
  const { addToast } = useToasts();
  const { account, library, chainId } = useWeb3React();
  const workhardCtx = useWorkhard();
  const { daoId, dao, periphery } = workhardCtx || {};
  const { mineStore } = useStores();
  const { blockNumber } = useBlockNumber();
  const [txStatus, setTxStatus] = useState<TxStatus>();
  const [initialContributor, setInitialContributor] = useState<boolean>();
  const [
    initialContributorShare,
    setInitialContributorShare,
  ] = useState<string>();
  const [
    initialContributorPool,
    setInitialContributorPool,
  ] = useState<string>();

  useEffect(() => {
    if (!!dao && account && library) {
      const signer = library.getSigner(account);
      mineStore.loadPools().then(async () => {
        await mineStore.loadVisionPrice();
        await mineStore.loadCommitPrice();
        mineStore.loadAPYs();
      });
      mineStore.isDistributable(signer);
      dao.visionEmitter
        .initialContributorShare()
        .then(setInitialContributorShare)
        .catch(errorHandler(addToast));
      dao.visionEmitter
        .initialContributorPool()
        .then(setInitialContributorPool)
        .catch(errorHandler(addToast));
    }
  }, [dao, blockNumber, account, library]);

  useEffect(() => {
    if (
      !!initialContributorPool &&
      !!initialContributorShare &&
      !!library &&
      !!account
    ) {
      ContributionBoard__factory.connect(initialContributorShare, library)
        .balanceOf(account, daoId || "0")
        .then((bal) => {
          if (bal.gt(0)) {
            setInitialContributor(true);
          }
        });
      InitialContributorShare__factory.connect(initialContributorPool, library)
        .dispatchedMiners(account)
        .then((miners) => {
          if (miners.gt(0)) {
            setInitialContributor(true);
          }
        });
    }
  }, [account, library, initialContributorShare, initialContributorPool]);

  useEffect(() => {
    if (!!dao && !!mineStore.pools) {
      mineStore.loadEmission();
      mineStore.loadEmissionWeightSum();
    }
  }, [library, dao, txStatus]);

  const distribute = () => {
    if (!!account && !!dao && !!library) {
      const signer = library.getSigner(account);
      handleTransaction(
        dao.visionEmitter.connect(signer).distribute(),
        setTxStatus,
        addToast,
        "You've mined the distribution transaction!!",
        () => mineStore.isDistributable(signer)
      );
    }
  };

  const subPools = mineStore.pools
    ?.map((addr, idx) => {
      if (
        !addr ||
        idx === mineStore.liquidityMiningIdx() ||
        idx === mineStore.commitMiningIdx() ||
        !mineStore.emissionWeightSum
      )
        return undefined;
      else
        return (
          <div key={`mine-${addr}-${idx}`}>
            <br />
            <MiningPool
              poolIdx={idx}
              poolAddress={addr}
              totalEmission={mineStore.emission}
              emissionWeightSum={mineStore.emissionWeightSum}
              apy={mineStore.apy(addr)}
              tvl={mineStore.tvl(addr)}
            />
          </div>
        );
    })
    .filter((pool) => pool !== undefined);

  return (
    <Page>
      <h2>Featured mining pools</h2>
      <Row>
        <Col md={4}>
          {mineStore.pools &&
            mineStore.liquidityMiningIdx() !== -1 &&
            workhardCtx &&
            mineStore.emissionWeightSum && (
              <ERC20StakeMiningV1
                poolIdx={mineStore.liquidityMiningIdx()}
                title={"Liquidity Mining"}
                description={`Provide more liquidity for your project's on-chain stock options. LP your ${
                  workhardCtx && workhardCtx.daoId !== 0
                    ? `${workhardCtx.metadata.visionName}(${workhardCtx.metadata.visionSymbol})`
                    : "$VISION"
                } to earn more ${
                  workhardCtx && workhardCtx.daoId !== 0
                    ? workhardCtx.metadata.visionSymbol
                    : "$VISION"
                }`}
                tokenName={`${
                  workhardCtx?.metadata.visionSymbol || "VISION"
                }/ETH LP`}
                link={`https://app.yape.exchange/#/add/ETH/${workhardCtx.dao.vision.address}`}
                poolAddress={workhardCtx.periphery.liquidityMining.address}
                totalEmission={mineStore.emission}
                emissionWeightSum={mineStore.emissionWeightSum}
                apy={mineStore.apy(
                  workhardCtx.periphery.liquidityMining.address
                )}
                tvl={mineStore.tvl(
                  workhardCtx.periphery.liquidityMining.address
                )}
                tokens={[WETH_ADDRESS, YAPE_ADDRESS]}
              />
            )}
        </Col>
        <Col md={4}>
          {mineStore.pools &&
            mineStore.commitMiningIdx() !== -1 &&
            workhardCtx &&
            mineStore.emissionWeightSum && (
              <ERC20BurnMiningV1
                poolIdx={mineStore.commitMiningIdx()}
                title={"Commit Mining (burn cYAPE)"}
                tokenName={workhardCtx.metadata.commitSymbol}
                description={`Show your true, long-term belief in Yapeswap. Burn ${
                  workhardCtx && workhardCtx.daoId !== 0
                    ? `${workhardCtx.metadata.commitName}(${workhardCtx.metadata.commitSymbol})`
                    : "$COMMIT"
                } to continuously mine ${
                  workhardCtx && workhardCtx.daoId !== 0
                    ? `${workhardCtx.metadata.visionName}(${workhardCtx.metadata.visionSymbol})`
                    : "$VISION"
                }`}
                link={"/work"}
                poolAddress={workhardCtx.periphery.commitMining.address}
                totalEmission={mineStore.emission || BigNumber.from(0)}
                emissionWeightSum={mineStore.emissionWeightSum}
                apy={
                  mineStore.apy(workhardCtx.periphery.commitMining.address) ||
                  NaN
                }
                tvl={mineStore.tvl(workhardCtx.periphery.commitMining.address)}
                maxAPY={mineStore.maxAPY(
                  workhardCtx.periphery.commitMining.address
                )}
              />
            )}
        </Col>
      </Row>
      <br />
      <br />
      <h2>YAPE mining pools!</h2>
      <Row>
        {subPools.map((subPool) => (
          <Col md={4}>{subPool}</Col>
        ))}
      </Row>
      {initialContributor && initialContributorPool && (
        <>
          <br />
          <TitleButSer link="https://whf.gitbook.io/docs/mine#icsp">
            Initial Contributors' Pool!
          </TitleButSer>
          <p>
            Congratulations! You can mine for more YAPE here with your special
            early stage contributor tokens! Keep in mind that if you completely
            withdraw, you will lose out on more YAPE emission rewards.
          </p>
          <InitialContributorSharePool
            poolAddress={initialContributorPool}
            totalEmission={mineStore.emission || BigNumber.from(0)}
            emissionWeightSum={mineStore.emissionWeightSum}
            apy={mineStore.apy(initialContributorPool)}
          />
        </>
      )}
      <br />

      <SerHelpPlz>
        <p>
          The two ways to mine{" "}
          {workhardCtx && workhardCtx.daoId !== 0
            ? `${workhardCtx.metadata.visionName}(${workhardCtx.metadata.visionSymbol})`
            : "$VISION"}{" "}
          <Link to={"/#emission-schedule"} className="text-info">
            (Emission Detail)
          </Link>
          :
          <ol>
            <li>
              Burn{" "}
              {workhardCtx && workhardCtx.daoId !== 0
                ? `${workhardCtx.metadata.commitName}(${workhardCtx.metadata.commitSymbol})`
                : "$COMMIT"}{" "}
              to get{" "}
              {workhardCtx && workhardCtx.daoId !== 0
                ? `${workhardCtx.metadata.visionName}(${workhardCtx.metadata.visionSymbol})`
                : "$VISION"}{" "}
              through COMMIT MINING.
              <a
                href="https://whf.gitbook.io/docs/mine#needs-updated"
                className="text-info"
              >
                (Example)
              </a>
            </li>
            <li>
              Provide {workhardCtx?.metadata.visionSymbol || "$VISION"}/ETH LP
              token to LIQUIDITY MINE{" "}
              {workhardCtx?.metadata.visionName || "$VISION"}
            </li>
          </ol>
          Stake & lock{" "}
          {workhardCtx && workhardCtx.daoId !== 0
            ? workhardCtx.metadata.visionName
            : "$VISION"}{" "}
          to receive{" "}
          <a
            href="https://whf.gitbook.io/docs/tokens#usdright"
            className="text-info"
          >
            {workhardCtx && workhardCtx.daoId !== 0
              ? workhardCtx.metadata.rightName
              : "$RIGHT"}
          </a>{" "}
          (
          {workhardCtx && workhardCtx.daoId !== 0
            ? workhardCtx.metadata.rightSymbol
            : "$veVISION"}
          ) and join to{" "}
          <Link to={"/gov"} target="_blank" className="text-info">
            govern
          </Link>{" "}
          the WORKER’S UNION. With{" "}
          {workhardCtx?.metadata.rightSymbol || "$RIGHT"} you can claim a share
          of the{" "}
          {workhardCtx && workhardCtx.daoId !== 0
            ? workhardCtx.metadata.daoName
            : "Work Hard Finance"}
          ’s profit.
        </p>
      </SerHelpPlz>
    </Page>
  );
});

export default Mine;
