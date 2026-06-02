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
} from 'firebase/firestore'
import { Participant } from '@/types'
import './Participant.css'

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

  const completedTime = participant.completedAt
    ? Math.floor(
        (new Date(participant.completedAt as any).getTime() -
          new Date(participant.createdAt).getTime()) /
          1000
      )
    : 0

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
                  {rank.completedAt
                    ? (() => {
                        const time = Math.floor(
                          (new Date(rank.completedAt as any).getTime() -
                            new Date(rank.createdAt).getTime()) /
                            1000
                        )
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
