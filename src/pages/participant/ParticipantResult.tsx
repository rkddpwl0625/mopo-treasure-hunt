import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '@/utils/firebase'
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { Participant } from '@/types'
import './Participant.css'

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

interface RankingInfo extends Participant {
  completedTime?: number
}

export default function ParticipantResult() {
  const navigate = useNavigate()
  const { gameId, teamId } = useParams<{ gameId: string; teamId: string }>()
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [rankings, setRankings] = useState<RankingInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // 현재 참가자 정보
        const participantRef = doc(db, `games/${gameId}/participants/${teamId}`)
        const participantSnap = await getDoc(participantRef)
        if (participantSnap.exists()) {
          setParticipant(participantSnap.data() as Participant)
        }

        // 모든 참가자 정보 로드 (순위 계산)
        const participantsRef = collection(db, `games/${gameId}/participants`)
        const q = query(
          participantsRef,
          where('status', '==', 'completed'),
          orderBy('completedAt', 'asc')
        )
        const snapshot = await getDocs(q)
        const rankingsData = snapshot.docs.map((doc, index) => ({
          teamId: doc.id,
          rank: index + 1,
          ...doc.data(),
        } as RankingInfo))
        setRankings(rankingsData)

        setLoading(false)
      } catch (err) {
        console.error('데이터 로드 실패:', err)
        setLoading(false)
      }
    }

    loadData()
  }, [gameId, teamId])

  if (loading || !participant) {
    return (
      <div className="participant-container">
        <div className="result-container">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  // Firebase Timestamp를 초 단위로 변환
  const createdSeconds = getTimestampSeconds(participant.createdAt)
  const completedSeconds = getTimestampSeconds(participant.completedAt)
  const completedTime = completedSeconds - createdSeconds

  const minutes = Math.floor(completedTime / 60)
  const seconds = completedTime % 60

  const myRank = rankings.findIndex(r => r.teamId === teamId) + 1

  return (
    <div className="participant-container">
      <div className="result-container">
        <div className="result-icon">🎉</div>
        <h1 className="result-title">축하합니다!</h1>
        <p className="result-time">
          소요 시간: {minutes}분 {seconds}초
        </p>

        <div className="result-rank">
          <div className="result-rank-number">{myRank}등</div>
          <div className="result-rank-text">
            {rankings.length}개 팀 중 {myRank}번째로 완료하셨습니다!
          </div>
        </div>

        <h3 style={{ marginBottom: '1rem', marginTop: '2rem' }}>전체 순위</h3>
        <table className="ranking-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>조 이름</th>
              <th>시간</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((rank, index) => (
              <tr key={rank.teamId} className={rank.teamId === teamId ? 'highlight' : ''}>
                <td>{index + 1}</td>
                <td>{rank.groupName}</td>
                <td>
                  {rank.completedAt && rank.createdAt
                    ? (() => {
                        const createdSec = getTimestampSeconds(rank.createdAt)
                        const completedSec = getTimestampSeconds(rank.completedAt)
                        const time = completedSec - createdSec
                        const m = Math.floor(time / 60)
                        const s = time % 60
                        return `${m}:${s.toString().padStart(2, '0')}`
                      })()
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="btn-home" onClick={() => navigate('/')}>
          🏠 메인으로 돌아가기
        </button>
      </div>
    </div>
  )
}
