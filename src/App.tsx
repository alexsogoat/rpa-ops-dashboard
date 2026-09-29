import { BrowserRouter, Route, Routes } from 'react-router';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import ProcessDetailPage from './pages/ProcessDetailPage';

function App() {
  return (
    // BrowserRouter: 주소창 URL을 읽고, 화면 이동 시 새로고침 없이 URL만 바꾼다
    <BrowserRouter>
      {/* 상단 바는 모든 화면에 공통이라 Routes 밖에 둔다 */}
      <header className="app-bar">
        <div className="app-bar-inner">
          <span className="app-logo" aria-hidden="true">
            R
          </span>
          <h1>RPA 운영 대시보드</h1>
          <span className="demo-badge">MSW 목 API 데모</span>
          <span className="app-bar-note">모든 데이터는 가상입니다</span>
        </div>
      </header>

      {/* Routes: 현재 URL과 맞는 Route 하나의 element만 그린다 */}
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        {/* :id는 경로 매개변수. /processes/PRC-001이면 id === 'PRC-001' */}
        <Route path="/processes/:id" element={<ProcessDetailPage />} />
        {/* 위 경로 중 어느 것과도 맞지 않는 URL */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
