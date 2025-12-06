import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button, Space, Spin, Alert } from 'antd'
import { ZoomInOutlined, ZoomOutOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// 设置 worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

function PDFViewer({ file, onPageClick }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setLoading(false)
  }

  const onDocumentLoadError = (error) => {
    setError(error.message)
    setLoading(false)
  }

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages))
  }

  const previousPage = () => changePage(-1)
  const nextPage = () => changePage(1)

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))

  const handlePageClick = (event) => {
    if (onPageClick) {
      const rect = event.target.getBoundingClientRect()
      const x = (event.clientX - rect.left) / scale
      const y = (event.clientY - rect.top) / scale
      onPageClick({ page: pageNumber - 1, x, y })
    }
  }

  if (error) {
    return (
      <Alert
        message="PDF 加载失败"
        description={error}
        type="error"
        showIcon
      />
    )
  }

  if (!file) {
    return (
      <Alert
        message="未选择文件"
        description="请先选择一个 PDF 文件"
        type="info"
        showIcon
      />
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 16, padding: '12px', background: '#f0f0f0', borderRadius: 4 }}>
        <Space>
          <Button
            icon={<LeftOutlined />}
            disabled={pageNumber <= 1}
            onClick={previousPage}
          >
            上一页
          </Button>
          <span style={{ margin: '0 16px' }}>
            第 {pageNumber} / {numPages || '?'} 页
          </span>
          <Button
            icon={<RightOutlined />}
            disabled={pageNumber >= numPages}
            onClick={nextPage}
          >
            下一页
          </Button>
          <Button
            icon={<ZoomOutOutlined />}
            onClick={zoomOut}
            disabled={scale <= 0.5}
          >
            缩小
          </Button>
          <span style={{ margin: '0 8px' }}>{Math.round(scale * 100)}%</span>
          <Button
            icon={<ZoomInOutlined />}
            onClick={zoomIn}
            disabled={scale >= 3.0}
          >
            放大
          </Button>
        </Space>
      </div>

      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          overflow: 'auto',
          maxHeight: '70vh',
          background: '#f5f5f5',
          padding: 16
        }}
      >
        {loading && <Spin size="large" tip="加载 PDF 中..." />}
        
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<Spin size="large" />}
        >
          <div onClick={handlePageClick} style={{ display: 'inline-block', cursor: 'crosshair' }}>
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </div>
        </Document>
      </div>
    </div>
  )
}

export default PDFViewer

