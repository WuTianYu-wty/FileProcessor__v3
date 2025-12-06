import { Card, Alert } from 'antd'

function TestPage() {
  return (
    <div>
      <div className="page-header">
        <h1>测试页面</h1>
        <p>如果您能看到这个页面，说明 React 正常工作</p>
      </div>
      
      <Card>
        <Alert
          message="测试成功"
          description="React 应用正常运行！"
          type="success"
          showIcon
        />
      </Card>
    </div>
  )
}

export default TestPage

