import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SentryV2 from './sentry-v2'
import SentryClient from './sentry-client'
import KnowTheRoom from './know-the-room'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SentryV2 />} />
        <Route path="/client" element={<SentryClient />} />
        <Route path="/room" element={<KnowTheRoom />} />
      </Routes>
    </BrowserRouter>
  )
}
