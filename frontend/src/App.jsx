import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import FileList from './pages/FileList'
import FileUpload from './pages/FileUpload'
import PDFTools from './pages/PDFTools'
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
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </MainLayout>
  )
}

export default App

