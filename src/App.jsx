import "./App.css";
import Main from "./pages/Main/index";
import Detail from "./pages/Detail/index";
import My from "./pages/My/index";
import { Layout, Menu, theme } from "antd";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const { Header, Content, Footer } = Layout;

const items = [
  {
    key: "/",
    label: <Link to="/">所有众筹</Link>,
  },
  {
    key: "/my",
    label: <Link to="/my">我的众筹</Link>,
  },
];

function App() {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <>
      <Layout>
        <Router>
          <Header style={{ padding: 0 }}>
            <Menu
              theme="light"
              mode="horizontal"
              defaultSelectedKeys={window.location.pathname}
              items={items}
              style={{ flex: 1, minWidth: 0 }}
            />
          </Header>
          <Content>
            <div
              style={{
                background: colorBgContainer,
                minHeight: 280,
                padding: 24,
                borderRadius: borderRadiusLG,
              }}
            >
              <div className="header">
                <ConnectButton
                  accountStatus={{
                    smallScreen: "avatar",
                    largeScreen: "full",
                  }}
                />
              </div>
              <Routes>
                <Route exact path="/" element={<Main />} />
                <Route exact path="/detail/:id" element={<Detail />} />
                <Route exact path="/my" element={<My />} />
              </Routes>
            </div>
          </Content>
          <Footer style={{ textAlign: "center" }}>
            Ant Design ©{new Date().getFullYear()} Created by JohnsonWong
          </Footer>
        </Router>
      </Layout>
    </>
  );
}

export default App;
