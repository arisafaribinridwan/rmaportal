// server/repositories/sequence-generator.repo.ts
import { eq, and } from 'drizzle-orm'
import db from '~~/server/database'
import type { db as DbClient, DbTransaction } from '~~/server/database'
import { sequenceGenerator } from '~~/server/database/schema'
import type { SequenceType } from '~~/shared/utils/constants'

export const sequenceGeneratorRepo = {
  /**
   * Get next sequence number for a given type and date.
   * Atomically increments the counter, creating the row if it doesn't exist.
   * Returns the new sequence number.
   *
   * Format: CLM-YYYYMMDD-XXXX (e.g. CLM-20260311-0001)
   */
  async getNextSequence(type: SequenceType, date: Date, executor: DbClient | DbTransaction = db): Promise<string> {
    const dateStr = formatDate(date) // YYYYMMDD

    // Try to find existing sequence for this type + date
    const existing = await executor
      .select()
      .from(sequenceGenerator)
      .where(and(eq(sequenceGenerator.type, type), eq(sequenceGenerator.currentDate, dateStr)))
      .get()

    let nextSeq: number

    if (existing) {
      nextSeq = existing.lastSequence + 1
      await executor
        .update(sequenceGenerator)
        .set({ lastSequence: nextSeq })
        .where(eq(sequenceGenerator.id, existing.id))
    } else {
      nextSeq = 1
      try {
        await executor
          .insert(sequenceGenerator)
          .values({ type, currentDate: dateStr, lastSequence: nextSeq })
      } catch {
        const latest = await executor
          .select()
          .from(sequenceGenerator)
          .where(and(eq(sequenceGenerator.type, type), eq(sequenceGenerator.currentDate, dateStr)))
          .get()

        if (!latest) {
          throw createError({ statusCode: 500, message: 'Failed to generate sequence number' })
        }

        nextSeq = latest.lastSequence + 1
        await executor
          .update(sequenceGenerator)
          .set({ lastSequence: nextSeq })
          .where(eq(sequenceGenerator.id, latest.id))
      }
    }

    // Build formatted sequence
    const prefix = type === 'CLAIM' ? 'CLM' : 'VC'
    return `${prefix}-${dateStr}-${String(nextSeq).padStart(4, '0')}`
  }
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}
