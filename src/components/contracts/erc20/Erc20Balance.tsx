import React, { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { Card } from "react-bootstrap";
import { useWeb3React } from "@web3-react/core";
import { bigNumToFixed, errorHandler } from "../../../utils/utils";
import { OverlayTooltip } from "../../OverlayTooltip";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { ERC20__factory } from "@workhard/protocol";
import { useToasts } from "react-toast-notifications";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

export interface Erc20BalanceProps {
  title?: string;
  address?: string;
  description?: string;
  symbolAlt?: string;
}

export const Erc20Balance: React.FC<Erc20BalanceProps> = ({
  title,
  address,
  description,
  symbolAlt,
  children,
}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const [balance, setBalance] = useState<BigNumber>();
  const [symbol, setSymbol] = useState<string>();
  const { addToast } = useToasts();

  useEffect(() => {
    if (!!account && !!library && !!address) {
      ERC20__factory.connect(address, library)
        .balanceOf(account)
        .then(setBalance)
        .catch(errorHandler(addToast));
      ERC20__factory.connect(address, library).symbol().then(setSymbol);
    }
  }, [account, address, library, blockNumber]);

  return (
    <Card>
      {description && (
        <div style={{ position: "absolute", right: "1rem", top: "1rem" }}>
          <OverlayTooltip tip={description}>
            <FontAwesomeIcon
              icon={faInfoCircle}
              style={{ cursor: "pointer" }}
            />
          </OverlayTooltip>
        </div>
      )}
      <Card.Body>
        {title && <Card.Title>{title}</Card.Title>}
        <Card.Text style={{ fontSize: "3rem" }}>
          {bigNumToFixed(balance || 0)}
          <span style={{ fontSize: "1rem" }}> {symbolAlt || symbol}</span>
        </Card.Text>
        {children}
      </Card.Body>
    </Card>
  );
};
