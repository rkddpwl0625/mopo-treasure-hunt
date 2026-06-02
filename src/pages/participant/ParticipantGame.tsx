import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '@/utils/firebase'
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { Question, Participant } from '@/types'
import './Participant.css'

export default function ParticipantGame() {
  const navigate = useNavigate()
  const { gameId, teamId } = useParams<{ gameId: string; teamId: string }>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)
  const [visibleHints, setVisibleHints] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [startTime] = useState(Date.now())
  const [showLocationHint, setShowLocationHint] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // 문제 로드
        const questionsRef = collection(db, `games/${gameId}/questions`)
        const q = query(questionsRef, orderBy('order', 'asc'))
        const querySnapshot = await getDocs(q)
        const questionsData = querySnapshot.docs.map(doc => ({
          questionId: doc.id,
          ...doc.data(),
        })) as Question[]
        setQuestions(questionsData)

        // 참가자 정보 로드
        const participantRef = doc(db, `games/${gameId}/participants/${teamId}`)
        const participantSnap = await getDoc(participantRef)
        if (participantSnap.exists()) {
          const data = participantSnap.data() as Participant
          setParticipant(data)
          setCurrentQuestionIndex(data.currentQuestion - 1)
        }

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
        <div className="participant-card">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return

    const normalizedAnswer = answer.toLowerCase().replace(/\s+/g, '')
    const normalizedCorrect = currentQuestion.answer.toLowerCase().replace(/\s+/g, '')

    if (normalizedAnswer === normalizedCorrect) {
      setResult('correct')
      setShowLocationHint(true)
    } else {
      setResult('incorrect')
      setAnswer('')
    }
  }

  const handleNextQuestion = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    if (currentQuestionIndex + 1 < totalQuestions) {
      setAnswer('')
      setResult(null)
      setShowLocationHint(false)
      setVisibleHints([])
      setCurrentQuestionIndex(currentQuestionIndex + 1)

      // Firestore 업데이트
      const participantRef = doc(
        db,
        `games/${gameId}/participants/${teamId}`
      )
      await updateDoc(participantRef, {
        [`completedQuestions.q${currentQuestionIndex + 1}`]: {
          correct: true,
          attemptCount: 1,
          completedAt: serverTimestamp(),
          timeSpent,
        },
        currentQuestion: currentQuestionIndex + 2,
      })
    } else {
      // 게임 완료
      const participantRef = doc(
        db,
        `games/${gameId}/participants/${teamId}`
      )
      const totalTime = Math.floor((Date.now() - startTime) / 1000)
      await updateDoc(participantRef, {
        [`completedQuestions.q${currentQuestionIndex + 1}`]: {
          correct: true,
          attemptCount: 1,
          completedAt: serverTimestamp(),
          timeSpent,
        },
        status: 'completed',
        completedAt: serverTimestamp(),
      })

      navigate(`/result/${gameId}/${teamId}`)
    }
  }

  const toggleHint = (step: number) => {
    if (visibleHints.includes(step)) {
      setVisibleHints(visibleHints.filter(h => h !== step))
    } else {
      setVisibleHints([...visibleHints, step])
    }
  }

  // 이정표 페이지 표시
  if (showLocationHint) {
    return (
      <div className="participant-container">
        <div className="participant-card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>✓</span>
            <h1 style={{ color: '#333', marginBottom: '0.5rem' }}>정답입니다!</h1>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>다음 장소로 이동해주세요</p>
          </div>

          {currentQuestion.nextLocationHint && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              lineHeight: 1.8,
              fontSize: '1rem',
              whiteSpace: 'pre-wrap',
              textAlign: 'left'
            }}>
              <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '1rem' }}>📍 다음 장소로 가는 길</strong>
              {currentQuestion.nextLocationHint}
            </div>
          )}

          <button
            className="btn-submit"
            onClick={handleNextQuestion}
            style={{ fontSize: '1rem', padding: '0.75rem' }}
          >
            {currentQuestionIndex + 1 < totalQuestions ? '다음 문제로 →' : '결과 보기'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="participant-container">
      <div className="participant-card">
        <div className="game-header">
          <span>
            문제 {currentQuestionIndex + 1} / {totalQuestions}
          </span>
          <div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="game-content-new">
          {/* 힌트 아이콘 (왼쪽 위) */}
          <div className="hint-icons">
            {currentQuestion.hints && currentQuestion.hints.length > 0 ? (
              currentQuestion.hints.map(hint => (
                <button
                  key={hint.step}
                  className="hint-icon-btn"
                  onClick={() => toggleHint(hint.step)}
                  disabled={result === 'correct'}
                  title={`힌트 ${hint.step}`}
                >
                  💡
                </button>
              ))
            ) : null}
          </div>

          {/* 문제 설명 (가운데) */}
          <div className="question-panel-new">
            <h2 className="question-title">{currentQuestion.title}</h2>
            {currentQuestion.description && (
              <p className="question-description">{currentQuestion.description}</p>
            )}
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt="문제 이미지"
                className="question-image"
              />
            )}
          </div>

          {/* 힌트 내용 (토글로 표시) */}
          {currentQuestion.hints && currentQuestion.hints.length > 0 && visibleHints.length > 0 && (
            <div className="hints-display">
              {currentQuestion.hints.map(hint =>
                visibleHints.includes(hint.step) ? (
                  <div key={`content-${hint.step}`} className="hint-content-new">
                    <strong>💡 힌트 {hint.step}</strong>
                    <p>{hint.hint}</p>
                  </div>
                ) : null
              )}
            </div>
          )}

          {/* 정답 입력 (아래) */}
          <div className="answer-panel-new">
            <input
              type="text"
              className="answer-input"
              placeholder="정답을 입력하세요"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmitAnswer()}
              disabled={result === 'correct'}
              autoFocus
            />
            <button
              className="btn-answer"
              onClick={handleSubmitAnswer}
              disabled={!answer.trim() || result === 'correct'}
            >
              제출
            </button>

            {result && (
              <div className={`answer-result ${result}`}>
                {result === 'correct'
                  ? '✓ 정답입니다! 다음 문제로...'
                  : '✗ 다시 시도해보세요'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
