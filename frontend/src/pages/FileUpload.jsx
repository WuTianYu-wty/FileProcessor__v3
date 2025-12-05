import { useState } from 'react'
import { Card, Upload, Button, message, Table, Progress, Space, Alert, Switch } from 'antd'
import {
  InboxOutlined,
  UploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
  FileOutlined,
} from '@ant-design/icons'
import axios from 'axios'

const { Dragger } = Upload

function FileUpload() {
  const [fileList, setFileList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [folderMode, setFolderMode] = useState(false)

  const uploadProps = {
    name: 'file',
    multiple: true,
    directory: folderMode,
    fileList: fileList,
    beforeUpload: (file) => {
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain']
      
      const isAllowedType = allowedTypes.includes(file.type) || 
        file.name.match(/\.(pdf|doc|docx|txt|wps)$/i)
      
      if (!isAllowedType) {
        message.error(`${file.name} 不是支持的文件类型`)
        return Upload.LIST_IGNORE
      }
      
      const isLt5G = file.size / 1024 / 1024 / 1024 < 5
      if (!isLt5G) {
        message.error(`${file.name} 文件大小超过 5GB`)
        return Upload.LIST_IGNORE
      }
      
      return false // Prevent auto upload
    },
    onChange: (info) => {
      setFileList(info.fileList)
    },
    onDrop: (e) => {
      console.log('Dropped files', e.dataTransfer.files)
    },
    customRequest: ({ file, onSuccess }) => {
      // 自定义请求，用于阻止默认上传
      setTimeout(() => {
        onSuccess('ok')
      }, 0)
    },
  }

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件')
      return
    }

    setUploading(true)

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const formData = new FormData()
        formData.append('file', file.originFileObj)
        
        // 添加相对路径信息（用于文件夹上传）
        const relativePath = file.originFileObj.webkitRelativePath || file.name
        formData.append('relativePath', relativePath)

        setUploadProgress(prev => ({
          ...prev,
          [file.uid]: 0
        }))

        await axios.post('/api/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadProgress(prev => ({
              ...prev,
              [file.uid]: percentCompleted
            }))
          },
        })

        setUploadProgress(prev => ({
          ...prev,
          [file.uid]: 100
        }))
      }

      message.success('所有文件上传成功')
      setFileList([])
      setUploadProgress({})
    } catch (error) {
      message.error('文件上传失败')
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (file) => {
    const newFileList = fileList.filter(item => item.uid !== file.uid)
    setFileList(newFileList)
  }

  const handleClearAll = () => {
    setFileList([])
    setUploadProgress({})
  }

  const columns = [
    {
      title: '文件路径',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (_, record) => {
        const relativePath = record.originFileObj?.webkitRelativePath || record.name
        return (
          <span>
            {folderMode && <FolderOpenOutlined style={{ marginRight: 8, color: '#faad14' }} />}
            {relativePath}
          </span>
        )
      }
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
      title: '上传进度',
      key: 'progress',
      width: 200,
      render: (_, record) => {
        const progress = uploadProgress[record.uid]
        if (progress === 100) {
          return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
        }
        if (progress > 0) {
          return <Progress percent={progress} size="small" />
        }
        return <span style={{ color: '#8c8c8c' }}>等待上传</span>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemove(record)}
          disabled={uploading}
        >
          移除
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>文件上传</h1>
        <p>上传 Word、PDF、TXT 等文件进行处理</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Alert
              message="支持的文件格式"
              description="PDF (.pdf)、Word (.doc, .docx)、WPS (.wps)、文本文件 (.txt)，单个文件最大 5GB"
              type="info"
              showIcon
              style={{ flex: 1, marginRight: 16 }}
            />
            <Space align="center">
              <FileOutlined style={{ fontSize: 20, color: folderMode ? '#999' : '#1890ff' }} />
              <Switch
                checked={folderMode}
                onChange={setFolderMode}
                checkedChildren="文件夹"
                unCheckedChildren="文件"
              />
              <FolderOpenOutlined style={{ fontSize: 20, color: folderMode ? '#faad14' : '#999' }} />
            </Space>
          </div>
          
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              {folderMode ? <FolderOpenOutlined /> : <InboxOutlined />}
            </p>
            <p className="ant-upload-text">
              {folderMode ? '点击或拖拽文件夹到此区域上传' : '点击或拖拽文件到此区域上传'}
            </p>
            <p className="ant-upload-hint">
              {folderMode 
                ? '支持上传整个文件夹，自动保持目录结构' 
                : '支持单个或批量上传。严格禁止上传公司数据或其他禁止文件'}
            </p>
          </Dragger>
        </Space>
      </Card>

      {fileList.length > 0 && (
        <Card 
          title={`待上传文件 (${fileList.length})`}
          extra={
            <Space>
              <Button 
                onClick={handleClearAll}
                disabled={uploading}
              >
                清空列表
              </Button>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={handleUpload}
                loading={uploading}
              >
                开始上传
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={fileList}
            rowKey="uid"
            pagination={false}
          />
        </Card>
      )}
    </div>
  )
}

export default FileUpload

