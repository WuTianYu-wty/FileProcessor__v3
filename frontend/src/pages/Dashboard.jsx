import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Alert } from 'antd'
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import axios from 'axios'

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    error: 0
  })
  const [recentFiles, setRecentFiles] = useState([])
  const [retentionAlert, setRetentionAlert] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    checkRetention()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/files')
      const files = response.data.data || []
      
      // Calculate statistics
      const stats = {
        total: files.length,
        pending: files.filter(f => f.status === 'pending').length,
        completed: files.filter(f => f.status === 'completed').length,
        error: files.filter(f => f.status === 'error').length
      }
      
      setStats(stats)
      setRecentFiles(files.slice(0, 10))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkRetention = async () => {
    try {
      const response = await axios.get('/api/logs/retention-check')
      const { oldFilesCount, retentionDays } = response.data.data
      
      if (oldFilesCount > 0) {
        setRetentionAlert({
          count: oldFilesCount,
          days: retentionDays
        })
      }
    } catch (error) {
      console.error('Error checking retention:', error)
    }
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'original_name',
      key: 'original_name',
      ellipsis: true,
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
      render: (date) => new Date(date).toLocaleString('zh-CN')
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>仪表板</h1>
        <p>系统概览与统计信息</p>
      </div>

      {retentionAlert && (
        <Alert
          message="数据保留提醒"
          description={`检测到 ${retentionAlert.count} 个文件已超过 ${retentionAlert.days} 天保留期，建议进行清理。`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总文件数"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="处理失败"
              value={stats.error}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="最近文件" 
        style={{ marginTop: 24 }}
        loading={loading}
      >
        <Table
          columns={columns}
          dataSource={recentFiles}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>
    </div>
  )
}

export default Dashboard

