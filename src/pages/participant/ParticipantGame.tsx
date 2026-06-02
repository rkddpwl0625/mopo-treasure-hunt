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
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)

      // 다음 문제로
      setTimeout(async () => {
        if (currentQuestionIndex + 1 < totalQuestions) {
          setAnswer('')
          setResult(null)
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
      }, 1500)
    } else {
      setResult('incorrect')
      setAnswer('')
    }
  }

  const toggleHint = (step: number) => {
    if (visibleHints.includes(step)) {
      setVisibleHints(visibleHints.filter(h => h !== step))
    } else {
      setVisibleHints([...visibleHints, step])
    }
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

        <div className="game-content">
          <div className="hint-panel">
            <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>💡 힌트</h3>
            {currentQuestion.hints && currentQuestion.hints.length > 0 ? (
              <div>
                {currentQuestion.hints.map(hint => (
                  <button
                    key={hint.step}
                    className="hint-button"
                    onClick={() => toggleHint(hint.step)}
                    disabled={result === 'correct'}
                  >
                    힌트 {hint.step}
                  </button>
                ))}
                {currentQuestion.hints.map(hint =>
                  visibleHints.includes(hint.step) ? (
                    <div key={`content-${hint.step}`} className="hint-content">
                      {hint.hint}
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <p style={{ color: '#999', fontSize: '0.9rem' }}>힌트 없음</p>
            )}
          </div>

          <div className="question-panel">
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

          <div className="answer-panel">
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
