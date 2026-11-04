import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { worker } from './mocks/browser'

// MSW 목 API 데모: 배포 환경에서도 워커를 켠다.
// 워커가 준비되기 전에 앱이 fetch하면 실제 네트워크로 나가므로, start()가 끝난 뒤 렌더링한다.
// 그동안은 index.html의 정적 뼈대가 보이고, 첫 렌더링이 #root 안을 바꾼다.
worker.start().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
