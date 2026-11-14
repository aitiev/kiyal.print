import { db } from '../schema'
import type { Goal, GoalType, Minor } from '../types'

const PERIOD: Record<GoalType, Goal['period']> = { break_even: 'all_time', monthly_income: 'monthly' }

export const goalsRepo = {
  list: (): Promise<Goal[]> => db.goals.toArray(),
  get: (type: GoalType) => db.goals.get(type),
  async set(type: GoalType, targetAmount?: Minor, now = Date.now()): Promise<Goal> {
    const row: Goal = { id: type, type, period: PERIOD[type], updatedAt: now }
    if (targetAmount !== undefined) row.targetAmount = targetAmount
    await db.goals.put(row)
    return row
  },
  remove: (type: GoalType) => db.goals.delete(type),
}
