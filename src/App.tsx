import { Routes, Route } from 'react-router-dom'
import { I18nProvider } from './i18n'
import Layout from './components/Layout'
import HomePage from './HomePage'
import GenericToolPage from './tools/GenericToolPage'
import SpecialToolPage from './tools/SpecialToolPage'

export default function App() {
  return (
    <I18nProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tool/:id" element={<ToolRouter />} />
        </Routes>
      </Layout>
    </I18nProvider>
  )
}

function ToolRouter() {
  // 通用页面和特殊页面分发
  return <SpecialToolPage />
}
