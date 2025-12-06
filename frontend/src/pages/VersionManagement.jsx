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
  Timeline,
  Modal,
  Descriptions,
  Popconfirm,
  Tooltip,
  InputNumber,
  Divider,
  Empty
} from 'antd'
import {
  HistoryOutlined,
  RollbackOutlined,
  DeleteOutlined,
  DiffOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import axios from 'axios'

const { Option } = Select
const { TextArea } = Input
const { Title, Text, Paragraph } = Typography

function VersionManagement() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [versions, setVersions] = useState([])
  const [compareModal, setCompareModal] = useState(false)
  const [comparison, setComparison] = useState(null)
  
  const [createForm] = Form.useForm()

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

  // 加载文件版本
  const fetchVersions = async (fileId) => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/versions/${fileId}`)
      if (response.data.success) {
        setVersions(response.data.versions)
      } else {
        setVersions([])
      }
    } catch (error) {
      message.error('加载版本列表失败')
      setVersions([])
    } finally {
      setLoading(false)
    }
  }

  // 选择文件
  const handleSelectFile = (fileId) => {
    const file = files.find(f => f.id === fileId)
    setSelectedFile(file)
    fetchVersions(fileId)
  }

  // 创建版本
  const handleCreateVersion = async (values) => {
    if (!selectedFile) {
      message.warning('请先选择文件')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/versions/create', {
        fileId: selectedFile.id,
        filePath: selectedFile.file_path,
        comment: values.comment,
        createdBy: values.createdBy || 'user'
      })

      if (response.data.success) {
        message.success('版本创建成功')
        fetchVersions(selectedFile.id)
        createForm.resetFields()
      } else {
        message.error(response.data.error || '版本创建失败')
      }
    } catch (error) {
      message.error('版本创建失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 还原版本
  const handleRestoreVersion = async (versionNumber) => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const response = await axios.post('/api/versions/restore', {
        fileId: selectedFile.id,
        versionNumber
      })

      if (response.data.success) {
        message.success(`成功还原到版本 ${versionNumber}`)
        fetchVersions(selectedFile.id)
      } else {
        message.error(response.data.error || '还原失败')
      }
    } catch (error) {
      message.error('还原失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 删除版本
  const handleDeleteVersion = async (versionNumber) => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const response = await axios.delete(`/api/versions/${selectedFile.id}/${versionNumber}`)

      if (response.data.success) {
        message.success('版本删除成功')
        fetchVersions(selectedFile.id)
      } else {
        message.error(response.data.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 比较版本
  const handleCompareVersions = async (version1, version2) => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const response = await axios.get(
        `/api/versions/compare/${selectedFile.id}/${version1}/${version2}`
      )

      if (response.data.success) {
        setComparison(response.data.comparison)
        setCompareModal(true)
      } else {
        message.error('比较失败')
      }
    } catch (error) {
      message.error('比较失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 清理旧版本
  const handleCleanup = async (keepCount) => {
    if (!selectedFile) return

    setLoading(true)
    try {
      const response = await axios.post('/api/versions/cleanup', {
        fileId: selectedFile.id,
        keepCount: keepCount || 5
      })

      if (response.data.success) {
        message.success(`清理完成，删除了 ${response.data.deletedCount} 个旧版本`)
        fetchVersions(selectedFile.id)
      } else {
        message.error(response.data.error || '清理失败')
      }
    } catch (error) {
      message.error('清理失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 格式化文件大小
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // 格式化时间
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <div>
      <div className="page-header">
        <h1><HistoryOutlined /> 文件版本管理</h1>
        <p>创建、查看、还原、比较文件版本</p>
      </div>

      <Row gutter={16}>
        <Col span={10}>
          <Card title="选择文件" loading={loading}>
            <Form layout="vertical">
              <Form.Item label="选择要管理的文件">
                <Select
                  placeholder="请选择文件"
                  value={selectedFile?.id}
                  onChange={handleSelectFile}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {files.map(file => (
                    <Option key={file.id} value={file.id}>
                      <FileTextOutlined /> {file.original_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>

            {selectedFile && (
              <>
                <Divider />
                <Descriptions title="文件信息" column={1} size="small">
                  <Descriptions.Item label="文件名">{selectedFile.original_name}</Descriptions.Item>
                  <Descriptions.Item label="大小">{formatSize(selectedFile.size)}</Descriptions.Item>
                  <Descriptions.Item label="类型">{selectedFile.file_type}</Descriptions.Item>
                  <Descriptions.Item label="上传时间">
                    {formatTime(selectedFile.created_at)}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </Card>

          {selectedFile && (
            <Card title="创建新版本" style={{ marginTop: 16 }}>
              <Alert
                message="创建版本说明"
                description="为当前文件创建一个版本快照，可以在需要时还原到此版本。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form form={createForm} layout="vertical" onFinish={handleCreateVersion}>
                <Form.Item 
                  label="版本注释" 
                  name="comment"
                  rules={[{ required: true, message: '请输入版本注释' }]}
                >
                  <TextArea 
                    rows={3} 
                    placeholder="例如：修复了第3页的错误、更新了第5章内容" 
                  />
                </Form.Item>

                <Form.Item label="创建人" name="createdBy" initialValue="user">
                  <Input placeholder="创建人姓名" />
                </Form.Item>

                <Button type="primary" htmlType="submit" block loading={loading}>
                  创建版本
                </Button>
              </Form>
            </Card>
          )}
        </Col>

        <Col span={14}>
          <Card 
            title={`版本历史 ${versions.length > 0 ? `(${versions.length})` : ''}`}
            extra={
              selectedFile && versions.length > 5 && (
                <Popconfirm
                  title="清理旧版本"
                  description="保留最近多少个版本？"
                  onConfirm={() => handleCleanup(5)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    icon={<ClearOutlined />} 
                    size="small"
                  >
                    清理旧版本
                  </Button>
                </Popconfirm>
              )
            }
          >
            {!selectedFile ? (
              <Empty description="请先选择一个文件" />
            ) : versions.length === 0 ? (
              <Empty description="该文件暂无版本记录" />
            ) : (
              <Timeline mode="left">
                {versions.map((version, index) => (
                  <Timeline.Item
                    key={version.id}
                    color={version.is_current ? 'green' : 'blue'}
                    dot={version.is_current ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    label={
                      <Space direction="vertical" size="small">
                        <Text strong>v{version.version_number}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatTime(version.created_at)}
                        </Text>
                      </Space>
                    }
                  >
                    <Card size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {version.is_current && (
                          <Tag color="green">当前版本</Tag>
                        )}
                        
                        <Paragraph style={{ marginBottom: 8 }}>
                          <Text strong>注释：</Text>{version.comment || '无注释'}
                        </Paragraph>

                        <Space size="small" wrap>
                          <Text type="secondary">
                            <FileTextOutlined /> {formatSize(version.file_size)}
                          </Text>
                          <Text type="secondary">
                            创建人：{version.created_by}
                          </Text>
                          {version.checksum && (
                            <Tooltip title={`MD5: ${version.checksum}`}>
                              <Text type="secondary">
                                <InfoCircleOutlined /> 已校验
                              </Text>
                            </Tooltip>
                          )}
                        </Space>

                        <Divider style={{ margin: '8px 0' }} />

                        <Space>
                          {!version.is_current && (
                            <Popconfirm
                              title="确定要还原到此版本吗？"
                              description="当前文件将被替换为此版本的内容"
                              onConfirm={() => handleRestoreVersion(version.version_number)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button 
                                type="primary" 
                                size="small"
                                icon={<RollbackOutlined />}
                              >
                                还原
                              </Button>
                            </Popconfirm>
                          )}

                          {index < versions.length - 1 && (
                            <Button 
                              size="small"
                              icon={<DiffOutlined />}
                              onClick={() => handleCompareVersions(
                                version.version_number,
                                versions[index + 1].version_number
                              )}
                            >
                              与上一版本比较
                            </Button>
                          )}

                          {!version.is_current && (
                            <Popconfirm
                              title="确定要删除此版本吗？"
                              onConfirm={() => handleDeleteVersion(version.version_number)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button 
                                danger 
                                size="small"
                                icon={<DeleteOutlined />}
                              >
                                删除
                              </Button>
                            </Popconfirm>
                          )}
                        </Space>
                      </Space>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </Card>
        </Col>
      </Row>

      {/* 版本比较 Modal */}
      <Modal
        title="版本比较"
        open={compareModal}
        onCancel={() => setCompareModal(false)}
        footer={[
          <Button key="close" onClick={() => setCompareModal(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {comparison && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="版本" span={2}>
              <Space>
                <Tag color="blue">版本 {comparison.version1.number}</Tag>
                <Text>VS</Text>
                <Tag color="green">版本 {comparison.version2.number}</Tag>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="版本1 大小">
              {formatSize(comparison.version1.size)}
            </Descriptions.Item>
            <Descriptions.Item label="版本2 大小">
              {formatSize(comparison.version2.size)}
            </Descriptions.Item>

            <Descriptions.Item label="版本1 时间">
              {formatTime(comparison.version1.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="版本2 时间">
              {formatTime(comparison.version2.createdAt)}
            </Descriptions.Item>

            <Descriptions.Item label="版本1 注释">
              {comparison.version1.comment || '无'}
            </Descriptions.Item>
            <Descriptions.Item label="版本2 注释">
              {comparison.version2.comment || '无'}
            </Descriptions.Item>

            <Descriptions.Item label="差异分析" span={2}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>大小变化：</Text>
                  <Text type={comparison.differences.sizeChange > 0 ? 'success' : comparison.differences.sizeChange < 0 ? 'warning' : 'secondary'}>
                    {comparison.differences.sizeChange > 0 && '+'}
                    {formatSize(Math.abs(comparison.differences.sizeChange))}
                  </Text>
                </div>
                <div>
                  <Text>内容一致：</Text>
                  <Tag color={comparison.differences.sameContent ? 'green' : 'orange'}>
                    {comparison.differences.sameContent ? '是' : '否'}
                  </Tag>
                </div>
                <div>
                  <Text>时间间隔：</Text>
                  <Text type="secondary">
                    {Math.floor(comparison.differences.timeDiff / 1000 / 60)} 分钟
                  </Text>
                </div>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default VersionManagement

