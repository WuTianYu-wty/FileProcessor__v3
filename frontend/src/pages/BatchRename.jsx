import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Select,
  Button,
  message,
  Input,
  Space,
  List,
  Tag,
  Alert,
  Typography,
  Row,
  Col,
  Radio,
  Switch,
  Collapse,
  Table,
  Tooltip,
  Divider
} from 'antd'
import {
  EditOutlined,
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import axios from 'axios'

const { Option } = Select
const { TextArea } = Input
const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

function BatchRename() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [mode, setMode] = useState('pattern')
  const [preview, setPreview] = useState(null)
  const [variables, setVariables] = useState([])
  
  const [form] = Form.useForm()

  // 加载文件列表
  useEffect(() => {
    fetchFiles()
    fetchVariables()
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

  const fetchVariables = async () => {
    try {
      const response = await axios.get('/api/rename/variables')
      if (response.data.success) {
        setVariables(Object.values(response.data.variables))
      }
    } catch (error) {
      console.error('获取变量列表失败', error)
    }
  }

  // 预览重命名
  const handlePreview = async () => {
    if (selectedFiles.length === 0) {
      message.warning('请先选择文件')
      return
    }

    const values = form.getFieldsValue()
    const filePaths = selectedFiles.map(id => {
      const file = files.find(f => f.id === id)
      return file?.file_path
    }).filter(Boolean)

    const requestData = {
      mode,
      files: filePaths,
      dryRun: true
    }

    // 根据模式添加参数
    if (mode === 'pattern') {
      requestData.pattern = values.pattern || '{original}_{index:02}'
      if (values.customVars) {
        try {
          requestData.customVars = JSON.parse(values.customVars)
        } catch (e) {
          message.error('自定义变量格式错误，应为 JSON 格式')
          return
        }
      }
    } else if (mode === 'replace') {
      requestData.search = values.search
      requestData.replace = values.replace || ''
      requestData.caseSensitive = values.caseSensitive !== false
      requestData.useRegex = values.useRegex || false
    } else if (mode === 'prefix_suffix') {
      requestData.prefix = values.prefix || ''
      requestData.suffix = values.suffix || ''
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/rename/batch', requestData)
      if (response.data.success) {
        setPreview(response.data.preview || response.data.results)
        message.success('预览生成成功')
      } else {
        message.error(response.data.error || '预览失败')
      }
    } catch (error) {
      message.error('预览失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 执行重命名
  const handleExecute = async () => {
    if (selectedFiles.length === 0) {
      message.warning('请先选择文件')
      return
    }

    const values = form.getFieldsValue()
    const filePaths = selectedFiles.map(id => {
      const file = files.find(f => f.id === id)
      return file?.file_path
    }).filter(Boolean)

    const requestData = {
      mode,
      files: filePaths,
      dryRun: false
    }

    if (mode === 'pattern') {
      requestData.pattern = values.pattern || '{original}_{index:02}'
      if (values.customVars) {
        try {
          requestData.customVars = JSON.parse(values.customVars)
        } catch (e) {
          message.error('自定义变量格式错误')
          return
        }
      }
    } else if (mode === 'replace') {
      requestData.search = values.search
      requestData.replace = values.replace || ''
      requestData.caseSensitive = values.caseSensitive !== false
      requestData.useRegex = values.useRegex || false
    } else if (mode === 'prefix_suffix') {
      requestData.prefix = values.prefix || ''
      requestData.suffix = values.suffix || ''
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/rename/batch', requestData)
      if (response.data.success) {
        message.success(`重命名完成！成功: ${response.data.success_count}, 失败: ${response.data.fail_count}`)
        setPreview(null)
        setSelectedFiles([])
        fetchFiles()
      } else {
        message.error(response.data.error || '重命名失败')
      }
    } catch (error) {
      message.error('重命名失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '文件名',
      dataIndex: 'original_name',
      key: 'original_name',
      width: '50%',
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: '15%',
      render: (size) => {
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
        return `${(size / (1024 * 1024)).toFixed(2)} MB`
      }
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: '15%',
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '20%',
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
  ]

  // 预览表格列
  const previewColumns = [
    {
      title: '原文件名',
      dataIndex: 'original',
      key: 'original',
      width: '45%',
    },
    {
      title: '',
      key: 'arrow',
      width: '5%',
      align: 'center',
      render: () => '→'
    },
    {
      title: '新文件名',
      dataIndex: 'new',
      key: 'new',
      width: '45%',
      render: (text, record) => {
        if (record.success === false) {
          return <Text type="danger">{text} <Tooltip title={record.error}><InfoCircleOutlined /></Tooltip></Text>
        }
        return <Text type="success">{text}</Text>
      }
    },
    {
      title: '状态',
      key: 'status',
      width: '5%',
      render: (_, record) => {
        if (record.success === false) {
          return <CloseCircleOutlined style={{ color: 'red' }} />
        }
        if (record.skipped) {
          return <Tooltip title="名称未变化"><InfoCircleOutlined style={{ color: 'gray' }} /></Tooltip>
        }
        return <CheckCircleOutlined style={{ color: 'green' }} />
      }
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1><EditOutlined /> 批量文件重命名</h1>
        <p>支持模式重命名、文本替换、添加前缀/后缀</p>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="选择文件" loading={loading}>
            <Table
              rowSelection={{
                selectedRowKeys: selectedFiles,
                onChange: setSelectedFiles,
              }}
              columns={columns}
              dataSource={files}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>

          <Card title="重命名配置" style={{ marginTop: 16 }}>
            <Form form={form} layout="vertical">
              <Form.Item label="重命名模式">
                <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} buttonStyle="solid">
                  <Radio.Button value="pattern">
                    <ThunderboltOutlined /> 模式重命名
                  </Radio.Button>
                  <Radio.Button value="replace">
                    <SearchOutlined /> 文本替换
                  </Radio.Button>
                  <Radio.Button value="prefix_suffix">
                    <PlusOutlined /> 前缀/后缀
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              {mode === 'pattern' && (
                <>
                  <Form.Item 
                    label="重命名模式" 
                    name="pattern"
                    initialValue="{original}_{index:02}"
                    rules={[{ required: true, message: '请输入重命名模式' }]}
                  >
                    <Input 
                      placeholder="例如: Document_{index:03}_{date}"
                      suffix={
                        <Tooltip title="点击查看可用变量">
                          <InfoCircleOutlined />
                        </Tooltip>
                      }
                    />
                  </Form.Item>

                  <Collapse ghost>
                    <Panel header="可用变量列表" key="variables">
                      <Row gutter={[16, 16]}>
                        {variables.map(v => (
                          <Col span={12} key={v.name}>
                            <Card size="small">
                              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                <Text code>{v.name}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>{v.description}</Text>
                                <Text type="success">示例: {v.example}</Text>
                              </Space>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </Panel>
                  </Collapse>

                  <Form.Item 
                    label="自定义变量（JSON格式）" 
                    name="customVars"
                  >
                    <TextArea 
                      rows={3} 
                      placeholder='例如: {"project": "MyProject", "version": "v1.0"}'
                    />
                  </Form.Item>
                </>
              )}

              {mode === 'replace' && (
                <>
                  <Form.Item 
                    label="搜索文本" 
                    name="search"
                    rules={[{ required: true, message: '请输入要搜索的文本' }]}
                  >
                    <Input placeholder="要替换的文本" />
                  </Form.Item>

                  <Form.Item 
                    label="替换为" 
                    name="replace"
                  >
                    <Input placeholder="新文本（留空则删除）" />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Form.Item name="caseSensitive" valuePropName="checked" noStyle initialValue={true}>
                        <Switch checkedChildren="区分大小写" unCheckedChildren="忽略大小写" />
                      </Form.Item>
                      <Form.Item name="useRegex" valuePropName="checked" noStyle>
                        <Switch checkedChildren="使用正则" unCheckedChildren="普通文本" />
                      </Form.Item>
                    </Space>
                  </Form.Item>
                </>
              )}

              {mode === 'prefix_suffix' && (
                <>
                  <Form.Item label="前缀" name="prefix">
                    <Input placeholder="添加到文件名前面" />
                  </Form.Item>

                  <Form.Item label="后缀" name="suffix">
                    <Input placeholder="添加到文件名后面（扩展名之前）" />
                  </Form.Item>

                  <Alert
                    message="示例"
                    description={
                      <div>
                        <div>原文件名: document.pdf</div>
                        <div>前缀: backup_, 后缀: _2025</div>
                        <div>结果: backup_document_2025.pdf</div>
                      </div>
                    }
                    type="info"
                    showIcon
                  />
                </>
              )}

              <Divider />

              <Space>
                <Button 
                  type="primary" 
                  onClick={handlePreview}
                  icon={<EyeOutlined />}
                  disabled={selectedFiles.length === 0}
                  loading={loading}
                >
                  预览结果
                </Button>
                <Button 
                  type="primary" 
                  danger
                  onClick={handleExecute}
                  disabled={selectedFiles.length === 0}
                  loading={loading}
                >
                  执行重命名
                </Button>
                <Button onClick={() => setSelectedFiles([])}>
                  清空选择
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col span={8}>
          <Card 
            title={`预览结果 ${preview ? `(${preview.length})` : ''}`}
            extra={
              preview && (
                <Space>
                  <Text type="success">
                    成功: {preview.filter(p => p.success !== false).length}
                  </Text>
                  <Text type="danger">
                    失败: {preview.filter(p => p.success === false).length}
                  </Text>
                </Space>
              )
            }
          >
            {!preview ? (
              <Alert
                message="预览提示"
                description="选择文件并配置重命名规则后，点击'预览结果'查看重命名效果，确认无误后再执行重命名。"
                type="info"
                showIcon
              />
            ) : (
              <Table
                columns={previewColumns}
                dataSource={preview.map((item, index) => ({ ...item, key: index }))}
                pagination={false}
                size="small"
                scroll={{ y: 600 }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default BatchRename

