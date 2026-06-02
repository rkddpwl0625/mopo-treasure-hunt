import { useNavigate, useParams } from 'react-router-dom'
import './Participant.css'

export default function ParticipantOrientation() {
  const navigate = useNavigate()
  const { gameId, teamId } = useParams<{ gameId: string; teamId: string }>()

  return (
    <div className="participant-container">
      <button
        className="btn-back"
        onClick={() => navigate(`/register/${gameId}`)}
      >
        ← 돌아가기
      </button>

      <div className="participant-card">
        <h1>🎮 게임 시작</h1>
        <p className="subtitle">오리엔테이션</p>

        {/* 스토리 섹션 */}
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          lineHeight: 1.8,
          fontSize: '0.95rem',
          fontWeight: 500
        }}>
          <p style={{ margin: 0 }}>
            목포 시화마을의 오래된 골목길을 걷던 당신, 발밑에 떨어진 낡은 수첩 하나를 발견합니다.<br/>
            수첩의 첫 장에는 시화마을 곳곳에 특별한 보물(추억)을 숨겨두었다는 낙서가 적혀 있습니다.<br/>
            <br/>
            <strong>골목 구석구석 숨겨진 7개의 퀴즈를 풀고,<br/>
            시화마을의 '진짜 매력'을 완성해 주세요!</strong>
          </p>
        </div>

        <div style={{ fontSize: '1rem', lineHeight: 1.8, color: '#555', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>게임 규칙</h3>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>총 7개의 문제가 있습니다.</li>
            <li style={{ marginBottom: '0.5rem' }}>각 문제는 시화마을의 특정 장소를 설명합니다.</li>
            <li style={{ marginBottom: '0.5rem' }}>힌트 버튼을 눌러 단계별 힌트를 받을 수 있습니다.</li>
            <li style={{ marginBottom: '0.5rem' }}>정답을 입력하고 제출하세요.</li>
            <li style={{ marginBottom: '0.5rem' }}>모든 문제를 푼 시간이 기록됩니다.</li>
          </ul>

          <h3 style={{ marginBottom: '1rem', color: '#333', marginTop: '1.5rem' }}>팁</h3>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>공백은 무시되므로 띄어쓰기에 신경 쓰지 않아도 됩니다.</li>
            <li style={{ marginBottom: '0.5rem' }}>대소문자 구분이 없습니다.</li>
            <li style={{ marginBottom: '0.5rem' }}>스마트폰을 이용하여 장소를 방문하며 진행하세요.</li>
          </ul>
        </div>

        <button
          className="btn-submit"
          onClick={() => navigate(`/game/${gameId}/${teamId}`)}
          style={{ fontSize: '1.1rem', padding: '1rem' }}
        >
          🚀 게임 시작하기
        </button>
      </div>
    </div>
  )
}
