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
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
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
  const [tempNextLocationMission, setTempNextLocationMission] = useState('')
  const [tempNextLocationHint, setTempNextLocationHint] = useState('')
  const [activeTab, setActiveTab] = useState<'questions' | 'orientation'>('questions')
  const [orientation, setOrientation] = useState<Orientation>({ story: '' })
  const [tempOrientationStory, setTempOrientationStory] = useState('')
  const [tempOrientationTitle, setTempOrientationTitle] = useState('')
  const [tempImageUrl, setTempImageUrl] = useState('')
  const [tempOrientationImageUrl, setTempOrientationImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  useEffect(() => {
    loadQuestions()
  }, [gameId])

  useEffect(() => {
    setTempAnswer('')
    setTempTitle('')
    setTempDescription('')
    setTempNextLocationMission('')
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

      // 로컬 상태 업데이트 - 새로운 객체 생성
      const updatedQuestion: Question = {
        ...selectedQuestion,
        [field]: value,
      }

      const updatedQuestions = questions.map(q =>
        q.questionId === selectedQuestion.questionId
          ? updatedQuestion
          : q
      )
      setQuestions(updatedQuestions)
      setSelectedQuestion(updatedQuestion)
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

  const uploadToImgbb = async (file: File): Promise<string | null> => {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY
    if (!apiKey) {
      alert('❌ Imgbb API 키가 설정되지 않았습니다')
      return null
    }

    const formData = new FormData()
    formData.append('image', file)

    try {
      setUploadStatus('⏳ Imgbb에 업로드 중...')
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Imgbb 업로드 실패')
      }

      const data = await response.json()
      const imageUrl = data.data.image.url
      setUploadStatus('✅ 업로드 완료!')
      return imageUrl
    } catch (err) {
      console.error('Imgbb 업로드 오류:', err)
      setUploadStatus('❌ 업로드 실패')
      alert('이미지 업로드 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'))
      return null
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedQuestion || !e.target.files?.[0]) return

    const file = e.target.files[0]

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다')
      return
    }

    setUploading(true)
    try {
      const imageUrl = await uploadToImgbb(file)
      if (imageUrl) {
        await handleUpdateQuestion('imageUrl', imageUrl)
        alert('✅ 이미지 업로드 및 저장 완료!')
      }
    } catch (err) {
      console.error('이미지 처리 오류:', err)
      alert('이미지 처리 실패')
    } finally {
      setUploading(false)
      setUploadStatus('')
      // 파일 input 리셋
      e.target.value = ''
    }
  }

  const handleOrientationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return

    const file = e.target.files[0]

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다')
      return
    }

    setUploading(true)
    try {
      const imageUrl = await uploadToImgbb(file)
      if (imageUrl) {
        await handleUpdateOrientation('imageUrl', imageUrl)
        alert('✅ 이미지 업로드 및 저장 완료!')
      }
    } catch (err) {
      console.error('오리엔테이션 이미지 처리 오류:', err)
      alert('이미지 처리 실패')
    } finally {
      setUploading(false)
      setUploadStatus('')
      // 파일 input 리셋
      e.target.value = ''
    }
  }

  const handleSaveImageUrl = async () => {
    if (!selectedQuestion || !tempImageUrl.trim()) {
      alert('이미지 URL을 입력해주세요')
      return
    }

    setSaving(true)
    try {
      await handleUpdateQuestion('imageUrl', tempImageUrl)
      setTempImageUrl('')
      alert('✅ 이미지 URL 저장 완료!')
    } catch (err) {
      console.error('이미지 URL 저장 실패:', err)
      alert('이미지 URL 저장 실패')
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


  const handleSaveOrientationImageUrl = async () => {
    if (!tempOrientationImageUrl.trim()) {
      alert('이미지 URL을 입력해주세요')
      return
    }

    setSaving(true)
    try {
      await handleUpdateOrientation('imageUrl', tempOrientationImageUrl)
      setTempOrientationImageUrl('')
      alert('✅ 이미지 URL 저장 완료!')
    } catch (err) {
      console.error('오리엔테이션 이미지 URL 저장 실패:', err)
      alert('이미지 URL 저장 실패')
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
        <div className="questions-grid">
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

                <label>다음 장소 미션 (선택사항)</label>
                <textarea
                  value={tempNextLocationMission || selectedQuestion.nextLocationMission || ''}
                  onChange={(e) => setTempNextLocationMission(e.target.value)}
                  onBlur={() => {
                    if (tempNextLocationMission) {
                      handleUpdateQuestion('nextLocationMission', tempNextLocationMission)
                      setTempNextLocationMission('')
                    }
                  }}
                  placeholder="예) 다음 장소에서 빨간 간판을 찾아보세요!"
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    minHeight: '60px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
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
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading || saving}
                    style={{ marginBottom: '0.5rem' }}
                  />
                  {uploadStatus && (
                    <div style={{
                      background: '#e3f2fd',
                      color: '#1976d2',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}>
                      {uploadStatus}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="text"
                    value={tempImageUrl}
                    onChange={(e) => setTempImageUrl(e.target.value)}
                    placeholder="또는 이미지 URL 직접 입력"
                    disabled={saving || uploading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                    }}
                  />
                  <button
                    onClick={handleSaveImageUrl}
                    disabled={saving || uploading || !tempImageUrl.trim()}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    저장
                  </button>
                </div>
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
              disabled={uploading || saving}
              style={{ marginBottom: '0.5rem' }}
            />
            {uploadStatus && (
              <div style={{
                background: '#e3f2fd',
                color: '#1976d2',
                padding: '0.75rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.5rem'
              }}>
                {uploadStatus}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={tempOrientationImageUrl}
                onChange={(e) => setTempOrientationImageUrl(e.target.value)}
                placeholder="또는 이미지 URL 직접 입력"
                disabled={saving || uploading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                }}
              />
              <button
                onClick={handleSaveOrientationImageUrl}
                disabled={saving || uploading || !tempOrientationImageUrl.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                저장
              </button>
            </div>
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
