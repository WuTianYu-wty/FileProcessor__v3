import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Select,
  Button,
  message,
  Input,
  Space,
  InputNumber,
  Radio,
  Upload,
  Divider,
  Alert,
  List,
  Tag,
  ColorPicker,
  Switch,
  Typography,
  Row,
  Col,
  Modal,
  Tabs
} from 'antd'
import {
  EditOutlined,
  HighlightOutlined,
  SignatureOutlined,
  BorderOutlined,
  RotateRightOutlined,
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  SaveOutlined
} from '@ant-design/icons'
import axios from 'axios'
// import PDFViewer from '../components/PDFViewer' // 暂时禁用以避免页面崩溃

const { Option } = Select
const { TextArea } = Input
const { Title, Text } = Typography

function PDFEditorEnhanced() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [operations, setOperations] = useState([])
  const [currentTool, setCurrentTool] = useState('text') // text, annotation, shape, signature
  const [previewVisible, setPreviewVisible] = useState(false)
  
  // 工具参数
  const [textParams, setTextParams] = useState({
    text: '',
    fontSize: 12,
    color: { metaColor: { r: 0, g: 0, b: 0 } },
    bold: false,
    italic: false
  })

  const [annotationParams, setAnnotationParams] = useState({
    type: 'highlight',
    color: { metaColor: { r: 255, g: 255, b: 0 } },
    content: ''
  })

  const [shapeParams, setShapeParams] = useState({
    type: 'rect',
    color: { metaColor: { r: 0, g: 0, b: 0 } },
    fillColor: null,
    width: 1
  })

  // 临时绘制状态（用于拖拽绘制）
  const [drawingMode, setDrawingMode] = useState(false)
  const [startPoint, setStartPoint] = useState(null)

  // 加载文件列表
  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/files')
      if (response.data.success) {
        const pdfFiles = response.data.data.filter(f => 
          f.original_name.toLowerCase().endsWith('.pdf') && !f.is_deleted
        )
        setFiles(pdfFiles)
      }
    } catch (error) {
      message.error('加载文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理 PDF 点击
  const handlePageClick = ({ page, x, y }) => {
    if (currentTool === 'text' && textParams.text) {
      // 添加文字
      const operation = {
        type: 'add_text',
        page,
        text: textParams.text,
        x: Math.round(x),
        y: Math.round(y),
        fontSize: textParams.fontSize,
        color: [
          textParams.color.metaColor.r / 255,
          textParams.color.metaColor.g / 255,
          textParams.color.metaColor.b / 255
        ],
        fontName: 'helv',
        bold: textParams.bold,
        italic: textParams.italic
      }
      setOperations([...operations, operation])
      message.success(`已在 (${Math.round(x)}, ${Math.round(y)}) 添加文字`)
    }
  }

  // 开始绘制（用于标注和形状）
  const handleDrawStart = ({ page, x, y }) => {
    if (currentTool === 'annotation' || currentTool === 'shape') {
      setDrawingMode(true)
      setStartPoint({ page, x, y })
    }
  }

  // 结束绘制
  const handleDrawEnd = ({ page, x, y }) => {
    if (!drawingMode || !startPoint) return

    if (currentTool === 'annotation') {
      const operation = {
        type: 'add_annotation',
        page: startPoint.page,
        annotationType: annotationParams.type,
        rect: [
          Math.round(Math.min(startPoint.x, x)),
          Math.round(Math.min(startPoint.y, y)),
          Math.round(Math.max(startPoint.x, x)),
          Math.round(Math.max(startPoint.y, y))
        ],
        content: annotationParams.content,
        color: [
          annotationParams.color.metaColor.r / 255,
          annotationParams.color.metaColor.g / 255,
          annotationParams.color.metaColor.b / 255
        ]
      }
      setOperations([...operations, operation])
      message.success('已添加标注')
    } else if (currentTool === 'shape') {
      const operation = {
        type: 'add_shape',
        page: startPoint.page,
        shapeType: shapeParams.type,
        points: [
          Math.round(startPoint.x),
          Math.round(startPoint.y),
          Math.round(x),
          Math.round(y)
        ],
        color: [
          shapeParams.color.metaColor.r / 255,
          shapeParams.color.metaColor.g / 255,
          shapeParams.color.metaColor.b / 255
        ],
        fillColor: shapeParams.fillColor ? [
          shapeParams.fillColor.metaColor.r / 255,
          shapeParams.fillColor.metaColor.g / 255,
          shapeParams.fillColor.metaColor.b / 255
        ] : null,
        width: shapeParams.width
      }
      setOperations([...operations, operation])
      message.success('已添加形状')
    }

    setDrawingMode(false)
    setStartPoint(null)
  }

  // 执行所有操作
  const handleExecute = async () => {
    if (!selectedFile) {
      message.warning('请先选择文件')
      return
    }

    if (operations.length === 0) {
      message.warning('请先添加编辑操作')
      return
    }

    const outputPath = selectedFile.file_path.replace('.pdf', '_edited.pdf')

    try {
      setLoading(true)
      const response = await axios.post('/api/pdf-editor/edit', {
        inputPath: selectedFile.file_path,
        operations,
        outputPath
      })

      if (response.data.success) {
        message.success('PDF 编辑成功！')
        setOperations([])
        fetchFiles()
      } else {
        message.error(response.data.error || 'PDF 编辑失败')
      }
    } catch (error) {
      message.error('PDF 编辑失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 删除操作
  const handleDeleteOperation = (index) => {
    const newOps = operations.filter((_, i) => i !== index)
    setOperations(newOps)
    message.success('已删除操作')
  }

  // 旋转页面
  const handleRotate = (angle) => {
    if (!selectedFile) {
      message.warning('请先选择文件')
      return
    }

    const operation = {
      type: 'rotate_page',
      page: 0,
      angle
    }
    
    setOperations([...operations, operation])
    message.success(`已添加旋转 ${angle}° 操作`)
  }

  return (
    <div>
      <div className="page-header">
        <h1><EditOutlined /> PDF 编辑器（增强版）</h1>
        <p>可视化编辑 - 点击 PDF 添加元素</p>
      </div>

      <Row gutter={16}>
        {/* 左侧：PDF 预览 */}
        <Col span={14}>
          <Card 
            title="PDF 预览" 
            extra={
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => setPreviewVisible(true)}
                >
                  全屏预览
                </Button>
              </Space>
            }
          >
            <Form layout="vertical">
              <Form.Item label="选择 PDF 文件">
                <Select
                  placeholder="请选择要编辑的 PDF 文件"
                  value={selectedFile?.id}
                  onChange={(value) => {
                    const file = files.find(f => f.id === value)
                    setSelectedFile(file)
                  }}
                  style={{ width: '100%' }}
                >
                  {files.map(file => (
                    <Option key={file.id} value={file.id}>
                      {file.original_name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>

            {selectedFile && (
              <>
                <Alert
                  message="编辑提示"
                  description={
                    <div>
                      <div>• 当前工具：<Tag color="blue">{currentTool === 'text' && '添加文字'}{currentTool === 'annotation' && '添加标注'}{currentTool === 'shape' && '添加形状'}</Tag></div>
                      <div>• 点击 PDF 页面添加元素（文字直接点击，标注/形状需拖拽）</div>
                      <div>• 所有操作会添加到右侧列表，点击"执行编辑"批量应用</div>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />

                <Alert
                  message="PDF 可视化编辑功能"
                  description="暂时使用基础编辑器功能。PDF实时预览功能正在优化中，请使用左侧菜单中的 'PDF 编辑器（基础版）' 进行编辑。"
                  type="warning"
                  showIcon
                />
              </>
            )}
          </Card>
        </Col>

        {/* 右侧：工具和操作列表 */}
        <Col span={10}>
          {/* 工具选择 */}
          <Card title="编辑工具" style={{ marginBottom: 16 }}>
            <Radio.Group 
              value={currentTool} 
              onChange={(e) => setCurrentTool(e.target.value)}
              buttonStyle="solid"
              style={{ width: '100%' }}
            >
              <Radio.Button value="text" style={{ width: '50%', textAlign: 'center' }}>
                <EditOutlined /> 文字
              </Radio.Button>
              <Radio.Button value="annotation" style={{ width: '50%', textAlign: 'center' }}>
                <HighlightOutlined /> 标注
              </Radio.Button>
              <Radio.Button value="shape" style={{ width: '50%', textAlign: 'center', marginTop: 8 }}>
                <BorderOutlined /> 形状
              </Radio.Button>
              <Radio.Button value="signature" style={{ width: '50%', textAlign: 'center', marginTop: 8 }}>
                <SignatureOutlined /> 签名
              </Radio.Button>
            </Radio.Group>

            <Divider />

            {/* 文字工具参数 */}
            {currentTool === 'text' && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  placeholder="输入要添加的文字"
                  value={textParams.text}
                  onChange={(e) => setTextParams({ ...textParams, text: e.target.value })}
                />
                <Space>
                  <InputNumber
                    min={6}
                    max={72}
                    value={textParams.fontSize}
                    onChange={(val) => setTextParams({ ...textParams, fontSize: val })}
                    addonBefore="大小"
                  />
                  <ColorPicker
                    value={textParams.color}
                    onChange={(val) => setTextParams({ ...textParams, color: val })}
                    showText
                  />
                </Space>
                <Space>
                  <Switch
                    checked={textParams.bold}
                    onChange={(val) => setTextParams({ ...textParams, bold: val })}
                    checkedChildren="粗体"
                    unCheckedChildren="正常"
                  />
                  <Switch
                    checked={textParams.italic}
                    onChange={(val) => setTextParams({ ...textParams, italic: val })}
                    checkedChildren="斜体"
                    unCheckedChildren="正常"
                  />
                </Space>
              </Space>
            )}

            {/* 标注工具参数 */}
            {currentTool === 'annotation' && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  value={annotationParams.type}
                  onChange={(val) => setAnnotationParams({ ...annotationParams, type: val })}
                  style={{ width: '100%' }}
                >
                  <Option value="highlight">高亮</Option>
                  <Option value="underline">下划线</Option>
                  <Option value="strikeout">删除线</Option>
                  <Option value="square">矩形</Option>
                  <Option value="circle">圆形</Option>
                </Select>
                <ColorPicker
                  value={annotationParams.color}
                  onChange={(val) => setAnnotationParams({ ...annotationParams, color: val })}
                  showText
                />
                <TextArea
                  rows={2}
                  placeholder="批注内容（可选）"
                  value={annotationParams.content}
                  onChange={(e) => setAnnotationParams({ ...annotationParams, content: e.target.value })}
                />
                <Alert message="在 PDF 上拖拽选择区域" type="info" showIcon size="small" />
              </Space>
            )}

            {/* 形状工具参数 */}
            {currentTool === 'shape' && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Select
                  value={shapeParams.type}
                  onChange={(val) => setShapeParams({ ...shapeParams, type: val })}
                  style={{ width: '100%' }}
                >
                  <Option value="line">直线</Option>
                  <Option value="rect">矩形</Option>
                  <Option value="circle">圆形</Option>
                  <Option value="arrow">箭头</Option>
                </Select>
                <Space>
                  <ColorPicker
                    value={shapeParams.color}
                    onChange={(val) => setShapeParams({ ...shapeParams, color: val })}
                    showText
                  />
                  <InputNumber
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={shapeParams.width}
                    onChange={(val) => setShapeParams({ ...shapeParams, width: val })}
                    addonBefore="线宽"
                  />
                </Space>
                <ColorPicker
                  value={shapeParams.fillColor}
                  onChange={(val) => setShapeParams({ ...shapeParams, fillColor: val })}
                  showText
                  placeholder="填充颜色（可选）"
                />
                <Alert message="在 PDF 上拖拽绘制形状" type="info" showIcon size="small" />
              </Space>
            )}

            {/* 旋转和签名 */}
            {currentTool === 'signature' && (
              <Alert message="签名功能请使用基础版编辑器" type="info" showIcon />
            )}

            <Divider />

            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button icon={<RotateRightOutlined />} onClick={() => handleRotate(90)}>
                旋转90°
              </Button>
              <Button icon={<RotateRightOutlined />} onClick={() => handleRotate(180)}>
                旋转180°
              </Button>
            </Space>
          </Card>

          {/* 操作列表 */}
          <Card 
            title={`操作列表 (${operations.length})`}
            extra={
              <Space>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={handleExecute}
                  disabled={operations.length === 0 || !selectedFile}
                  loading={loading}
                >
                  执行编辑
                </Button>
                <Button 
                  danger 
                  onClick={() => setOperations([])}
                  disabled={operations.length === 0}
                >
                  清空
                </Button>
              </Space>
            }
          >
            <List
              dataSource={operations}
              locale={{ emptyText: '暂无操作' }}
              size="small"
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Button 
                      danger 
                      size="small" 
                      type="link"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteOperation(index)}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space size="small">
                        <Tag color="blue">{index + 1}</Tag>
                        <Text>
                          {item.type === 'add_text' && '文字'}
                          {item.type === 'add_annotation' && '标注'}
                          {item.type === 'add_shape' && '形状'}
                          {item.type === 'rotate_page' && '旋转'}
                        </Text>
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        页 {item.page} | 
                        {item.text && ` "${item.text.substring(0, 15)}..."`}
                        {item.annotationType && ` ${item.annotationType}`}
                        {item.shapeType && ` ${item.shapeType}`}
                        {item.angle && ` ${item.angle}°`}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 全屏预览 Modal */}
      <Modal
        title="PDF 全屏预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width="90%"
        footer={null}
        style={{ top: 20 }}
      >
        {selectedFile && (
          <Alert
            message="PDF 预览"
            description="PDF 预览功能正在优化中，建议下载文件后在本地查看。"
            type="info"
            showIcon
          />
        )}
      </Modal>
    </div>
  )
}

export default PDFEditorEnhanced

