import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '@/utils/firebase'
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore'
import { Participant } from '@/types'
import './Participant.css'

export default function ParticipantRegister() {
  const navigate = useNavigate()
  const { gameId } = useParams<{ gameId: string }>()
  const [generation, setGeneration] = useState('')
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddMember = () => {
    if (members.length < 5) {
      setMembers([...members, ''])
    }
  }

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...members]
    newMembers[index] = value
    setMembers(newMembers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!generation.trim()) {
      setError('기수를 입력해주세요')
      return
    }

    if (!groupName.trim()) {
      setError('조 이름을 입력해주세요')
      return
    }

    const memberList = members.filter(m => m.trim())
    if (memberList.length === 0) {
      setError('최소 1명 이상의 멤버 이름을 입력해주세요')
      return
    }

    setLoading(true)

    try {
      const participantRef = collection(db, `games/${gameId}/participants`)

      // 같은 조 이름과 멤버로 기존 참가자 확인
      const snapshot = await getDocs(participantRef)
      const sortedMemberList = [...memberList].sort()

      const existingParticipant = snapshot.docs.find(doc => {
        const data = doc.data() as Participant
        const existingMembers = [...(data.memberNames || [])].sort()
        return (
          data.groupName === groupName &&
          JSON.stringify(existingMembers) === JSON.stringify(sortedMemberList)
        )
      })

      let teamId: string
      if (existingParticipant) {
        // 기존 데이터 사용
        teamId = existingParticipant.id
        setError('') // 이전 게임 데이터를 불러왔습니다
      } else {
        // 새로 생성
        const docRef = await addDoc(participantRef, {
          groupName,
          memberNames: memberList,
          generation,
          status: 'in_progress',
          currentQuestion: 1,
          completedQuestions: {},
          createdAt: serverTimestamp(),
        })
        teamId = docRef.id
      }

      navigate(`/orientation/${gameId}/${teamId}`)
    } catch (err) {
      setError('등록 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="participant-container">
      <button className="btn-back" onClick={() => navigate('/join')}>
        ← 돌아가기
      </button>

      <div className="participant-card">
        <h1>정보 입력</h1>
        <p className="subtitle">조별 정보를 입력해주세요</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              기수 <span style={{ color: '#c33' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="예: 1기, 1월 기"
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              조 이름 <span style={{ color: '#c33' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="예: 1조, A팀"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              멤버 이름 (최대 5명) <span style={{ color: '#c33' }}>*</span>
            </label>
            {members.map((member, index) => (
              <input
                key={index}
                type="text"
                placeholder={`멤버 ${index + 1}`}
                value={member}
                onChange={(e) => handleMemberChange(index, e.target.value)}
                disabled={loading}
                style={{ marginBottom: '0.5rem' }}
              />
            ))}
            {members.length < 5 && (
              <button
                type="button"
                onClick={handleAddMember}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#e0e0e0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + 멤버 추가
              </button>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? '등록 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
