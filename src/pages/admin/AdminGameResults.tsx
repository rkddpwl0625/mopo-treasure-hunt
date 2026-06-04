import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '@/utils/firebase'
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
  writeBatch,
  getDocs,
  Timestamp,
} from 'firebase/firestore'
import { Participant } from '@/types'
import './Admin.css'

// Firebase Timestamp를 숫자(초)로 변환하는 함수
const getTimestampSeconds = (timestamp: any): number => {
  if (!timestamp) return 0
  if (timestamp instanceof Timestamp) {
    return timestamp.seconds
  }
  if (typeof timestamp === 'object' && timestamp.seconds !== undefined) {
    return timestamp.seconds
  }
  if (typeof timestamp === 'number') {
    return timestamp
  }
  return 0
}

export default function AdminGameResults() {
  const navigate = useNavigate()
  const { gameId } = useParams<{ gameId: string }>()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (!gameId) return

    const unsubscribe = onSnapshot(
      query(
        collection(db, `games/${gameId}/participants`),
        orderBy('createdAt', 'desc')
      ),
      snapshot => {
        const data = snapshot.docs
          .map(doc => ({
            teamId: doc.id,
            ...doc.data(),
          } as Participant))
          .sort((a, b) => {
            // 완료된 것 먼저
            if (a.status === 'completed' && b.status === 'in_progress') return -1
            if (a.status === 'in_progress' && b.status === 'completed') return 1
            // 완료 시간순
            if (a.status === 'completed' && b.status === 'completed') {
              const aTime = new Date(a.completedAt as any).getTime()
              const bTime = new Date(b.completedAt as any).getTime()
              return aTime - bTime
            }
            return 0
          })
        setParticipants(data)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [gameId])

  const handleResetGame = async () => {
    if (!window.confirm('정말 모든 참가자 데이터를 초기화하시겠습니까?')) {
      return
    }

    setResetting(true)

    try {
      const participantsRef = collection(db, `games/${gameId}/participants`)
      const snapshot = await getDocs(participantsRef)

      const batch = writeBatch(db)
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      await batch.commit()

      setParticipants([])
    } catch (err) {
      console.error('초기화 실패:', err)
      alert('초기화 실패')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-card">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-container">
      <button className="btn-back" onClick={() => navigate('/admin')} style={{ marginBottom: '1rem' }}>
        ← 돌아가기
      </button>

      <div className="settings-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>📊 참가 현황</h2>
          <button
            onClick={handleResetGame}
            disabled={resetting}
            style={{
              background: '#f5576c',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {resetting ? '초기화 중...' : '게임 초기화'}
          </button>
        </div>

        {participants.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
            아직 참가한 팀이 없습니다.
          </p>
        ) : (
          <table className="results-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>조 이름</th>
                <th>멤버</th>
                <th>기수</th>
                <th>진행 상황</th>
                <th>상태</th>
                <th>소요 시간</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, index) => {
                const completedCount = Object.keys(p.completedQuestions).length
                const createdSeconds = getTimestampSeconds(p.createdAt)
                const completedSeconds = getTimestampSeconds(p.completedAt)
                const timeSpent = completedSeconds - createdSeconds

                return (
                  <tr key={p.teamId}>
                    <td>
                      {p.status === 'completed'
                        ? index + 1
                        : '-'}
                    </td>
                    <td>{p.groupName}</td>
                    <td>{p.memberNames.join(', ')}</td>
                    <td>{p.generation}</td>
                    <td>{completedCount}/7</td>
                    <td>
                      <span
                        className={`status-badge ${
                          p.status === 'completed'
                            ? 'completed'
                            : 'in-progress'
                        }`}
                      >
                        {p.status === 'completed' ? '완료' : '진행 중'}
                      </span>
                    </td>
                    <td>
                      {p.status === 'completed'
                        ? `${Math.floor(timeSpent / 60)}:${(timeSpent % 60)
                            .toString()
                            .padStart(2, '0')}`
                        : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
