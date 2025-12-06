import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import FileList from './pages/FileList'
import FileUpload from './pages/FileUpload'
import PDFTools from './pages/PDFTools'
import PDFEditor from './pages/PDFEditor'
import PDFEditorEnhanced from './pages/PDFEditorEnhanced'
import DocumentConverter from './pages/DocumentConverter'
import BatchRename from './pages/BatchRename'
import VersionManagement from './pages/VersionManagement'
import Settings from './pages/Settings'
import './App.css'

const { Content } = Layout

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/files" element={<FileList />} />
        <Route path="/upload" element={<FileUpload />} />
        <Route path="/pdf-tools" element={<PDFTools />} />
        <Route path="/pdf-editor" element={<PDFEditor />} />
        <Route path="/pdf-editor-enhanced" element={<PDFEditorEnhanced />} />
        <Route path="/document-converter" element={<DocumentConverter />} />
        <Route path="/batch-rename" element={<BatchRename />} />
        <Route path="/version-management" element={<VersionManagement />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </MainLayout>
  )
}

export default App

