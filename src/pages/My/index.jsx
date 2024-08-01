import React, { useState, useEffect } from "react";
import "./index.css";
import { Card, Table, Tag, Button } from "antd";
import moment from "moment";
import { getMyFundings } from "../../api/index";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";

function Detail() {
  const [myInitiated, setMyInitiated] = useState([]);
  const [myInvested, setMyInvested] = useState([]);
  const { address } = useAccount();
  const navigate = useNavigate();

  const columns = [
    {
      dataIndex: "title",
      key: "title",
      title: "众筹标题",
    },
    {
      title: "目标金额(eth)",
      dataIndex: "goal",
      key: "goal",
    },
    {
      title: "目前金额(eth)",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "我投资的金额",
      dataIndex: "myAmount",
      key: "amount",
    },
    {
      title: "结束时间",
      dataIndex: "endTime",
      key: "endTime",
      render: (value) => {
        return moment.unix(Number(value)).format("YYYY-MM-DD HH:mm:ss");
      },
    },
    {
      title: "当前状态",
      dataIndex: "success",
      key: "success",
      render: (value, item) => {
        if (value) {
          return <Tag color="success">众筹成功</Tag>;
        }
        if (Number(item.endTime) > Math.floor(new Date().getTime() / 1000)) {
          return <Tag color="processing">正在众筹</Tag>;
        }
        return <Tag color="error">众筹失败</Tag>;
      },
    },
    {
      title: "操作",
      dataIndex: "action",
      key: "action",
      render: (text, item) => {
        return (
          <Button onClick={() => navigate(`/detail/${item.index}`)}>
            查看详情
          </Button>
        );
      },
    },
  ];

  useEffect(() => {
    const initFn = async () => {
      try {
        const res = await getMyFundings(address);
        setMyInitiated(res.init);
        setMyInvested(res.contr);
      } catch (error) {
        setMyInitiated([]);
        setMyInvested([]);
      }
    };
    initFn();
  }, [address]);

  return (
    <>
      <Card title="我发起的" bordered={false}>
        <Table dataSource={myInitiated} rowKey="index" columns={columns} />
      </Card>
      <Card title="我参与的" bordered={false}>
        <Table dataSource={myInvested} rowKey="index" columns={columns} />
      </Card>
    </>
  );
}

export default Detail;
