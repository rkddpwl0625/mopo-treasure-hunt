import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '@/utils/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Orientation } from '@/types'
import './Participant.css'

export default function ParticipantOrientation() {
  const navigate = useNavigate()
  const { gameId, teamId } = useParams<{ gameId: string; teamId: string }>()
  const [orientation, setOrientation] = useState<Orientation>({ story: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrientation = async () => {
      try {
        const gameRef = doc(db, `games/${gameId}`)
        const gameSnap = await getDoc(gameRef)
        if (gameSnap.exists()) {
          const gameData = gameSnap.data()
          if (gameData.orientation) {
            setOrientation(gameData.orientation)
          }
        }
      } catch (err) {
        console.error('오리엔테이션 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    if (gameId) {
      loadOrientation()
    }
  }, [gameId])

  if (loading) {
    return (
      <div className="participant-container">
        <div className="participant-card">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

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
          {orientation.imageUrl && (
            <img
              src={orientation.imageUrl}
              alt="오리엔테이션 이미지"
              style={{
                width: '100%',
                maxHeight: '300px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}
            />
          )}
          {orientation.title && (
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem' }}>{orientation.title}</h2>
          )}
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {orientation.story}
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
