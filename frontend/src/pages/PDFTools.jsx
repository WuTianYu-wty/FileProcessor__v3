import { useState, useEffect } from 'react'
import { 
  Card, 
  Tabs, 
  Form, 
  Select, 
  Button, 
  message, 
  Input, 
  Space, 
  List, 
  Tag, 
  Modal,
  Divider,
  Alert,
  Spin,
  InputNumber,
  Switch,
  Typography,
  Progress
} from 'antd'
import {
  FileSearchOutlined,
  ScissorOutlined,
  MergeCellsOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  DownloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import axios from 'axios'

const { Option } = Select
const { TextArea } = Input
const { Title, Text, Paragraph } = Typography

function PDFTools() {
  // ========== 通用状态 ==========
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  // ========== PDF 拆分状态 ==========
  const [splitForm] = Form.useForm()
  const [splitMode, setSplitMode] = useState('pages')
  const [splitRanges, setSplitRanges] = useState([[1, 10]])
  const [splitLoading, setSplitLoading] = useState(false)
  const [pdfInfo, setPdfInfo] = useState(null)

  // ========== PDF 合并状态 ==========
  const [mergeForm] = Form.useForm()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [mergeLoading, setMergeLoading] = useState(false)

  // ========== OCR 状态 ==========
  const [ocrForm] = Form.useForm()
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrResult, setOcrResult] = useState(null)
  const [showOcrResult, setShowOcrResult] = useState(false)
  const [customNames, setCustomNames] = useState('')
  const [customAddresses, setCustomAddresses] = useState('')
  const [customCompanies, setCustomCompanies] = useState('')

  // 加载文件列表
  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/files')
      if (response.data.success) {
        setFiles(response.data.data)
      }
    } catch (error) {
      message.error('加载文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取 PDF 文件列表
  const pdfFiles = files.filter(f => 
    f.original_name.toLowerCase().endsWith('.pdf') && !f.is_deleted
  )

  // 获取支持 OCR 的文件列表
  const ocrSupportedFiles = files.filter(f => {
    const ext = f.original_name.toLowerCase()
    return (ext.endsWith('.pdf') || 
            ext.endsWith('.jpg') || 
            ext.endsWith('.jpeg') || 
            ext.endsWith('.png') || 
            ext.endsWith('.bmp')) && !f.is_deleted
  })

  // ========== PDF 拆分功能 ==========
  
  const handleGetPdfInfo = async (fileId) => {
    try {
      const response = await axios.get(`/api/pdf/info/${fileId}`)
      if (response.data.success) {
        setPdfInfo(response.data.data)
        message.success('PDF 信息加载成功')
      }
    } catch (error) {
      message.error('获取 PDF 信息失败')
    }
  }

  const handleAddRange = () => {
    setSplitRanges([...splitRanges, [1, 10]])
  }

  const handleRemoveRange = (index) => {
    if (splitRanges.length > 1) {
      setSplitRanges(splitRanges.filter((_, i) => i !== index))
    }
  }

  const handleRangeChange = (index, type, value) => {
    const newRanges = [...splitRanges]
    newRanges[index][type === 'start' ? 0 : 1] = value
    setSplitRanges(newRanges)
  }

  const handleSplitPdf = async (values) => {
    setSplitLoading(true)
    try {
      const payload = {
        fileId: values.fileId,
        mode: splitMode,
        ranges: splitMode === 'pages' ? splitRanges : undefined
      }

      const response = await axios.post('/api/pdf/split', payload)
      
      if (response.data.success) {
        message.success(response.data.message)
        splitForm.resetFields()
        setSplitRanges([[1, 10]])
        setPdfInfo(null)
        fetchFiles() // 刷新文件列表
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'PDF 拆分失败')
    } finally {
      setSplitLoading(false)
    }
  }

  // ========== PDF 合并功能 ==========
  
  const handleMergePdf = async (values) => {
    if (selectedFiles.length < 2) {
      message.warning('请至少选择 2 个 PDF 文件')
      return
    }

    setMergeLoading(true)
    try {
      const response = await axios.post('/api/pdf/merge', {
        fileIds: selectedFiles,
        outputName: values.outputName || `merged_${Date.now()}.pdf`
      })

      if (response.data.success) {
        message.success(response.data.message)
        mergeForm.resetFields()
        setSelectedFiles([])
        fetchFiles() // 刷新文件列表
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'PDF 合并失败')
    } finally {
      setMergeLoading(false)
    }
  }

  // ========== OCR 功能 ==========
  
  const handleOcrProcess = async (values) => {
    setOcrLoading(true)
    try {
      // 解析自定义姓名列表
      const customNamesList = customNames
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0)
      
      // 解析自定义地址列表
      const customAddressesList = customAddresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0)
      
      // 解析自定义公司列表
      const customCompaniesList = customCompanies
        .split('\n')
        .map(comp => comp.trim())
        .filter(comp => comp.length > 0)
      
      const response = await axios.post('/api/ocr/process', {
        fileId: values.fileId,
        enableDesensitize: values.enableDesensitize !== false,
        enableNameDesensitize: values.enableNameDesensitize !== false,
        enableAddressDesensitize: values.enableAddressDesensitize !== false,
        enableCompanyDesensitize: values.enableCompanyDesensitize !== false,
        useGpu: values.useGpu !== false,
        customNames: customNamesList,
        customAddresses: customAddressesList,
        customCompanies: customCompaniesList
      })

      if (response.data.success) {
        message.success('OCR 处理成功！')
        setOcrResult(response.data.data.ocrResult)
        setShowOcrResult(true)
        fetchFiles() // 刷新文件列表
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'OCR 处理失败')
    } finally {
      setOcrLoading(false)
    }
  }

  // ========== 渲染页签内容 ==========

  const renderSplitTab = () => (
    <div>
      <Alert
        message="PDF 拆分功能"
        description="支持按页码范围拆分或按 PDF 书签目录拆分。拆分后的文件将自动保存到文件列表。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={splitForm}
        layout="vertical"
        onFinish={handleSplitPdf}
      >
        <Form.Item
          name="fileId"
          label="选择 PDF 文件"
          rules={[{ required: true, message: '请选择要拆分的 PDF 文件' }]}
        >
          <Select
            placeholder="选择 PDF 文件"
            loading={loading}
            onChange={(value) => handleGetPdfInfo(value)}
            showSearch
            optionFilterProp="children"
          >
            {pdfFiles.map(file => (
              <Option key={file.id} value={file.id}>
                {file.original_name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Option>
            ))}
          </Select>
        </Form.Item>

        {pdfInfo && (
          <Alert
            message="PDF 信息"
            description={
              <div>
                <p>总页数: {pdfInfo.page_count} 页</p>
                {pdfInfo.has_bookmarks && (
                  <p>包含书签: {pdfInfo.bookmarks.length} 个</p>
                )}
              </div>
            }
            type="success"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item label="拆分模式">
          <Select value={splitMode} onChange={setSplitMode}>
            <Option value="pages">按页码范围</Option>
            <Option value="bookmarks">按书签目录</Option>
          </Select>
        </Form.Item>

        {splitMode === 'pages' && (
          <Form.Item label="页码范围">
            <Space direction="vertical" style={{ width: '100%' }}>
              {splitRanges.map((range, index) => (
                <Space key={index} style={{ width: '100%' }}>
                  <InputNumber
                    min={1}
                    max={pdfInfo?.page_count || 9999}
                    value={range[0]}
                    onChange={(val) => handleRangeChange(index, 'start', val)}
                    placeholder="起始页"
                  />
                  <span>-</span>
                  <InputNumber
                    min={1}
                    max={pdfInfo?.page_count || 9999}
                    value={range[1]}
                    onChange={(val) => handleRangeChange(index, 'end', val)}
                    placeholder="结束页"
                  />
                  {splitRanges.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => handleRemoveRange(index)}
                    />
                  )}
                </Space>
              ))}
              <Button
                type="dashed"
                onClick={handleAddRange}
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                添加范围
              </Button>
            </Space>
          </Form.Item>
        )}

        {splitMode === 'bookmarks' && pdfInfo && !pdfInfo.has_bookmarks && (
          <Alert
            message="该 PDF 没有书签"
            description="此文件不包含书签信息，无法使用按书签拆分功能。请选择按页码范围拆分。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<ScissorOutlined />}
            loading={splitLoading}
            disabled={splitMode === 'bookmarks' && pdfInfo && !pdfInfo.has_bookmarks}
          >
            开始拆分
          </Button>
        </Form.Item>
      </Form>
    </div>
  )

  const renderMergeTab = () => (
    <div>
      <Alert
        message="PDF 合并功能"
        description="选择多个 PDF 文件，将它们合并为一个 PDF 文件。文件将按照选择的顺序进行合并。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={mergeForm}
        layout="vertical"
        onFinish={handleMergePdf}
      >
        <Form.Item label="选择要合并的 PDF 文件">
          <Select
            mode="multiple"
            placeholder="选择多个 PDF 文件（至少 2 个）"
            value={selectedFiles}
            onChange={setSelectedFiles}
            loading={loading}
            showSearch
            optionFilterProp="children"
          >
            {pdfFiles.map(file => (
              <Option key={file.id} value={file.id}>
                {file.original_name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedFiles.length > 0 && (
          <Alert
            message={`已选择 ${selectedFiles.length} 个文件`}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item
          name="outputName"
          label="合并后的文件名"
          rules={[
            { required: true, message: '请输入文件名' },
            { pattern: /^[^<>:"/\\|?*]+\.pdf$/i, message: '请输入有效的 PDF 文件名' }
          ]}
        >
          <Input placeholder="例如: merged_document.pdf" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<MergeCellsOutlined />}
            loading={mergeLoading}
            disabled={selectedFiles.length < 2}
          >
            开始合并
          </Button>
        </Form.Item>
      </Form>
    </div>
  )

  const renderOcrTab = () => (
    <div>
      <Alert
        message="OCR 识别与脱敏功能 - 增强版 ⚡"
        description="支持 GPU 加速（RTX 5070）、自定义姓名/地址/公司脱敏、智能识别敏感信息。首次使用会下载 OCR 模型，请耐心等待。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={ocrForm}
        layout="vertical"
        onFinish={handleOcrProcess}
      >
        <Form.Item
          name="fileId"
          label="选择文件"
          rules={[{ required: true, message: '请选择要处理的文件' }]}
        >
          <Select
            placeholder="选择 PDF 或图片文件"
            loading={loading}
            showSearch
            optionFilterProp="children"
          >
            {ocrSupportedFiles.map(file => (
              <Option key={file.id} value={file.id}>
                {file.original_name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="useGpu"
          label="GPU 加速"
          valuePropName="checked"
          initialValue={true}
          tooltip="启用 GPU 可提升 5-10 倍处理速度（需要 NVIDIA 显卡和 CUDA）"
        >
          <Switch checkedChildren="✅ 启用" unCheckedChildren="❌ 禁用" defaultChecked />
        </Form.Item>

        <Form.Item
          name="enableDesensitize"
          label="基础脱敏"
          valuePropName="checked"
          initialValue={true}
          tooltip="自动脱敏手机号、身份证、邮箱、车牌号、银行卡等"
        >
          <Switch checkedChildren="开启" unCheckedChildren="关闭" defaultChecked />
        </Form.Item>

        <Form.Item
          name="enableNameDesensitize"
          label="姓名脱敏"
          valuePropName="checked"
          initialValue={true}
          tooltip="自动识别并脱敏常见中文姓名"
        >
          <Switch checkedChildren="开启" unCheckedChildren="关闭" defaultChecked />
        </Form.Item>

        <Form.Item
          name="enableAddressDesensitize"
          label="地址脱敏"
          valuePropName="checked"
          initialValue={true}
          tooltip="自动脱敏自定义地址信息"
        >
          <Switch checkedChildren="开启" unCheckedChildren="关闭" defaultChecked />
        </Form.Item>

        <Form.Item
          name="enableCompanyDesensitize"
          label="公司脱敏"
          valuePropName="checked"
          initialValue={true}
          tooltip="自动脱敏自定义公司名称"
        >
          <Switch checkedChildren="开启" unCheckedChildren="关闭" defaultChecked />
        </Form.Item>

        <Divider orientation="left">自定义脱敏配置</Divider>

        <Form.Item
          label="自定义姓名列表"
          tooltip="每行输入一个需要脱敏的姓名，系统会自动脱敏这些姓名"
        >
          <TextArea
            rows={3}
            placeholder="张三&#10;李四&#10;王五&#10;（每行一个姓名）"
            value={customNames}
            onChange={(e) => setCustomNames(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          label="自定义地址列表"
          tooltip="每行输入一个需要脱敏的地址，如公司地址、家庭住址等"
        >
          <TextArea
            rows={3}
            placeholder="北京市朝阳区建国路XX号&#10;上海市浦东新区世纪大道XX号&#10;（每行一个地址）"
            value={customAddresses}
            onChange={(e) => setCustomAddresses(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          label="自定义公司列表"
          tooltip="每行输入一个需要脱敏的公司名称"
        >
          <TextArea
            rows={3}
            placeholder="XX科技有限公司&#10;XX集团股份有限公司&#10;（每行一个公司名）"
            value={customCompanies}
            onChange={(e) => setCustomCompanies(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<FileSearchOutlined />}
            loading={ocrLoading}
          >
            {ocrLoading ? 'OCR 处理中...' : '开始识别'}
          </Button>
        </Form.Item>
      </Form>

      {ocrLoading && (
        <Alert
          message="正在处理中"
          description="OCR 处理可能需要较长时间，请耐心等待。处理完成后会自动显示结果。"
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  )

  const items = [
    {
      key: 'split',
      label: (
        <span>
          <ScissorOutlined />
          PDF 拆分
        </span>
      ),
      children: renderSplitTab(),
    },
    {
      key: 'merge',
      label: (
        <span>
          <MergeCellsOutlined />
          PDF 合并
        </span>
      ),
      children: renderMergeTab(),
    },
    {
      key: 'ocr',
      label: (
        <span>
          <FileSearchOutlined />
          OCR 识别与脱敏
        </span>
      ),
      children: renderOcrTab(),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1>PDF 工具</h1>
        <p>OCR 识别、PDF 拆分与合并工具</p>
      </div>

      <Card>
        <Tabs defaultActiveKey="split" items={items} />
      </Card>

      {/* OCR 结果展示 Modal */}
      <Modal
        title="OCR 识别结果"
        open={showOcrResult}
        onCancel={() => setShowOcrResult(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowOcrResult(false)}>
            关闭
          </Button>
        ]}
      >
        {ocrResult && (
          <div>
            <Alert
              message={`总共处理 ${ocrResult.total_pages} 页`}
              type="success"
              style={{ marginBottom: 16 }}
            />
            
            {ocrResult.results && ocrResult.results.map((page, index) => (
              <div key={index} style={{ marginBottom: 24 }}>
                <Title level={5}>第 {page.page} 页</Title>
                
                <Divider orientation="left">原始文本</Divider>
                <Paragraph>
                  {page.original_text && page.original_text.length > 0 
                    ? page.original_text.join('\n') 
                    : '未识别到文字'}
                </Paragraph>
                
                <Divider orientation="left">脱敏后文本</Divider>
                <Paragraph type="success">
                  {page.desensitized_text && page.desensitized_text.length > 0 
                    ? page.desensitized_text.join('\n') 
                    : '未识别到文字'}
                </Paragraph>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PDFTools
