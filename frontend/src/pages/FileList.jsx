import { useEffect, useState } from 'react'
import { Table, Tag, Button, Space, message, Popconfirm, Input, Modal } from 'antd'
import {
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  FolderOpenOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import axios from 'axios'

function FileList() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewContent, setPreviewContent] = useState(null)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/files')
      setFiles(response.data.data || [])
    } catch (error) {
      message.error('获取文件列表失败')
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (file) => {
    try {
      const response = await axios.get(`/api/files/${file.id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.original_name)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      message.success('文件下载成功')
    } catch (error) {
      message.error('文件下载失败')
      console.error('Error downloading file:', error)
    }
  }

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`/api/files/${fileId}`)
      message.success('文件删除成功')
      fetchFiles()
    } catch (error) {
      message.error('文件删除失败')
      console.error('Error deleting file:', error)
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的文件')
      return
    }

    try {
      // 并发删除所有选中的文件
      await Promise.all(
        selectedRowKeys.map(id => axios.delete(`/api/files/${id}`))
      )
      message.success(`成功删除 ${selectedRowKeys.length} 个文件`)
      setSelectedRowKeys([])
      fetchFiles()
    } catch (error) {
      message.error('批量删除失败')
      console.error('Error batch deleting files:', error)
    }
  }

  // 批量导出（保持目录结构）
  const handleBatchExport = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要导出的文件')
      return
    }

    try {
      const response = await axios.post('/api/export/folder', {
        fileIds: selectedRowKeys
      }, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `导出文件_${Date.now()}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      message.success(`成功导出 ${selectedRowKeys.length} 个文件`)
    } catch (error) {
      message.error('导出失败')
      console.error('Error exporting files:', error)
    }
  }

  // 文件预览
  const handlePreview = async (file) => {
    setPreviewFile(file)
    setPreviewVisible(true)
    setPreviewContent(null)

    const ext = file.original_name.toLowerCase().match(/\.([^.]+)$/)?.[1]
    
    // 判断文件类型
    if (['pdf'].includes(ext)) {
      // PDF 直接使用 iframe 预览
      setPreviewContent({
        type: 'pdf',
        url: `/api/preview/${file.id}`
      })
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
      // 图片预览
      setPreviewContent({
        type: 'image',
        url: `/api/preview/${file.id}`
      })
    } else if (['txt', 'json', 'log', 'md', 'csv'].includes(ext)) {
      // 文本文件
      try {
        const response = await axios.get(`/api/preview/text/${file.id}`)
        if (response.data.success) {
          setPreviewContent({
            type: 'text',
            content: response.data.data.content
          })
        }
      } catch (error) {
        message.error('加载文本内容失败')
        setPreviewContent({
          type: 'error',
          message: '无法预览此文件类型'
        })
      }
    } else {
      setPreviewContent({
        type: 'unsupported',
        message: '该文件类型暂不支持预览'
      })
    }
  }

  // 判断文件是否支持预览
  const isPreviewSupported = (fileName) => {
    const ext = fileName.toLowerCase().match(/\.([^.]+)$/)?.[1]
    const supportedExts = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'txt', 'json', 'log', 'md', 'csv']
    return supportedExts.includes(ext)
  }

  // 选择框配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys)
    },
  }

  const columns = [
    {
      title: '文件路径',
      dataIndex: 'relative_path',
      key: 'relative_path',
      ellipsis: true,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        const searchIn = record.relative_path || record.original_name
        return searchIn.toLowerCase().includes(value.toLowerCase())
      },
      render: (relativePath, record) => {
        return relativePath || record.original_name
      }
    },
    {
      title: '类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 80,
      render: (type) => <Tag>{type.toUpperCase()}</Tag>
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      sorter: (a, b) => a.size - b.size,
      render: (size) => {
        const mb = (size / 1024 / 1024).toFixed(2)
        return `${mb} MB`
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '待处理', value: 'pending' },
        { text: '处理中', value: 'processing' },
        { text: '已完成', value: 'completed' },
        { text: '错误', value: 'error' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const statusMap = {
          pending: { color: 'default', text: '待处理' },
          processing: { color: 'processing', text: '处理中' },
          completed: { color: 'success', text: '已完成' },
          error: { color: 'error', text: '错误' }
        }
        const config = statusMap[status] || statusMap.pending
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '上传时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
      render: (date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          {isPreviewSupported(record.original_name) && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            >
              预览
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          <Popconfirm
            title="确定要删除这个文件吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>文件列表</h1>
        <p>查看和管理所有上传的文件</p>
      </div>

      <div className="content-card">
        <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Space>
            <Input
              placeholder="搜索文件名"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchFiles}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
          
          {selectedRowKeys.length > 0 && (
            <Space>
              <span style={{ color: '#1890ff', fontWeight: 500 }}>
                已选择 {selectedRowKeys.length} 项
              </span>
              <Button
                type="primary"
                icon={<FolderOpenOutlined />}
                onClick={handleBatchExport}
              >
                导出为ZIP（保持目录结构）
              </Button>
              <Popconfirm
                title={`确定要删除选中的 ${selectedRowKeys.length} 个文件吗？`}
                onConfirm={handleBatchDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                >
                  批量删除
                </Button>
              </Popconfirm>
              <Button
                onClick={() => setSelectedRowKeys([])}
              >
                取消选择
              </Button>
            </Space>
          )}
        </Space>

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={files}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个文件`
          }}
          locale={{ emptyText: '暂无文件' }}
        />
      </div>

      {/* 文件预览 Modal */}
      <Modal
        title={`预览: ${previewFile?.original_name || ''}`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={900}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => previewFile && handleDownload(previewFile)}>
            下载
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>
        ]}
        style={{ top: 20 }}
      >
        {previewContent ? (
          <div style={{ minHeight: 400, maxHeight: 600, overflow: 'auto' }}>
            {previewContent.type === 'pdf' && (
              <iframe
                src={previewContent.url}
                style={{ width: '100%', height: 600, border: 'none' }}
                title="PDF Preview"
              />
            )}
            {previewContent.type === 'image' && (
              <img
                src={previewContent.url}
                alt="Preview"
                style={{ width: '100%', height: 'auto' }}
              />
            )}
            {previewContent.type === 'text' && (
              <pre style={{ 
                padding: 16, 
                background: '#f5f5f5', 
                borderRadius: 4,
                maxHeight: 600,
                overflow: 'auto',
                fontSize: 13,
                lineHeight: 1.6
              }}>
                {previewContent.content}
              </pre>
            )}
            {(previewContent.type === 'unsupported' || previewContent.type === 'error') && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p>{previewContent.message}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p>加载中...</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FileList

