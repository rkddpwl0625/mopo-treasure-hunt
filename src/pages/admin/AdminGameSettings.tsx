import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db, storage } from '@/utils/firebase'
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Question, Hint, Orientation, Game } from '@/types'
import './Admin.css'

export default function AdminGameSettings() {
  const navigate = useNavigate()
  const { gameId } = useParams<{ gameId: string }>()
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tempAnswer, setTempAnswer] = useState('')
  const [tempTitle, setTempTitle] = useState('')
  const [tempDescription, setTempDescription] = useState('')
  const [tempNextLocationHint, setTempNextLocationHint] = useState('')
  const [activeTab, setActiveTab] = useState<'questions' | 'orientation'>('questions')
  const [orientation, setOrientation] = useState<Orientation>({ story: '' })
  const [tempOrientationStory, setTempOrientationStory] = useState('')
  const [tempOrientationTitle, setTempOrientationTitle] = useState('')

  useEffect(() => {
    loadQuestions()
  }, [gameId])

  useEffect(() => {
    setTempAnswer('')
    setTempTitle('')
    setTempDescription('')
    setTempNextLocationHint('')
  }, [selectedQuestion?.questionId])

  const loadQuestions = async () => {
    try {
      // 게임 정보 로드
      const gameRef = doc(db, `games/${gameId}`)
      const gameSnap = await getDoc(gameRef)

      if (gameSnap.exists()) {
        const gameData = gameSnap.data() as Game
        if (gameData.orientation) {
          setOrientation(gameData.orientation)
          setTempOrientationStory(gameData.orientation.story || '')
          setTempOrientationTitle(gameData.orientation.title || '')
        }
      }

      // 문제 로드
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
      console.error('데이터 로드 실패:', err)
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

  const handleUpdateOrientation = async (field: string, value: any) => {
    setSaving(true)
    try {
      const gameRef = doc(db, `games/${gameId}`)
      const newOrientation = { ...orientation, [field]: value }
      await updateDoc(gameRef, { orientation: newOrientation })
      setOrientation(newOrientation)
    } catch (err) {
      console.error('오리엔테이션 업데이트 실패:', err)
      alert('오리엔테이션 업데이트 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleOrientationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return

    const file = e.target.files[0]
    setSaving(true)

    try {
      const storageRef = ref(storage, `games/${gameId}/orientation/${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      await handleUpdateOrientation('imageUrl', downloadURL)
    } catch (err) {
      console.error('오리엔테이션 이미지 업로드 실패:', err)
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
        <h2>📝 게임 설정</h2>

        {/* 탭 버튼 */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #ddd', paddingBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('questions')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'questions' ? '#667eea' : '#f0f0f0',
              color: activeTab === 'questions' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            📝 문제 설정
          </button>
          <button
            onClick={() => setActiveTab('orientation')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'orientation' ? '#667eea' : '#f0f0f0',
              color: activeTab === 'orientation' ? 'white' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            🎬 오리엔테이션
          </button>
        </div>

        {/* 문제 설정 탭 */}
        {activeTab === 'questions' && (
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
                  value={tempTitle || selectedQuestion.title}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={() => {
                    if (tempTitle) {
                      handleUpdateQuestion('title', tempTitle)
                      setTempTitle('')
                    }
                  }}
                  disabled={saving}
                />

                <label>설명</label>
                <textarea
                  value={tempDescription || selectedQuestion.description}
                  onChange={(e) => setTempDescription(e.target.value)}
                  onBlur={() => {
                    if (tempDescription) {
                      handleUpdateQuestion('description', tempDescription)
                      setTempDescription('')
                    }
                  }}
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

                <label>다음 장소 이정표 (선택사항)</label>
                <textarea
                  value={tempNextLocationHint || selectedQuestion.nextLocationHint || ''}
                  onChange={(e) => setTempNextLocationHint(e.target.value)}
                  onBlur={() => {
                    if (tempNextLocationHint || selectedQuestion.nextLocationHint) {
                      handleUpdateQuestion('nextLocationHint', tempNextLocationHint)
                      setTempNextLocationHint('')
                    }
                  }}
                  placeholder="예) 영화 촬영지에서 나와서 왼쪽으로 돌아서 골목 안쪽으로 50m 진행하세요"
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
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
        )}

        {/* 오리엔테이션 탭 */}
        {activeTab === 'orientation' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3>🎬 오리엔테이션 설정</h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>제목</label>
            <input
              type="text"
              value={tempOrientationTitle || orientation.title || ''}
              onChange={(e) => setTempOrientationTitle(e.target.value)}
              onBlur={() => {
                if (tempOrientationTitle) {
                  handleUpdateOrientation('title', tempOrientationTitle)
                  setTempOrientationTitle('')
                }
              }}
              placeholder="오리엔테이션 제목 (선택사항)"
              disabled={saving}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>스토리</label>
            <textarea
              value={tempOrientationStory || orientation.story}
              onChange={(e) => setTempOrientationStory(e.target.value)}
              onBlur={() => {
                if (tempOrientationStory) {
                  handleUpdateOrientation('story', tempOrientationStory)
                  setTempOrientationStory('')
                }
              }}
              placeholder="참가자들이 읽을 스토리를 입력해주세요..."
              disabled={saving}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                minHeight: '120px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>이미지</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleOrientationImageUpload}
              disabled={saving}
              style={{
                display: 'block',
                marginBottom: '0.5rem',
              }}
            />
            {orientation.imageUrl && (
              <div style={{ marginTop: '1rem' }}>
                <img
                  src={orientation.imageUrl}
                  alt="오리엔테이션 이미지"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                  }}
                />
              </div>
            )}
          </div>

          <div style={{
            background: '#f9f9f9',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '2rem',
            fontSize: '0.9rem',
            color: '#666'
          }}>
            <strong>미리보기:</strong>
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              marginTop: '0.5rem',
              lineHeight: 1.8
            }}>
              {orientation.title && <h3 style={{ margin: '0 0 1rem 0' }}>{orientation.title}</h3>}
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{orientation.story || '(스토리 입력 대기)'}</p>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
