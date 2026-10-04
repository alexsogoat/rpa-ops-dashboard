import { Link } from 'react-router';

function NotFoundPage() {
  return (
    <main className="container">
      <p className="empty">페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="back-link">
        ← 목록으로
      </Link>
    </main>
  );
}

export default NotFoundPage;
