import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="logo-area">
          <div className="logo-icon">💡</div>
        </div>

        <h1>목포 시화마을 보물찾기</h1>
        <p className="subtitle">시화마을의 숨겨진 명소를 찾아내는 모험!</p>

        <div className="description">
          <p>조별로 함께 7개의 문제를 풀어보세요.</p>
          <p>영화 촬영지, 숨겨진 명소, 지역의 특별한 장소들을 찾아내며</p>
          <p>시화마을을 새롭게 발견해보세요!</p>
        </div>

        <div className="button-group">
          <button
            className="btn-participant"
            onClick={() => navigate('/join')}
          >
            🎮 참가하기
          </button>
          <button
            className="btn-admin"
            onClick={() => navigate('/admin/login')}
          >
            ⚙️ 관리자
          </button>
        </div>

        <div className="info-box">
          <p>
            <strong>참가 방법:</strong> 입장 코드를 입력하면 게임을 시작할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
