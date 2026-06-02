import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db, storage } from '@/utils/firebase'
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Question, Hint } from '@/types'
import './Admin.css'

export default function AdminGameSettings() {
  const navigate = useNavigate()
  const { gameId } = useParams<{ gameId: string }>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tempAnswer, setTempAnswer] = useState('')

  useEffect(() => {
    loadQuestions()
  }, [gameId])

  useEffect(() => {
    setTempAnswer('')
  }, [selectedQuestion?.questionId])

  const loadQuestions = async () => {
    try {
      const questionsRef = collection(db, `games/${gameId}/questions`)
      const q = query(questionsRef, orderBy('order', 'asc'))
      const snapshot = await getDocs(q)
      const questionsData = snapshot.docs.map(doc => ({
        questionId: doc.id,
        ...doc.data(),
      })) as Question[]
      setQuestions(questionsData)
      if (questionsData.length > 0) {
        setSelectedQuestion(questionsData[0])
      }
    } catch (err) {
      console.error('문제 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateQuestion = async (field: string, value: any) => {
    if (!selectedQuestion) return

    setSaving(true)
    try {
      const questionRef = doc(
        db,
        `games/${gameId}/questions/${selectedQuestion.questionId}`
      )
      await updateDoc(questionRef, { [field]: value })

      // 로컬 상태 업데이트
      const updatedQuestions = questions.map(q =>
        q.questionId === selectedQuestion.questionId
          ? { ...q, [field]: value }
          : q
      )
      setQuestions(updatedQuestions)
      setSelectedQuestion({
        ...selectedQuestion,
        [field]: value,
      })
    } catch (err) {
      console.error('업데이트 실패:', err)
      alert('업데이트 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleAddHint = async () => {
    if (!selectedQuestion) return

    const hints = selectedQuestion.hints || []
    const newHint: Hint = {
      step: hints.length + 1,
      hint: '',
    }

    await handleUpdateQuestion('hints', [...hints, newHint])
  }

  const handleUpdateHint = (index: number, hintText: string) => {
    if (!selectedQuestion) return

    const hints = [...(selectedQuestion.hints || [])]
    hints[index].hint = hintText

    handleUpdateQuestion('hints', hints)
  }

  const handleDeleteHint = (index: number) => {
    if (!selectedQuestion) return

    const hints = (selectedQuestion.hints || []).filter((_, i) => i !== index)
    // Re-number hints
    hints.forEach((h, i) => {
      h.step = i + 1
    })

    handleUpdateQuestion('hints', hints)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedQuestion || !e.target.files?.[0]) return

    const file = e.target.files[0]
    setSaving(true)

    try {
      const storageRef = ref(
        storage,
        `games/${gameId}/questions/${selectedQuestion.questionId}/${file.name}`
      )
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      await handleUpdateQuestion('imageUrl', downloadURL)
    } catch (err) {
      console.error('이미지 업로드 실패:', err)
      alert('이미지 업로드 실패')
    } finally {
      setSaving(false)
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
        <h2>📝 문제 설정</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3>문제 목록</h3>
            <div className="question-list">
              {questions.map(q => (
                <div
                  key={q.questionId}
                  className="question-item"
                  onClick={() => setSelectedQuestion(q)}
                  style={{
                    background:
                      selectedQuestion?.questionId === q.questionId
                        ? '#f0f0ff'
                        : 'white',
                  }}
                >
                  <h3>Q{q.order}: {q.title}</h3>
                  <p>정답: {q.answer || '(미설정)'}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            {selectedQuestion && (
              <div className="question-editor">
                <h3>Q{selectedQuestion.order} 수정</h3>

                <label>제목</label>
                <input
                  type="text"
                  value={selectedQuestion.title}
                  onChange={(e) => handleUpdateQuestion('title', e.target.value)}
                  disabled={saving}
                />

                <label>설명</label>
                <textarea
                  value={selectedQuestion.description}
                  onChange={(e) =>
                    handleUpdateQuestion('description', e.target.value)
                  }
                  disabled={saving}
                />

                <label>정답</label>
                <input
                  type="text"
                  value={tempAnswer || selectedQuestion.answer}
                  onChange={(e) => setTempAnswer(e.target.value)}
                  onBlur={() => {
                    if (tempAnswer) {
                      handleUpdateQuestion('answer', tempAnswer)
                      setTempAnswer('')
                    }
                  }}
                  disabled={saving}
                />

                <label>이미지 업로드</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={saving}
                />
                {selectedQuestion.imageUrl && (
                  <div>
                    <img
                      src={selectedQuestion.imageUrl}
                      alt="문제 이미지"
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        marginTop: '0.5rem',
                      }}
                    />
                  </div>
                )}

                <div className="hints-section">
                  <h4>💡 힌트</h4>
                  {(selectedQuestion.hints || []).map((hint, index) => (
                    <div key={index} className="hint-item">
                      <input
                        type="text"
                        placeholder={`힌트 ${hint.step}`}
                        value={hint.hint}
                        onChange={(e) =>
                          handleUpdateHint(index, e.target.value)
                        }
                        disabled={saving}
                      />
                      <button
                        onClick={() => handleDeleteHint(index)}
                        disabled={saving}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddHint}
                    disabled={saving}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginTop: '0.5rem',
                    }}
                  >
                    + 힌트 추가
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
