import { useState, useEffect } from 'react'
import { Card, Form, InputNumber, Button, message, Divider, Space, Switch } from 'antd'
import axios from 'axios'

function Settings() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      // In a real app, this would fetch from the backend
      form.setFieldsValue({
        retentionDays: 7,
        autoCleanup: false,
        maxFileSize: 50,
      })
    } catch (error) {
      message.error('获取设置失败')
    }
  }

  const handleSave = async (values) => {
    setLoading(true)
    try {
      // In a real app, this would save to the backend
      console.log('Settings to save:', values)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      message.success('设置保存成功')
    } catch (error) {
      message.error('保存设置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    message.info('设置已重置为默认值')
  }

  return (
    <div>
      <div className="page-header">
        <h1>系统设置</h1>
        <p>配置系统参数和数据保留策略</p>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            retentionDays: 7,
            autoCleanup: false,
            maxFileSize: 50,
          }}
        >
          <Divider orientation="left">数据保留设置</Divider>
          
          <Form.Item
            label="数据保留天数"
            name="retentionDays"
            tooltip="系统会在文件超过设定天数后提醒清理"
            rules={[
              { required: true, message: '请输入保留天数' },
              { type: 'number', min: 1, max: 365, message: '保留天数应在 1-365 之间' }
            ]}
          >
            <InputNumber
              style={{ width: 200 }}
              min={1}
              max={365}
              addonAfter="天"
            />
          </Form.Item>

          <Form.Item
            label="自动清理"
            name="autoCleanup"
            valuePropName="checked"
            tooltip="启用后，系统会自动清理超期文件"
          >
            <Switch />
          </Form.Item>

          <Divider orientation="left">文件上传设置</Divider>

          <Form.Item
            label="最大文件大小"
            name="maxFileSize"
            tooltip="单个文件的最大上传大小限制"
            rules={[
              { required: true, message: '请输入文件大小限制' },
              { type: 'number', min: 1, max: 500, message: '文件大小应在 1-500 MB 之间' }
            ]}
          >
            <InputNumber
              style={{ width: 200 }}
              min={1}
              max={500}
              addonAfter="MB"
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存设置
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider orientation="left">系统信息</Divider>
        
        <div style={{ color: '#8c8c8c' }}>
          <p>版本: v1.0.0</p>
          <p>后端: Node.js + Express + SQLite</p>
          <p>前端: React + Vite + Ant Design</p>
          <p>Python: PaddleOCR + PyMuPDF</p>
        </div>
      </Card>
    </div>
  )
}

export default Settings

