import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SentryHome from './sentry-home'
import SentryV2 from './sentry-v2'
import SentryClient from './sentry-client'
import SentryDashboard from './sentry-dashboard'
import SentryInsightsTiered from './sentry-insights-tiered'
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SentryV2 />} />
        <Route path="/home" element={<SentryHome />} />
        <Route path="/client" element={<SentryClient />} />
        <Route path="/dashboard" element={<SentryDashboard />} />
        <Route path="/insights-tiered" element={<SentryInsightsTiered />} />
      </Routes>
    </BrowserRouter>
  )
}
