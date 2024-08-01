import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./index.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import {
  useWriteContract,
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useConnect,
  useBalance,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { http, createConfig } from "@wagmi/core";
import { mainnet, sepolia } from "@wagmi/core/chains";
import {
  Tabs,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Space,
  Input,
  Tag,
  DatePicker,
  message,
} from "antd";
import moment from "moment";
import CrowdFundingABI from "../../api/CrowdFunding.json";
import config from "../../config/index";
import { useNavigate } from "react-router-dom";

const { Option } = Select;
const { TextArea } = Input;

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const RPC = import.meta.env.VITE_RPC;

const provider = new ethers.JsonRpcProvider(RPC);
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  CrowdFundingABI.abi,
  provider
);

const onChange = (key) => {
  console.log(key);
};

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

function Main() {
  const [open, setOpen] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { connect } = useConnect();
  const [submitLoading, setSubmitLoading] = useState(false);
  const { data: hash, writeContractAsync } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  const currentAccount = useAccount();
  const { data: balance, refetch } = useBalance({
    address: currentAccount.address,
  });
  const navigate = useNavigate();

  console.log("currentAccount", currentAccount);

  const columns = [
    {
      dataIndex: "initiator",
      key: "initiator",
      title: "发起人",
    },
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
      title: "结束时间",
      dataIndex: "endTime",
      key: "endTime",
      render: (value) => {
        return moment.unix(+value).format("YYYY-MM-DD HH:mm:ss");
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
        if (+item.endTime > Math.floor(new Date().getTime() / 1000)) {
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
          <Button onClick={() => navigate(`/detail/${item.id}`)}>
            查看详情
          </Button>
        );
      },
    },
  ];

  const fetchAllFundings = async () => {
    try {
      const totalFunding = await contract.numFundings();
      let fundingPromises = [];
      let total = totalFunding.toString();

      for (let i = 1; i <= +total; i++) {
        fundingPromises.push(contract.fundings(i));
      }

      const fundingItems = await Promise.all(fundingPromises);
      console.log("fundingItems", fundingItems);
      const res = fundingItems
        .map((item, index) => ({
          id: index + 1,
          initiator: item[0].toString(), // 确保BigNumber转为字符串
          title: item[1],
          info: item[2],
          goal: formatEther(item[3]),
          endTime: item[4].toString(),
          success: item[5],
          amount: formatEther(item[6]),
          numFunders: item[7].toString(),
          numUses: item[8].toString(),
        }))
        .sort((a, b) => b.id - a.id);
      setDataSource(res);
    } catch (error) {
      console.error("Error fetching total funding count:", error);
    }
  };

  useEffect(() => {
    fetchAllFundings();
  }, []);

  const onFinish = async (values) => {
    const { account, amount, date, info, title } = values;
    console.log("values", values);
    try {
      setSubmitLoading(true);
      const result = await writeContractAsync({
        abi: CrowdFundingABI.abi,
        address: CONTRACT_ADDRESS,
        functionName: "newFunding",
        args: [
          account,
          title,
          info,
          parseEther(amount),
          Math.floor(new Date(date).getTime() / 1000),
        ],
      });
      const txReceipt = await waitForTransactionReceipt(config, {
        hash: result,
      });
      if (txReceipt.status === "success") {
        messageApi.open({
          type: "success",
          content: `发布成功，交易tx: ${result}`,
        });
        refetch();
        setSubmitLoading(false);
        setOpen(false);
        fetchAllFundings();
      }
    } catch (error) {
      setSubmitLoading(false);
      messageApi.error({
        type: "success",
        content: `发布失败 ${error?.details}`,
      });
      console.error("Transaction failed", error);
    }
  };

  const onReset = () => {
    form.resetFields();
  };

  const items = [
    {
      key: "1",
      label: "所有众筹",
      children: (
        <>
          <Card
            title="所有众筹"
            extra={
              <Button
                type="primary"
                onClick={() => {
                  if (!currentAccount.address) {
                    messageApi.error({
                      content: `请先连接钱包`,
                    });
                    return;
                  }
                  connect();
                  showModal();
                }}
              >
                发起众筹
              </Button>
            }
          >
            <Table dataSource={dataSource} rowKey="id" columns={columns} />
          </Card>
        </>
      ),
    },
  ];

  const showModal = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    console.log("Clicked cancel button");
    setOpen(false);
  };
  return (
    <>
      {contextHolder}
      <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
      <Modal
        title="发起众筹"
        afterClose={() => {
          form.resetFields();
          setSubmitLoading(false);
        }}
        maskClosable={false}
        open={open}
        footer={null}
        onCancel={handleCancel}
      >
        <Form
          {...layout}
          form={form}
          name="control-hooks"
          onFinish={onFinish}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            name="account"
            label="发起人"
            initialValue={currentAccount.address}
            rules={[{ required: true, message: "请输入发起人" }]}
          >
            <Input placeholder="请输入发起人" disabled={true} />
          </Form.Item>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item
            name="info"
            label="简介"
            rules={[{ required: true, message: "请输入简介" }]}
          >
            <TextArea placeholder="请输入简介" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="众筹金额"
            rules={[{ required: true, message: "请输入众筹金额" }]}
          >
            <Input placeholder="单位eth" />
          </Form.Item>
          <Form.Item
            name="date"
            label="截止时间"
            rules={[{ required: true, message: "请选择截止时间" }]}
          >
            <DatePicker showTime placeholder="请选择截止时间" />
          </Form.Item>
          <Form.Item {...tailLayout}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                提交
              </Button>
              <Button
                htmlType="button"
                onClick={onReset}
                disabled={submitLoading}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Main;
