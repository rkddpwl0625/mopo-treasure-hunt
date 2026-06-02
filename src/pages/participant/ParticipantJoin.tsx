import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameByCode } from '@/hooks/useGame'
import './Participant.css'

export default function ParticipantJoin() {
  const navigate = useNavigate()
  const [inputCode, setInputCode] = useState('')
  const { game, loading, error } = useGameByCode(inputCode)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    if (game) {
      navigate(`/register/${game.gameId}`)
    }
  }

  return (
    <div className="participant-container">
      <button className="btn-back" onClick={() => navigate('/')}>
        ← 돌아가기
      </button>

      <div className="participant-card">
        <h1>입장 코드 입력</h1>
        <p className="subtitle">게임에 참가할 입장 코드를 입력하세요</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="입장 코드 (숫자 6자리)"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value)
                setSubmitted(false)
              }}
              maxLength={10}
              autoFocus
            />
          </div>

          {submitted && loading && (
            <div className="info-message">코드 확인 중...</div>
          )}

          {submitted && error && (
            <div className="error-message">{error}</div>
          )}

          {submitted && game && (
            <div className="success-message">
              ✓ {game.title} 게임을 찾았습니다!
            </div>
          )}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading || inputCode.length === 0}
          >
            {loading ? '확인 중...' : '다음'}
          </button>
        </form>
      </div>
    </div>
  )
}
