import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '@/utils/firebase'
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { Game } from '@/types'
import './Admin.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGameTitle, setNewGameTitle] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    try {
      const gamesRef = collection(db, 'games')
      const q = query(gamesRef, where('status', '==', 'active'))
      const snapshot = await getDocs(q)
      const gamesData = snapshot.docs.map(doc => ({
        gameId: doc.id,
        ...doc.data(),
      })) as Game[]
      setGames(gamesData)
    } catch (err) {
      console.error('게임 로드 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGameTitle.trim()) return

    setCreating(true)

    try {
      const code = Math.random().toString().slice(2, 8)
      const docRef = await addDoc(collection(db, 'games'), {
        title: newGameTitle,
        status: 'active',
        code,
        createdAt: serverTimestamp(),
      })

      // 기본 7개 문제 생성
      for (let i = 1; i <= 7; i++) {
        await addDoc(collection(db, `games/${docRef.id}/questions`), {
          order: i,
          title: `문제 ${i}`,
          description: '',
          answer: '',
          hints: [],
          createdAt: serverTimestamp(),
        })
      }

      setNewGameTitle('')
      setShowCreateForm(false)
      await loadGames()
    } catch (err) {
      console.error('게임 생성 실패:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteGame = async (gameId: string, gameTitle: string) => {
    if (!window.confirm(`"${gameTitle}" 게임을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) {
      return
    }

    try {
      await deleteDoc(doc(db, 'games', gameId))
      await loadGames()
      alert('게임이 삭제되었습니다.')
    } catch (err) {
      console.error('게임 삭제 실패:', err)
      alert('게임 삭제에 실패했습니다.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🎮 관리자 대시보드</h1>
        <button className="btn-logout" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>게임 목록</h2>
          <button
            className="btn-create"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            + 새 게임 만들기
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateGame} className="create-form">
            <input
              type="text"
              placeholder="게임 제목 (예: 2024년 1월)"
              value={newGameTitle}
              onChange={(e) => setNewGameTitle(e.target.value)}
              disabled={creating}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                disabled={creating || !newGameTitle.trim()}
                className="btn-submit"
              >
                {creating ? '생성 중...' : '생성'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-cancel"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {games.length === 0 ? (
          <p className="empty-message">아직 생성된 게임이 없습니다.</p>
        ) : (
          <div className="games-grid">
            {games.map(game => (
              <div key={game.gameId} className="game-card">
                <h3>{game.title}</h3>
                <div className="game-info">
                  <div>
                    <strong>입장 코드:</strong> {game.code}
                  </div>
                </div>
                <div className="game-actions">
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/admin/games/${game.gameId}/settings`)}
                  >
                    ⚙️ 설정
                  </button>
                  <button
                    className="btn-results"
                    onClick={() => navigate(`/admin/games/${game.gameId}/results`)}
                  >
                    📊 현황
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: '#f5576c',
                      color: 'white',
                      border: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => handleDeleteGame(game.gameId, game.title)}
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
