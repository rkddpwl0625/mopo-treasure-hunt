export interface Hint {
  step: number
  hint: string
}

export interface Question {
  questionId: string
  order: number
  title: string
  description: string
  imageUrl?: string
  answer: string
  hints: Hint[]
  createdAt: Date
}

export interface Orientation {
  title?: string
  story: string
  imageUrl?: string
}

export interface Game {
  gameId: string
  title: string
  status: 'active' | 'archived'
  code: string
  createdAt: Date
  orientation?: Orientation
  questions?: Question[]
}

export interface CompletedQuestion {
  correct: boolean
  attemptCount: number
  completedAt: Date
  timeSpent: number
}

export interface Participant {
  teamId: string
  groupName: string
  memberNames: string[]
  generation: string
  status: 'in_progress' | 'completed'
  currentQuestion: number
  completedQuestions: Record<string, CompletedQuestion>
  completedAt?: Date
  rank?: number
  createdAt: Date
}

export interface AdminSettings {
  adminCode: string
}
