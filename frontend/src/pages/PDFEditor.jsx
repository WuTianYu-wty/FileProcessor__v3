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
  Collapse
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
  InfoCircleOutlined
} from '@ant-design/icons'
import axios from 'axios'

const { Option } = Select
const { TextArea } = Input
const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

function PDFEditor() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [operations, setOperations] = useState([])
  const [currentOp, setCurrentOp] = useState(null)
  
  // 表单
  const [textForm] = Form.useForm()
  const [annotationForm] = Form.useForm()
  const [shapeForm] = Form.useForm()
  const [signatureForm] = Form.useForm()

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

  // 添加文字操作
  const handleAddText = async (values) => {
    const operation = {
      type: 'add_text',
      page: values.page,
      text: values.text,
      x: values.x,
      y: values.y,
      fontSize: values.fontSize || 12,
      color: values.color ? [
        values.color.metaColor.r / 255,
        values.color.metaColor.g / 255,
        values.color.metaColor.b / 255
      ] : [0, 0, 0],
      fontName: values.fontName || 'helv',
      bold: values.bold || false,
      italic: values.italic || false
    }
    
    setOperations([...operations, operation])
    message.success('已添加文字操作')
    textForm.resetFields()
  }

  // 添加标注操作
  const handleAddAnnotation = async (values) => {
    const operation = {
      type: 'add_annotation',
      page: values.page,
      annotationType: values.annotationType,
      rect: [values.x0, values.y0, values.x1, values.y1],
      content: values.content || '',
      color: values.color ? [
        values.color.metaColor.r / 255,
        values.color.metaColor.g / 255,
        values.color.metaColor.b / 255
      ] : [1, 1, 0]
    }
    
    setOperations([...operations, operation])
    message.success('已添加标注操作')
    annotationForm.resetFields()
  }

  // 添加形状操作
  const handleAddShape = async (values) => {
    const operation = {
      type: 'add_shape',
      page: values.page,
      shapeType: values.shapeType,
      points: [values.x0, values.y0, values.x1, values.y1],
      color: values.color ? [
        values.color.metaColor.r / 255,
        values.color.metaColor.g / 255,
        values.color.metaColor.b / 255
      ] : [0, 0, 0],
      fillColor: values.fillColor ? [
        values.fillColor.metaColor.r / 255,
        values.fillColor.metaColor.g / 255,
        values.fillColor.metaColor.b / 255
      ] : null,
      width: values.width || 1
    }
    
    setOperations([...operations, operation])
    message.success('已添加形状操作')
    shapeForm.resetFields()
  }

  // 添加签名
  const handleAddSignature = async (fileList) => {
    if (fileList.length === 0) return

    const values = signatureForm.getFieldsValue()
    const file = fileList[0]
    
    // 这里需要先上传签名图片
    const formData = new FormData()
    formData.append('signature', file.originFileObj)
    formData.append('inputPath', selectedFile?.file_path)
    formData.append('page', values.page || 0)
    formData.append('x', values.x || 100)
    formData.append('y', values.y || 100)
    formData.append('width', values.width || 100)
    formData.append('height', values.height || 50)
    
    try {
      setLoading(true)
      const response = await axios.post('/api/pdf-editor/add-signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.success) {
        message.success('签名添加成功')
        fetchFiles()
      } else {
        message.error(response.data.error || '签名添加失败')
      }
    } catch (error) {
      message.error('签名添加失败: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 旋转页面
  const handleRotatePage = async (angle) => {
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

  // 清空操作
  const handleClearOperations = () => {
    setOperations([])
    message.success('已清空所有操作')
  }

  return (
    <div>
      <div className="page-header">
        <h1><EditOutlined /> PDF 编辑器</h1>
        <p>添加文字、标注、签名、形状，旋转页面</p>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="编辑操作" loading={loading}>
            <Alert
              message="操作说明"
              description="选择文件后，添加各种编辑操作。坐标原点在左上角，单位为点（1英寸=72点）。添加的操作会在列表中显示，点击'执行编辑'后批量应用。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form layout="vertical">
              <Form.Item label="选择 PDF 文件" required>
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

            <Divider />

            <Collapse defaultActiveKey={['text']} accordion>
              {/* 添加文字 */}
              <Panel header={<><EditOutlined /> 添加文字</>} key="text">
                <Form form={textForm} layout="vertical" onFinish={handleAddText}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="页码（从0开始）" name="page" initialValue={0}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="X 坐标" name="x" initialValue={100}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Y 坐标" name="y" initialValue={100}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="文字内容" name="text" rules={[{ required: true }]}>
                    <TextArea rows={3} placeholder="请输入要添加的文字" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="字体大小" name="fontSize" initialValue={12}>
                        <InputNumber min={6} max={72} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="颜色" name="color">
                        <ColorPicker showText />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="样式">
                        <Space>
                          <Form.Item name="bold" valuePropName="checked" noStyle>
                            <Switch checkedChildren="粗体" unCheckedChildren="正常" />
                          </Form.Item>
                          <Form.Item name="italic" valuePropName="checked" noStyle>
                            <Switch checkedChildren="斜体" unCheckedChildren="正常" />
                          </Form.Item>
                        </Space>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                    添加文字操作
                  </Button>
                </Form>
              </Panel>

              {/* 添加标注 */}
              <Panel header={<><HighlightOutlined /> 添加标注</>} key="annotation">
                <Form form={annotationForm} layout="vertical" onFinish={handleAddAnnotation}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="页码" name="page" initialValue={0}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="标注类型" name="annotationType" initialValue="highlight">
                        <Select>
                          <Option value="highlight">高亮</Option>
                          <Option value="underline">下划线</Option>
                          <Option value="strikeout">删除线</Option>
                          <Option value="squiggly">波浪线</Option>
                          <Option value="text">文字批注</Option>
                          <Option value="square">矩形</Option>
                          <Option value="circle">圆形</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item label="X0" name="x0" initialValue={100}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Y0" name="y0" initialValue={100}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="X1" name="x1" initialValue={300}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Y1" name="y1" initialValue={120}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="批注内容" name="content">
                    <TextArea rows={2} placeholder="可选：添加批注文字" />
                  </Form.Item>

                  <Form.Item label="颜色" name="color">
                    <ColorPicker showText />
                  </Form.Item>

                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                    添加标注操作
                  </Button>
                </Form>
              </Panel>

              {/* 添加形状 */}
              <Panel header={<><BorderOutlined /> 添加形状</>} key="shape">
                <Form form={shapeForm} layout="vertical" onFinish={handleAddShape}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="页码" name="page" initialValue={0}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="形状类型" name="shapeType" initialValue="rect">
                        <Select>
                          <Option value="line">直线</Option>
                          <Option value="rect">矩形</Option>
                          <Option value="circle">圆形</Option>
                          <Option value="arrow">箭头</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item label="X0" name="x0" initialValue={100}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Y0" name="y0" initialValue={100}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="X1" name="x1" initialValue={300}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Y1" name="y1" initialValue={200}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="边框颜色" name="color">
                        <ColorPicker showText />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="填充颜色" name="fillColor">
                        <ColorPicker showText />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="线宽" name="width" initialValue={1}>
                        <InputNumber min={0.5} max={10} step={0.5} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                    添加形状操作
                  </Button>
                </Form>
              </Panel>

              {/* 添加签名 */}
              <Panel header={<><SignatureOutlined /> 添加签名</>} key="signature">
                <Form form={signatureForm} layout="vertical">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="页码" name="page" initialValue={0}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="X 坐标" name="x" initialValue={400}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Y 坐标" name="y" initialValue={700}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="宽度" name="width" initialValue={100}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="高度" name="height" initialValue={50}>
                        <InputNumber style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="签名图片">
                    <Upload
                      accept="image/*"
                      beforeUpload={() => false}
                      onChange={({ fileList }) => handleAddSignature(fileList)}
                      maxCount={1}
                    >
                      <Button icon={<SignatureOutlined />}>选择签名图片</Button>
                    </Upload>
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      建议使用透明背景的 PNG 图片
                    </Text>
                  </Form.Item>
                </Form>
              </Panel>

              {/* 旋转页面 */}
              <Panel header={<><RotateRightOutlined /> 旋转页面</>} key="rotate">
                <Space size="large">
                  <Button onClick={() => handleRotatePage(90)} icon={<RotateRightOutlined />}>
                    旋转 90°
                  </Button>
                  <Button onClick={() => handleRotatePage(180)} icon={<RotateRightOutlined />}>
                    旋转 180°
                  </Button>
                  <Button onClick={() => handleRotatePage(270)} icon={<RotateRightOutlined />}>
                    旋转 270°
                  </Button>
                </Space>
              </Panel>
            </Collapse>
          </Card>
        </Col>

        <Col span={8}>
          <Card 
            title={`操作列表 (${operations.length})`}
            extra={
              <Space>
                <Button 
                  type="primary" 
                  onClick={handleExecute}
                  disabled={operations.length === 0 || !selectedFile}
                  loading={loading}
                  icon={<DownloadOutlined />}
                >
                  执行编辑
                </Button>
                <Button 
                  danger 
                  onClick={handleClearOperations}
                  disabled={operations.length === 0}
                >
                  清空
                </Button>
              </Space>
            }
          >
            <List
              dataSource={operations}
              locale={{ emptyText: '暂无操作，请在左侧添加' }}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Button 
                      danger 
                      size="small" 
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteOperation(index)}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color="blue">{index + 1}</Tag>
                        <Text strong>
                          {item.type === 'add_text' && '添加文字'}
                          {item.type === 'add_annotation' && '添加标注'}
                          {item.type === 'add_shape' && '添加形状'}
                          {item.type === 'add_signature' && '添加签名'}
                          {item.type === 'rotate_page' && '旋转页面'}
                        </Text>
                      </Space>
                    }
                    description={
                      <div>
                        <div>页码: {item.page}</div>
                        {item.text && <div>文字: {item.text.substring(0, 20)}...</div>}
                        {item.annotationType && <div>类型: {item.annotationType}</div>}
                        {item.shapeType && <div>形状: {item.shapeType}</div>}
                        {item.angle && <div>角度: {item.angle}°</div>}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default PDFEditor

