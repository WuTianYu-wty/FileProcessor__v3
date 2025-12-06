import { useState } from 'react'
import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  FileTextOutlined,
  UploadOutlined,
  FileSearchOutlined,
  EditOutlined,
  SwapOutlined,
  TagsOutlined,
  HistoryOutlined,
  ToolOutlined,
  SettingOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout

function MainLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/files',
      icon: <FileTextOutlined />,
      label: '文件列表',
    },
    {
      key: '/upload',
      icon: <UploadOutlined />,
      label: '文件上传',
    },
    {
      key: 'pdf-menu',
      icon: <FileSearchOutlined />,
      label: 'PDF 工具',
      children: [
        {
          key: '/pdf-tools',
          icon: <FileSearchOutlined />,
          label: 'OCR 与拆分合并',
        },
        {
          key: '/pdf-editor',
          icon: <EditOutlined />,
          label: 'PDF 编辑器',
        },
      ],
    },
    {
      key: 'advanced-tools',
      icon: <ToolOutlined />,
      label: '高级工具',
      children: [
        {
          key: '/document-converter',
          icon: <SwapOutlined />,
          label: '文档格式转换',
        },
        {
          key: '/batch-rename',
          icon: <TagsOutlined />,
          label: '批量重命名',
        },
        {
          key: '/version-management',
          icon: <HistoryOutlined />,
          label: '版本管理',
        },
      ],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {collapsed ? 'FP' : 'FileProcessor'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 16 }}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            文件处理系统
          </div>
          <div style={{ color: '#8c8c8c' }}>
            v2.0.0 - Phase 3 完成
          </div>
        </Header>
        <Content className="app-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout

