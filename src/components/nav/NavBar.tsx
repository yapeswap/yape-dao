import React from "react";
import { Nav, Row, Navbar, Button, Container } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import NavBarBrand from "./NavBarBrand";
import Wallet from "../Wallet";
import { Menu } from "../../contexts/menu";
import Assets from "./Assets";

export interface NavBarProps {
  menus: Menu[];
  secondary?: Menu[];
  adminMenus?: Menu[];
}

const NavBar: React.FC<NavBarProps> = ({ menus, secondary, adminMenus }) => {
  const history = useHistory();
  return (
    <Navbar
      expand="lg"
      fixed={"top"}
      style={{
        borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
        fontFamily: "Lobster Two",
      }}
      className={"bg-white"}
    >
      <Container>
        <NavBarBrand />
        <Navbar.Collapse>
          <Nav>
            {menus.map((menu) => (
              <Nav.Link
                key={menu.url}
                as={Link}
                to={menu.url}
                style={{
                  textDecoration: history.location.pathname.startsWith(menu.url)
                    ? "underline"
                    : undefined,
                  textAlign: "center",
                }}
              >
                {menu.name}
              </Nav.Link>
            ))}
          </Nav>
          {secondary && (
            <>
              <div style={{ borderLeft: "1px solid", height: "1rem" }}></div>
              <Nav>
                {secondary.map((menu) => (
                  <Nav.Link
                    key={menu.url}
                    as={Link}
                    to={menu.url}
                    style={{
                      textDecoration: history.location.pathname.startsWith(
                        menu.url
                      )
                        ? "underline"
                        : undefined,
                      textAlign: "center",
                    }}
                  >
                    {menu.name}
                  </Nav.Link>
                ))}
              </Nav>
            </>
          )}
          {adminMenus && (
            <>
              <div
                style={{ borderLeft: "1px solid gray", height: "1rem" }}
              ></div>
              <Nav>
                {adminMenus.map((menu) => (
                  <Nav.Link
                    key={menu.url}
                    as={Link}
                    to={menu.url}
                    style={{
                      textDecoration: history.location.pathname.startsWith(
                        menu.url
                      )
                        ? "underline"
                        : undefined,
                      textAlign: "center",
                    }}
                  >
                    {menu.name}
                  </Nav.Link>
                ))}
              </Nav>
            </>
          )}
        </Navbar.Collapse>

        <Row className="justify-content-end">
          {/* <Assets></Assets> */}
          <Navbar.Toggle
            aria-controls="basic-navbar-nav"
            className="justify-content-end"
          />
          <Button as={"a"} href={`https://app.yape.exchange/`} target="_blank">
            Go to app
          </Button>
          <div style={{ margin: 5 }}> </div>
          <Wallet className="justify-content-end" />
        </Row>
      </Container>
    </Navbar>
  );
};

export default NavBar;
