import React from "react";
import Page from "../layouts/Page";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  FormControl,
  Image,
  InputGroup,
  ListGroup,
  ListGroupItem,
  OverlayTrigger,
  ProgressBar,
  Row,
  Tooltip,
} from "react-bootstrap";
import { Link } from "react-router-dom";

const getVariant = (percent: number) => {
  if (percent <= 25) return "danger";
  else if (percent <= 50) return "warning";
  else if (percent <= 75) return "info";
  else return "success";
};
const Mine = () => {
  const stakePercent = 60;
  const lockedPercent = 90;
  const remainingPercent = 10;
  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/goldrush.jpg"}
        style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
      />
      <Alert variant={"info"}>
        You can mine $VISION tokens here by providing Uniswap $VISION/ETH pair or burning your $COMMITMENT tokens.
        Currently 50% of the total emission goes to the liquidity mining pool and the other 50% goes to the commitment mining pool.
      </Alert>
      <Row>
        <Col>
          <Card>
            <Card.Header as="h5">Liquidity mining</Card.Header>
            <Card.Body>
              <Card.Title>APY</Card.Title>
              <Card.Text style={{ fontSize: "3rem" }}>4321 %</Card.Text>
              {/* <Card.Title>Stake & lock to dispatch farmers</Card.Title> */}
              <Form>
                <Form.Group controlId="formBasicEmail">
                  <Card.Title>Staking</Card.Title>
                  {/* <Form.Label>Staking</Form.Label> */}
                  <InputGroup className="mb-2">
                    <InputGroup.Prepend>
                      <InputGroup.Text>MAX</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl
                      id="inlineFormInputGroup"
                      placeholder="Username"
                    />
                  </InputGroup>
                </Form.Group>
                <ProgressBar
                  variant={getVariant(stakePercent)}
                  animated
                  now={stakePercent}
                />
                <Card.Text>
                  1432 / 4323 of your $VISION/ETH lp token is staked.
                </Card.Text>
                <Button variant="primary" type="submit">
                  Stake
                </Button>{" "}
                <Button variant="secondary" type="submit">
                  Withdraw
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card>
            <Card.Header as="h5">Commitment mining</Card.Header>
            <Card.Body>
              <Card.Title>
                APYBC
                <OverlayTrigger
                  // key={placement}
                  // placement={placement}
                  overlay={
                    <Tooltip id={`tooltip-dispatchable-farmers`}>
                      Annual Percentage Yield by Burning $Commitment token = (Revenue - Burn) / Year
                    </Tooltip>
                  }
                >
                  <span style={{ fontSynthesis: "o" }}>❔</span>
                </OverlayTrigger>
              </Card.Title>
              <Card.Text style={{ fontSize: "3rem" }}>4321 %</Card.Text>
              {/* <Card.Title>Stake & lock to dispatch farmers</Card.Title> */}
              <Form>
                <Form.Group controlId="formBasicEmail">
                  <Card.Title>Burn</Card.Title>
                  {/* <Form.Label>Staking</Form.Label> */}
                  <InputGroup className="mb-2">
                    <InputGroup.Prepend>
                      <InputGroup.Text>MAX</InputGroup.Text>
                    </InputGroup.Prepend>
                    <FormControl
                      id="inlineFormInputGroup"
                      placeholder="Username"
                    />
                  </InputGroup>
                </Form.Group>
                <ProgressBar
                  variant={getVariant(stakePercent)}
                  animated
                  now={stakePercent}
                />
                <Card.Text>
                  1432 / 2132 of your $COMMITMENT token is burnt for commitment mining.
                </Card.Text>
                <Button variant="primary" type="submit">
                  Burn
                </Button>{" "}
                <Button variant="secondary" type="submit">
                  Stop mining & withdraw reward
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Page>
  );
};

export default Mine;
