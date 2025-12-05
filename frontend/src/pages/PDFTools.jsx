import { Card, Tabs, Alert } from 'antd'
import { FileSearchOutlined, ScissorOutlined, MergeCellsOutlined } from '@ant-design/icons'

function PDFTools() {
  const items = [
    {
      key: 'ocr',
      label: (
        <span>
          <FileSearchOutlined />
          OCR 识别与脱敏
        </span>
      ),
      children: (
        <div>
          <Alert
            message="功能开发中"
            description="OCR 识别与脱敏功能正在开发中，即将上线。该功能将支持自动识别文档中的敏感信息（姓名、公司、车牌等）并进行脱敏处理。"
            type="info"
            showIcon
          />
        </div>
      ),
    },
    {
      key: 'split',
      label: (
        <span>
          <ScissorOutlined />
          PDF 拆分
        </span>
      ),
      children: (
        <div>
          <Alert
            message="功能开发中"
            description="PDF 拆分功能正在开发中，即将上线。将支持按页码拆分、按目录拆分等多种方式。"
            type="info"
            showIcon
          />
        </div>
      ),
    },
    {
      key: 'merge',
      label: (
        <span>
          <MergeCellsOutlined />
          PDF 合并
        </span>
      ),
      children: (
        <div>
          <Alert
            message="功能开发中"
            description="PDF 合并功能正在开发中，即将上线。将支持多个 PDF 文件的合并操作。"
            type="info"
            showIcon
          />
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>PDF 工具</h1>
        <p>OCR 识别、PDF 拆分与合并工具</p>
      </div>

      <Card>
        <Tabs defaultActiveKey="ocr" items={items} />
      </Card>
    </div>
  )
}

export default PDFTools

