import { useState, useEffect } from 'react'
import {
  Card,
  Button,
  message,
  Table,
  Tag,
  Radio,
  Alert,
  Typography,
  Row,
  Col,
  Space,
  Progress,
  Popconfirm
} from 'antd'
import {
  FileWordOutlined,
  FilePdfOutlined,
  SwapOutlined,
  DeleteOutlined,
  SyncOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import axios from 'axios'

const { Title, Text } = Typography

function DocumentConverter() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [conversionType, setConversionType] = useState('pdf_to_word')
  const [converting, setConverting] = useState(false)
  const [conversionResults, setConversionResults] = useState([])

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

  // 获取支持的文件列表
  const getSupportedFiles = () => {
    const typeMap = {
      'pdf_to_word': ['.pdf'],
      'word_to_pdf': ['.doc', '.docx'],
      'excel_to_pdf': ['.xls', '.xlsx'],
      'ppt_to_pdf': ['.ppt', '.pptx']
    }
    
    const extensions = typeMap[conversionType] || []
    return files.filter(f => {
      const ext = f.original_name.toLowerCase()
      return extensions.some(e => ext.endsWith(e))
    })
  }

  const supportedFiles = getSupportedFiles()

  // 执行批量转换
  const handleBatchConvert = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要转换的文件')
      return
    }

    setConverting(true)
    const results = []

    for (const fileId of selectedRowKeys) {
      const file = files.find(f => f.id === fileId)
      if (!file) continue

      try {
        const [fromType, toType] = conversionType.split('_to_')
        const ext = toType === 'word' ? '.docx' : '.pdf'
        const outputPath = file.file_path.replace(/\.[^.]+$/, `_converted${ext}`)

        const response = await axios.post('/api/converter/convert', {
          inputPath: file.file_path,
          outputPath: outputPath,
          extractImages: true
        })

        results.push({
          fileName: file.original_name,
          status: response.data.success ? 'success' : 'error',
          message: response.data.message || '转换成功',
          outputPath: response.data.outputPath
        })
      } catch (error) {
        results.push({
          fileName: file.original_name,
          status: 'error',
          message: error.response?.data?.error || '转换失败'
        })
      }
    }

    setConversionResults(results)
    setConverting(false)
    
    const successCount = results.filter(r => r.status === 'success').length
    if (successCount > 0) {
      message.success(`成功转换 ${successCount}/${results.length} 个文件`)
      fetchFiles() // 刷新文件列表
      setSelectedRowKeys([])
    } else {
      message.error('所有文件转换失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '文件名',
      dataIndex: 'original_name',
      key: 'original_name',
      ellipsis: true,
      render: (name) => (
        <Space>
          <FilePdfOutlined style={{ color: '#ff4d4f' }} />
          <Text>{name}</Text>
        </Space>
      )
    },
    {
      title: '文件类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 100,
      render: (type) => <Tag>{type.toUpperCase()}</Tag>
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size) => {
        const mb = (size / 1024 / 1024).toFixed(2)
        return `${mb} MB`
      }
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => new Date(date).toLocaleString('zh-CN')
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys)
    },
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  }

  const conversionOptions = [
    { value: 'pdf_to_word', label: 'PDF → Word', icon: <FileWordOutlined /> },
    { value: 'word_to_pdf', label: 'Word → PDF', icon: <FilePdfOutlined /> },
    { value: 'excel_to_pdf', label: 'Excel → PDF', icon: <FileWordOutlined /> },
    { value: 'ppt_to_pdf', label: 'PPT → PDF', icon: <FileWordOutlined /> }
  ]

  return (
    <div>
      <div className="page-header">
        <h1><SwapOutlined /> 文档格式转换</h1>
        <p>支持 PDF、Word、Excel、PowerPoint 互转，勾选文件批量处理</p>
      </div>

      <Row gutter={16}>
        <Col span={24}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 转换类型选择 */}
              <div>
                <Text strong style={{ marginRight: 16 }}>选择转换类型：</Text>
                <Radio.Group 
                  value={conversionType} 
                  onChange={(e) => {
                    setConversionType(e.target.value)
                    setSelectedRowKeys([]) // 切换类型时清空选择
                  }}
                  buttonStyle="solid"
                >
                  {conversionOptions.map(opt => (
                    <Radio.Button key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </div>

              {/* 文件选择表格 */}
              <div>
                <Space style={{ marginBottom: 16 }}>
                  <Text strong>
                    选择文件（已选 {selectedRowKeys.length} 个）
                  </Text>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={fetchFiles}
                    size="small"
                  >
                    刷新列表
                  </Button>
                </Space>

                <Table
                  rowSelection={rowSelection}
                  columns={columns}
                  dataSource={supportedFiles}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 个文件`
                  }}
                  locale={{ emptyText: '暂无可转换的文件' }}
                  size="middle"
                />
              </div>

              {/* 操作按钮 */}
              <div style={{ textAlign: 'center' }}>
                <Space size="large">
                  <Button
                    type="primary"
                    size="large"
                    icon={<SwapOutlined />}
                    onClick={handleBatchConvert}
                    loading={converting}
                    disabled={selectedRowKeys.length === 0}
                  >
                    开始转换 {selectedRowKeys.length > 0 && `(${selectedRowKeys.length}个文件)`}
                  </Button>
                  <Button
                    size="large"
                    onClick={() => {
                      setSelectedRowKeys([])
                      setConversionResults([])
                    }}
                  >
                    清空选择
                  </Button>
                </Space>
              </div>

              {/* 转换结果 */}
              {conversionResults.length > 0 && (
                <Alert
                  message="转换结果"
                  description={
                    <div>
                      {conversionResults.map((result, index) => (
                        <div key={index} style={{ marginBottom: 8 }}>
                          {result.status === 'success' ? '✅' : '❌'} {result.fileName}: {result.message}
                        </div>
                      ))}
                    </div>
                  }
                  type={conversionResults.every(r => r.status === 'success') ? 'success' : 'warning'}
                  showIcon
                  closable
                  onClose={() => setConversionResults([])}
                />
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DocumentConverter

