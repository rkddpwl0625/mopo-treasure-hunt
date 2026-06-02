import { useEffect, useState } from 'react'
import { db } from '@/utils/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot
} from 'firebase/firestore'
import { Game, Question, Participant } from '@/types'

export function useGameByCode(code: string) {
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) return

    const fetchGame = async () => {
      try {
        const gamesRef = collection(db, 'games')
        const q = query(gamesRef, where('code', '==', code))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          setError('입장 코드를 찾을 수 없습니다.')
          setGame(null)
        } else {
          const gameDoc = snapshot.docs[0]
          setGame({
            gameId: gameDoc.id,
            ...gameDoc.data()
          } as Game)
          setError(null)
        }
      } catch (err) {
        setError('오류가 발생했습니다.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchGame()
  }, [code])

  return { game, loading, error }
}

export function useGameQuestions(gameId: string) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameId) return

    const unsubscribe = onSnapshot(
      collection(db, `games/${gameId}/questions`),
      (snapshot) => {
        const questions = snapshot.docs
          .map(doc => ({
            questionId: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => (a as any).order - (b as any).order) as Question[]
        setQuestions(questions)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [gameId])

  return { questions, loading }
}

export function useGameParticipants(gameId: string) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameId) return

    const unsubscribe = onSnapshot(
      collection(db, `games/${gameId}/participants`),
      (snapshot) => {
        const participants = snapshot.docs
          .map(doc => ({
            teamId: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => {
            // 완료된 팀을 먼저 정렬
            if ((a as any).status === 'completed' && (b as any).status === 'in_progress') return -1
            if ((a as any).status === 'in_progress' && (b as any).status === 'completed') return 1
            // 완료 시간으로 정렬
            if ((a as any).completedAt && (b as any).completedAt) {
              return new Date((a as any).completedAt).getTime() - new Date((b as any).completedAt).getTime()
            }
            return 0
          }) as Participant[]
        setParticipants(participants)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [gameId])

  return { participants, loading }
}

export function useGameById(gameId: string) {
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameId) return

    const unsubscribe = onSnapshot(
      doc(db, 'games', gameId),
      (snapshot) => {
        if (snapshot.exists()) {
          setGame({
            gameId: snapshot.id,
            ...snapshot.data()
          } as Game)
        }
        setLoading(false)
      }
    )

    return unsubscribe
  }, [gameId])

  return { game, loading }
}

export function useAdminCode() {
  const [adminCode, setAdminCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdminCode = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'admin'))
        if (docSnap.exists()) {
          setAdminCode(docSnap.data().adminCode)
        }
      } catch (err) {
        console.error('관리자 코드 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminCode()
  }, [])

  return { adminCode, loading }
}
