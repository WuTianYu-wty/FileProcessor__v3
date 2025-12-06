import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Select,
  Button,
  message,
  Space,
  List,
  Tag,
  Progress,
  Alert,
  Typography,
  Row,
  Col,
  Upload,
  Switch,
  Divider
} from 'antd'
import {
  FileWordOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  SwapOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  SyncOutlined
} from '@ant-design/icons'
import axios from 'axios'

const { Option } = Select
const { Title, Text } = Typography
const { Dragger } = Upload

function DocumentConverter() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [conversions, setConversions] = useState([])
  const [form] = Form.useForm()

  // 支持的转换格式
  const conversionTypes = [
    { from: 'pdf', to: 'word', label: 'PDF → Word', icon: <FileWordOutlined /> },
    { from: 'word', to: 'pdf', label: 'Word → PDF', icon: <FilePdfOutlined /> },
    { from: 'excel', to: 'pdf', label: 'Excel → PDF', icon: <FileExcelOutlined /> },
    { from: 'ppt', to: 'pdf', label: 'PPT → PDF', icon: <FilePptOutlined /> },
  ]

  // 加载文件列表
  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/files')
      if (response.data.success) {
        setFiles(response.data.data.filter(f => !f.is_deleted))
      }
    } catch (error) {
      message.error('加载文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取特定格式的文件
  const getFilesByType = (type) => {
    const extensions = {
      pdf: ['.pdf'],
      word: ['.docx', '.doc'],
      excel: ['.xlsx', '.xls'],
      ppt: ['.pptx', '.ppt']
    }

    return files.filter(f => {
      const ext = f.original_name.toLowerCase()
      return extensions[type].some(e => ext.endsWith(e))
    })
  }

  // 添加转换任务
  const handleAddConversion = (values) => {
    const file = files.find(f => f.id === values.fileId)
    if (!file) {
      message.error('文件不存在')
      return
    }

    const newConversion = {
      id: Date.now(),
      fileId: values.fileId,
      fileName: file.original_name,
      inputPath: file.file_path,
      fromType: values.fromType,
      toType: values.toType,
      extractImages: values.extractImages || false,
      status: 'pending', // pending, processing, success, error
      progress: 0,
      error: null
    }

    setConversions([...conversions, newConversion])
    message.success('已添加到转换列表')
    form.resetFields()
  }

  // 执行单个转换
  const handleConvertOne = async (conversion) => {
    const updatedConversion = { ...conversion, status: 'processing', progress: 50 }
    updateConversion(conversion.id, updatedConversion)

    const ext = conversion.toType === 'word' ? '.docx' : '.pdf'
    const outputPath = conversion.inputPath.replace(/\.[^.]+$/, `_converted${ext}`)

    try {
      let endpoint = '/api/converter/convert'
      const data = {
        inputPath: conversion.inputPath,
        outputPath,
        extractImages: conversion.extractImages
      }

      const response = await axios.post(endpoint, data)

      if (response.data.success) {
        updateConversion(conversion.id, {
          ...conversion,
          status: 'success',
          progress: 100,
          outputPath: response.data.output
        })
        message.success(`${conversion.fileName} 转换成功`)
        fetchFiles() // 刷新文件列表
      } else {
        updateConversion(conversion.id, {
          ...conversion,
          status: 'error',
          progress: 0,
          error: response.data.error || '转换失败'
        })
        message.error(`${conversion.fileName} 转换失败`)
      }
    } catch (error) {
      updateConversion(conversion.id, {
        ...conversion,
        status: 'error',
        progress: 0,
        error: error.response?.data?.error || error.message
      })
      message.error(`${conversion.fileName} 转换失败: ${error.message}`)
    }
  }

  // 批量转换
  const handleConvertAll = async () => {
    const pendingConversions = conversions.filter(c => c.status === 'pending')
    
    if (pendingConversions.length === 0) {
      message.warning('没有待转换的文件')
      return
    }

    setLoading(true)
    
    for (const conversion of pendingConversions) {
      await handleConvertOne(conversion)
    }
    
    setLoading(false)
    message.success('批量转换完成')
  }

  // 更新转换状态
  const updateConversion = (id, updates) => {
    setConversions(prev => 
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    )
  }

  // 删除转换任务
  const handleDeleteConversion = (id) => {
    setConversions(prev => prev.filter(c => c.id !== id))
    message.success('已删除')
  }

  // 清空列表
  const handleClearList = () => {
    setConversions([])
    message.success('已清空列表')
  }

  // 获取状态标签
  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'default', text: '待转换' },
      processing: { color: 'processing', text: '转换中' },
      success: { color: 'success', text: '成功' },
      error: { color: 'error', text: '失败' }
    }
    const config = statusConfig[status] || statusConfig.pending
    return <Tag color={config.color}>{config.text}</Tag>
  }

  return (
    <div>
      <div className="page-header">
        <h1><SwapOutlined /> 文档格式转换</h1>
        <p>支持 PDF、Word、Excel、PowerPoint 互转</p>
      </div>

      <Row gutter={16}>
        <Col span={10}>
          <Card title="添加转换任务" loading={loading}>
            <Alert
              message="支持的转换"
              description={
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>✅ PDF → Word（提取文字和图片）</div>
                  <div>✅ Word → PDF（需要 MS Word 或 LibreOffice）</div>
                  <div>✅ Excel → PDF</div>
                  <div>✅ PowerPoint → PDF</div>
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={form} layout="vertical" onFinish={handleAddConversion}>
              <Form.Item 
                label="转换类型" 
                name="conversionType" 
                required
                rules={[{ required: true, message: '请选择转换类型' }]}
              >
                <Select 
                  placeholder="选择转换类型"
                  onChange={(value) => {
                    const [from, to] = value.split('_to_')
                    form.setFieldsValue({ fromType: from, toType: to })
                  }}
                >
                  {conversionTypes.map(type => (
                    <Option key={`${type.from}_to_${type.to}`} value={`${type.from}_to_${type.to}`}>
                      {type.icon} {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="fromType" hidden>
                <input />
              </Form.Item>
              <Form.Item name="toType" hidden>
                <input />
              </Form.Item>

              <Form.Item 
                label="选择文件" 
                name="fileId"
                required
                rules={[{ required: true, message: '请选择文件' }]}
              >
                <Select 
                  placeholder="选择要转换的文件"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {files.map(file => (
                    <Option key={file.id} value={file.id}>
                      {file.original_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item 
                label="PDF转Word选项" 
                name="extractImages" 
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="提取图片" 
                  unCheckedChildren="仅文字"
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block icon={<UploadOutlined />}>
                  添加到转换列表
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button 
                type="primary" 
                size="large"
                onClick={handleConvertAll}
                disabled={conversions.filter(c => c.status === 'pending').length === 0}
                loading={loading}
                icon={<SyncOutlined />}
              >
                开始批量转换
              </Button>
              <Button 
                danger 
                onClick={handleClearList}
                disabled={conversions.length === 0}
              >
                清空列表
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={14}>
          <Card 
            title={`转换列表 (${conversions.length})`}
            extra={
              <Space>
                <Text>
                  成功: {conversions.filter(c => c.status === 'success').length}
                </Text>
                <Text type="danger">
                  失败: {conversions.filter(c => c.status === 'error').length}
                </Text>
              </Space>
            }
          >
            <List
              dataSource={conversions}
              locale={{ emptyText: '暂无转换任务' }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    item.status === 'pending' && (
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => handleConvertOne(item)}
                      >
                        立即转换
                      </Button>
                    ),
                    item.status === 'error' && (
                      <Button 
                        type="link" 
                        size="small"
                        onClick={() => {
                          updateConversion(item.id, { ...item, status: 'pending', error: null })
                          handleConvertOne({ ...item, status: 'pending' })
                        }}
                      >
                        重试
                      </Button>
                    ),
                    <Button 
                      danger 
                      type="link" 
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteConversion(item.id)}
                    >
                      删除
                    </Button>
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {getStatusTag(item.status)}
                        <Text strong>{item.fileName}</Text>
                      </Space>
                    }
                    description={
                      <div>
                        <div>
                          <Text type="secondary">
                            {item.fromType.toUpperCase()} → {item.toType.toUpperCase()}
                          </Text>
                        </div>
                        {item.status === 'processing' && (
                          <Progress 
                            percent={item.progress} 
                            size="small" 
                            status="active"
                            style={{ marginTop: 8 }}
                          />
                        )}
                        {item.status === 'error' && (
                          <Text type="danger" style={{ display: 'block', marginTop: 4 }}>
                            错误: {item.error}
                          </Text>
                        )}
                        {item.status === 'success' && (
                          <Text type="success" style={{ display: 'block', marginTop: 4 }}>
                            ✓ 转换完成
                          </Text>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DocumentConverter

