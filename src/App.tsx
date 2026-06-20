import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppState } from './hooks/useAppState'
import { useFileUpload } from './hooks/useFileUpload'
import { useState, useCallback } from 'react'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import AnalysisPage from './pages/AnalysisPage'
import ComparativoPage from './pages/ComparativoPage'
import HistoryPage from './pages/HistoryPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import LoadingOverlay from './components/ui/LoadingOverlay'

export default function App() {
  const appState = useAppState()
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Procesando…')

  const { inputRef, trigger, handleChange } = useFileUpload({
    onStart: () => { setLoading(true); setLoadingMsg('Leyendo archivo Excel…') },
    onSuccess: async (parsed) => {
      setLoadingMsg('Guardando en historial…')
      await appState.loadFile(parsed)
      setLoading(false)
    },
    onError: (msg) => { setLoading(false); alert('Error al procesar el archivo:\n\n' + msg) },
    onEnd: () => setLoading(false),
  })

  const triggerFile = useCallback(() => trigger(), [trigger])

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      <LoadingOverlay visible={loading} message={loadingMsg} />

      <Layout appState={appState} triggerFile={triggerFile}>
        <Routes>
          <Route path="/"             element={<HomePage     appState={appState} triggerFile={triggerFile} />} />
          <Route path="/analysis"     element={<AnalysisPage appState={appState} triggerFile={triggerFile} />} />
          <Route path="/comparativo"  element={<ComparativoPage appState={appState} />} />
          <Route path="/history"      element={<HistoryPage  appState={appState} />} />
          <Route path="/reports"      element={<ReportsPage  appState={appState} />} />
          <Route path="/settings"     element={<SettingsPage appState={appState} triggerFile={triggerFile} />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </>
  )
}
