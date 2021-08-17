import React from "react";
import { Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

const Footer = () => (
  <Row style={{ marginTop: "auto", position: "relative" }}>
    <Col lg={12}>
      <hr style={{ borderTop: "1px solid rgba(0,0,0,0.5)" }} />
      <footer>
        <ul className="list-unstyled">
          <li className="float-lg-right">
            <a href="#top">Back to top</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://forum.yape.exchange">Forum</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://discord.gg/jUjE6Y4q6u">Discord</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://twitter.com/yapeswap">Twitter</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://github.com/yapeswap">GitHub</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://yapeswapdao.medium.com">Medium</a>
          </li>
          <li className="float-lg-left" style={{ marginRight: 10 }}>
            <a href="https://snapshot.org/#/yape.eth">Snapshot</a>
          </li>
          {/* <li className="float-lg-left" style={{ marginRight: 10 }}>
            <Link to={"/res"}>Resources</Link>
          </li> */}
        </ul>
        <br />
        <br />
        <p>
          Made by crypto apes! Code released under the{" "}
          <a href="https://github.com/yapeswap/yape-core/blob/main/LICENSE">
            GPL v3 license.
          </a>
        </p>
      </footer>
    </Col>
  </Row>
);

export default Footer;
