import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminCode } from '@/hooks/useGame'
import './AdminLogin.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { adminCode, loading } = useAdminCode()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (!adminCode) {
      setError('관리자 설정을 불러올 수 없습니다.')
      setIsSubmitting(false)
      return
    }

    if (code === adminCode) {
      localStorage.setItem('adminToken', 'true')
      navigate('/admin')
    } else {
      setError('잘못된 관리자 코드입니다.')
      setCode('')
    }

    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <p>로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <h1>관리자 로그인</h1>
        <p className="subtitle">관리자 코드를 입력하세요</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              placeholder="관리자 코드"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn-login"
            disabled={isSubmitting || !code}
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <button
          className="btn-back"
          onClick={() => navigate('/')}
          disabled={isSubmitting}
        >
          ← 돌아가기
        </button>
      </div>
    </div>
  )
}
