import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./index.css";
import { useParams } from "react-router-dom";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  readContract,
  writeContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { useWriteContract, useAccount, useBalance } from "wagmi";
import { getMyFundingAmount } from "../../api/index";
import { parseEther, formatEther } from "viem";
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
  Progress,
  message,
  Descriptions,
  Divider,
} from "antd";
import { returnMoney, getAllUse } from "../../api/index";
import moment from "moment";
import CrowdFundingABI from "../../api/CrowdFunding.json";
import config from "../../config/index";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const RPC = import.meta.env.VITE_RPC;

const provider = new ethers.JsonRpcProvider(RPC);
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  CrowdFundingABI.abi,
  provider
);

function Detail() {
  const { id } = useParams();
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [showRefundOpen, setShowRefundOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const [detail, setDetail] = useState(null);
  const [myFundingAmount, setMyFundingAmount] = useState(0);
  const [useList, setUseList] = useState([]);
  const [createUseOpen, setCreateUseOpen] = useState(false);
  const { address } = useAccount();
  const { data: balance, refetch } = useBalance({ address });

  const renderTag = () => {
    if (detail) {
      if (detail?.success) {
        return <Tag color="success">众筹成功</Tag>;
      }
      if (+detail.endTime > Math.floor(new Date().getTime() / 1000)) {
        return <Tag color="processing">正在众筹</Tag>;
      }
      return <Tag color="error">众筹失败</Tag>;
    }
    return null;
  };

  const clickAgreeUse = async (value, index) => {
    try {
      setSubmitLoading(true);
      const result = await writeContractAsync({
        abi: CrowdFundingABI.abi,
        address: CONTRACT_ADDRESS,
        functionName: "agreeUse",
        args: [+id, index, value],
      });
      const txReceipt = await waitForTransactionReceipt(config, {
        hash: result,
      });
      if (txReceipt.status === "success") {
        messageApi.open({
          type: "success",
          content: `操作成功`,
        });
        getAllUseFn();
      }
    } catch (err) {
      messageApi.open({
        type: "error",
        duration: 4,
        content: `操作成功：${err?.details}`,
      });
    }
  };

  const columns = [
    {
      dataIndex: "info",
      key: "info",
      title: "使用说明",
    },
    {
      dataIndex: "goal",
      key: "goal",
      title: "使用金额(eth)",
    },
    {
      dataIndex: "agreeAmount",
      key: "agreeAmount",
      title: "同意请求数额(eth)",
    },
    {
      dataIndex: "disagree",
      key: "disagree",
      title: "不同意请求数额(eth)",
    },
    {
      dataIndex: "over",
      key: "over",
      title: "状态",
      render: (text, record) => {
        if (record.over === false) {
          return <Tag color="processing">正在等待通过</Tag>;
        } else if (record.agreeAmount >= record.goal / 2) {
          return <Tag color="success">批准使用</Tag>;
        } else {
          return <Tag color="error">拒绝请求</Tag>;
        }
      },
    },
    {
      dataIndex: "action",
      key: "action",
      title: "操作",
      render: (text, record) => {
        if (record.over === false && myFundingAmount > 0) {
          return (
            <>
              {(record.agree === 0 || record.agree === 2) && (
                <Button
                  type="primary"
                  onClick={() => clickAgreeUse(true, record.index)}
                >
                  同意
                </Button>
              )}
              <Divider type="vertical" />
              {(record.agree === 0 || record.agree === 1) && (
                <Button
                  danger
                  onClick={() => clickAgreeUse(false, record.index)}
                >
                  不同意
                </Button>
              )}
            </>
          );
        }
        return null;
      },
    },
  ];

  const renderProgress = () => {
    if (detail) {
      return (
        <Progress
          type="circle"
          percent={
            detail.success
              ? 100
              : ((+detail.amount * 100) / +detail.goal).toFixed(1)
          }
        />
      );
    }
    return <Progress type="circle" percent={0} />;
  };

  const infoItems = [
    {
      key: "1",
      label: "众筹标题",
      children: <>{detail?.title}</>,
    },
    {
      key: "2",
      label: "众筹发起人",
      children: <>{detail?.initiator}</>,
    },
    {
      key: "3",
      label: "截止时间",
      children: (
        <>
          {detail &&
            moment.unix(+detail?.endTime).format("YYYY-MM-DD HH:mm:ss")}
        </>
      ),
    },
    {
      key: "4",
      label: "当前状态",
      children: renderTag(),
    },
    {
      key: "5",
      label: "目标金额",
      children: <>{detail?.goal} ETH</>,
    },
    {
      key: "6",
      label: "当前金额",
      children: <>{detail?.amount} ETH</>,
    },
    {
      key: "7",
      label: "众筹进度",
      children: renderProgress(),
    },
    {
      key: "8",
      label: "众筹介绍",
      children: <>{detail?.info}</>,
    },
  ];

  const onConfirm = async () => {
    try {
      setSubmitLoading(true);
      const result = await writeContractAsync({
        abi: CrowdFundingABI.abi,
        address: CONTRACT_ADDRESS,
        functionName: "contribute",
        args: [+id],
        value: parseEther(inputValue),
      });
      const txReceipt = await waitForTransactionReceipt(config, {
        hash: result,
      });
      if (txReceipt.status === "success") {
        setSubmitLoading(false);
        setOpen(false);
        refetch();
        messageApi.open({
          type: "success",
          content: `投资成功，感谢您的支持`,
        });
        getMyFundingAmountFn();
        fetchDetail();
      }
    } catch (err) {
      setSubmitLoading(false);
      messageApi.open({
        type: "error",
        duration: 4,
        content: `投资失败：${err?.details}`,
      });
    }
  };

  const fetchDetail = async () => {
    let detail = await contract.fundings(+id);
    console.log("detail", detail);
    detail = {
      id: id,
      initiator: detail[0].toString(),
      title: detail[1],
      info: detail[2],
      goal: formatEther(detail[3]),
      endTime: detail[4].toString(),
      success: detail[5],
      amount: formatEther(detail[6]),
      numFunders: detail[7].toString(),
      numUses: detail[8].toString(),
    };

    setDetail(detail);
  };

  const getAllUseFn = async () => {
    getAllUse(id, address).then((res) => {
      setUseList(res);
    });
  };

  const getMyFundingAmountFn = () => {
    getMyFundingAmount(id, address).then((res) => {
      setMyFundingAmount(res);
    });
  };

  useEffect(() => {
    fetchDetail();
    getMyFundingAmountFn();
    getAllUseFn();
  }, [address]);

  const onRefundConfirm = async () => {
    try {
      setSubmitLoading(true);
      const result = await writeContractAsync({
        abi: CrowdFundingABI.abi,
        address: CONTRACT_ADDRESS,
        functionName: "returnMoney",
        args: [+id],
      });
      const txReceipt = await waitForTransactionReceipt(config, {
        hash: result,
      });
      if (txReceipt.status === "success") {
        setSubmitLoading(false);
        setShowRefundOpen(false);
        refetch();
        messageApi.open({
          type: "success",
          content: `退款成功`,
        });
        fetchDetail();
      }
    } catch (err) {
      setSubmitLoading(false);
      messageApi.open({
        type: "error",
        duration: 4,
        content: `退款失败：${err?.details}`,
      });
    }
  };

  const onCreateUseConfirm = async (info, goal) => {
    try {
      setSubmitLoading(true);
      console.log("+id, parseEther(goal), info", +id, parseEther(goal), info);
      const result = await writeContractAsync({
        abi: CrowdFundingABI.abi,
        address: CONTRACT_ADDRESS,
        functionName: "newUse",
        args: [+id, parseEther(goal), info],
      });
      console.log("result", result);
      const txReceipt = await waitForTransactionReceipt(config, {
        hash: result,
      });
      if (txReceipt.status === "success") {
        setSubmitLoading(false);
        setCreateUseOpen(false);
        refetch();
        messageApi.open({
          type: "success",
          content: `申请成功`,
        });
        getAllUseFn();
      }
    } catch (err) {
      console.log("err", err);
      setSubmitLoading(false);
      messageApi.open({
        type: "error",
        duration: 4,
        content: `申请成功：${err?.details}`,
      });
    }
  };

  const onChange = (key) => {
    console.log(key);
  };

  const items = [
    {
      key: "1",
      label: "项目介绍",
      children: (
        <>{detail ? <Descriptions bordered items={infoItems} /> : null}</>
      ),
    },
    {
      key: "2",
      label: "使用请求",
      children: (
        <>
          {detail ? (
            <>
              {detail.initiator === address && detail.success && (
                <Button type="primary" onClick={() => setCreateUseOpen(true)}>
                  发起使用请求
                </Button>
              )}
              <Table dataSource={useList} rowKey="index" columns={columns} />
            </>
          ) : null}
        </>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="detail-header">
        <>
          <p className="detail-header-title">{detail?.title}</p>
          <Button
            type="primary"
            onClick={() => setOpen(true)}
            disabled={detail?.success}
          >
            我要投资
          </Button>
        </>
        {myFundingAmount > 0 && (
          <>
            <p>您投资了{myFundingAmount}ETH</p>
            <Button
              disabled={detail?.success}
              danger
              onClick={() => setShowRefundOpen(true)}
            >
              我要退钱
            </Button>
          </>
        )}
      </div>

      <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
      <Modal
        title="投资"
        open={open}
        onOk={onConfirm}
        onCancel={() => setOpen(false)}
        confirmLoading={submitLoading}
        okText="确认"
        afterClose={() => {
          setSubmitLoading(false);
        }}
        maskClosable={false}
        cancelText="取消"
      >
        <Input
          value={inputValue}
          placeholder="请输入ETH数量"
          onChange={(e) => setInputValue(e.target.value)}
        />
      </Modal>
      <Modal
        title="投资"
        open={open}
        onOk={onConfirm}
        onCancel={() => setOpen(false)}
        confirmLoading={submitLoading}
        okText="确认"
        afterClose={() => {
          setSubmitLoading(false);
        }}
        maskClosable={false}
        cancelText="取消"
      >
        <Input
          value={inputValue}
          placeholder="请输入ETH数量"
          onChange={(e) => setInputValue(e.target.value)}
        />
      </Modal>
      <Modal
        title="退款"
        open={showRefundOpen}
        onOk={onRefundConfirm}
        onCancel={() => setShowRefundOpen(false)}
        confirmLoading={submitLoading}
        okText="确认"
        afterClose={() => {
          setSubmitLoading(false);
        }}
        maskClosable={false}
        cancelText="取消"
      >
        <p>确认取消投资吗？将返还所有投资金额？</p>
      </Modal>
      <Modal
        title="发起申请"
        open={createUseOpen}
        footer={null}
        onCancel={() => setCreateUseOpen(false)}
        okText="确认"
        afterClose={() => {
          setSubmitLoading(false);
        }}
        maskClosable={false}
        cancelText="取消"
      >
        <Form
          name="basic"
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
          style={{
            maxWidth: 600,
          }}
          onFinish={(value) => {
            onCreateUseConfirm(value.info, value.goal);
          }}
          autoComplete="off"
        >
          <Form.Item
            label="请求说明"
            name="info"
            rules={[
              {
                required: true,
                message: "请填写请求说明",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="请求金额"
            name="goal"
            rules={[
              {
                required: true,
                message: "请填写请求金额",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            wrapperCol={{
              offset: 8,
              span: 16,
            }}
          >
            <Button type="primary" htmlType="submit" loading={submitLoading}>
              确定
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Detail;
