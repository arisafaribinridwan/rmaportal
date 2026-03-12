// server/services/vendor-claim.service.ts
import { z } from 'zod'
import db from '~~/server/database'
import { vendorClaimRepo } from '~~/server/repositories/vendor-claim.repo'
import type { VendorClaimListFilters } from '~~/server/repositories/vendor-claim.repo'
import { sequenceGeneratorRepo } from '~~/server/repositories/sequence-generator.repo'
import { vendorRepo } from '~~/server/repositories/vendor.repo'

type ApprovedClaim = {
  id: number
  claimNumber: string
  panelSerialNo: string
  ocSerialNo: string
  defectCode: string
  branch: string
  inch: number
  odfNumber: string | null
  version: string | null
  week: string | null
}

// ── Validation Schemas ──────────────────────────────────────

/**
 * Schema for generating a vendor claim.
 * Requires vendorId and an array of approved claimIds to batch.
 */
const generateVendorClaimSchema = z.object({
  vendorId: z.number().int().positive('Invalid vendor ID'),
  claimIds: z
    .array(z.number().int().positive('Invalid claim ID'))
    .min(1, 'At least one claim must be selected')
})

// ── Service ─────────────────────────────────────────────────

export const vendorClaimService = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // List & Detail
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * List vendor claims with optional filters and pagination.
   */
  async list(filters?: VendorClaimListFilters) {
    return vendorClaimRepo.findAll(filters)
  },

  /**
   * Get a single vendor claim by ID, including its items.
   * Throws 404 if not found.
   */
  async getById(id: number) {
    const record = await vendorClaimRepo.findById(id)
    if (!record) {
      throw createError({ statusCode: 404, message: 'Vendor claim not found' })
    }

    // Load items with claim detail
    const items = await vendorClaimRepo.findItemsByVendorClaimId(id)

    return {
      ...record,
      items
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // #26 — Vendor Claim Generate
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Get approved claims for a vendor that haven't been batched yet.
   * Used by the wizard (Step 1/2) to display available claims.
   */
  async getApprovedClaims(vendorId: number) {
    // Validate vendor exists and is active
    const vendorRecord = await vendorRepo.findById(vendorId)
    if (!vendorRecord) {
      throw createError({ statusCode: 404, message: 'Vendor not found' })
    }
    if (!vendorRecord.isActive) {
      throw createError({ statusCode: 400, message: 'Vendor is inactive' })
    }

    return vendorClaimRepo.findApprovedClaimsForVendor(vendorId)
  },

  /**
   * Generate a new Vendor Claim batch.
   *
   * Flow (ref: doc/7-flow.md § "3. Alur Vendor Claim"):
   * 1. Validate vendor exists & is active
   * 2. Validate all claimIds are APPROVED, belong to vendor, and not yet batched
   * 3. Generate vendorClaimNo via sequence (VC-YYYYMMDD-XXXX)
   * 4. Build report snapshot (JSON of claim data for Excel export)
   * 5. Create vendorClaim record with status = CREATED
   * 6. Create vendorClaimItem per claim with vendorDecision = PENDING
   * 7. Record GENERATE_VENDOR_CLAIM in claimHistory for each claim
   *
   * @param body - { vendorId: number, claimIds: number[] }
   * @param userId - Current user UUID from Better-Auth
   * @param userRole - Current user role snapshot
   * @returns Created vendor claim with items
   */
  async generate(body: unknown, userId: string, userRole: string) {
    const data = generateVendorClaimSchema.parse(body)
    const uniqueClaimIds = [...new Set(data.claimIds)]

    // ── 1. Validate vendor ──────────────────────────────────
    const vendorRecord = await vendorRepo.findById(data.vendorId)
    if (!vendorRecord) {
      throw createError({ statusCode: 404, message: 'Vendor not found' })
    }
    if (!vendorRecord.isActive) {
      throw createError({ statusCode: 400, message: 'Vendor is inactive' })
    }

    try {
      return await db.transaction(async (tx) => {
        // ── 2. Validate all claims are eligible ───────────────
        const approvedClaims = await vendorClaimRepo.findApprovedClaimsForVendor(data.vendorId, tx) as ApprovedClaim[]
        const approvedClaimMap = new Map(approvedClaims.map((c: ApprovedClaim) => [c.id, c] as const))

        const invalidIds: number[] = []
        for (const claimId of uniqueClaimIds) {
          if (!approvedClaimMap.has(claimId)) {
            invalidIds.push(claimId)
          }
        }

        if (invalidIds.length > 0) {
          throw createError({
            statusCode: 400,
            message: `Claims not eligible (not APPROVED, wrong vendor, or already batched): ${invalidIds.join(', ')}`
          })
        }

        const uniqueSelectedClaims: ApprovedClaim[] = uniqueClaimIds
          .map(id => approvedClaimMap.get(id))
          .filter((c): c is ApprovedClaim => c !== undefined)

        // ── 3. Generate vendor claim number ───────────────────
        const vendorClaimNo = await sequenceGeneratorRepo.getNextSequence('VENDOR_CLAIM', new Date(), tx)

        // ── 4. Build report snapshot ──────────────────────────
        const now = new Date()
        const reportSnapshot = JSON.stringify({
          vendorCode: vendorRecord.code,
          vendorName: vendorRecord.name,
          generatedAt: now.toISOString(),
          generatedBy: userId,
          totalClaims: uniqueSelectedClaims.length,
          claims: uniqueSelectedClaims.map(c => ({
            claimId: c.id,
            claimNumber: c.claimNumber,
            panelSerialNo: c.panelSerialNo,
            ocSerialNo: c.ocSerialNo,
            defectCode: c.defectCode,
            branch: c.branch,
            inch: c.inch,
            odfNumber: c.odfNumber,
            version: c.version,
            week: c.week
          }))
        })

        // ── 5. Create vendor claim record ─────────────────────
        const created = await vendorClaimRepo.create({
          vendorClaimNo,
          vendorId: data.vendorId,
          submittedAt: now,
          reportSnapshot,
          status: 'CREATED',
          createdBy: userId,
          updatedBy: userId
        }, tx)

        // ── 6. Create vendor claim items ──────────────────────
        const itemsData = uniqueSelectedClaims.map(c => ({
          vendorClaimId: created.id,
          claimId: c.id,
          vendorDecision: 'PENDING' as const
        }))

        const items = await vendorClaimRepo.createItems(itemsData, tx) as Array<{ id: number, claimId: number, vendorDecision: 'PENDING' | 'ACCEPTED' | 'REJECTED' }>

        // ── 7. Record claim history for each claim ────────────
        for (const c of uniqueSelectedClaims) {
          await vendorClaimRepo.createClaimHistory({
            claimId: c.id,
            action: 'GENERATE_VENDOR_CLAIM',
            fromStatus: 'APPROVED',
            toStatus: 'APPROVED',
            userId,
            userRole,
            note: `Included in vendor claim ${vendorClaimNo}`
          }, tx)
        }

        return {
          id: created.id,
          vendorClaimNo,
          vendorId: data.vendorId,
          vendorCode: vendorRecord.code,
          vendorName: vendorRecord.name,
          status: 'CREATED',
          submittedAt: now,
          itemCount: items.length,
          items: items.map(item => ({
            id: item.id,
            claimId: item.claimId,
            vendorDecision: item.vendorDecision
          }))
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('vendor_claim_item_claim_unique_idx') || message.includes('UNIQUE constraint failed: vendor_claim_item.claimId')) {
        throw createError({
          statusCode: 409,
          message: 'Some claims were already batched by another process. Refresh and try again.'
        })
      }

      throw error
    }
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // #28 — Vendor Decision Input
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Update decision for a vendor claim item.
   */
  async updateItemDecision(vendorClaimId: number, itemId: number, body: unknown, userId: string, userRole: string) {
    const updateItemDecisionSchema = z.object({
      vendorDecision: z.enum(['ACCEPTED', 'REJECTED']),
      compensation: z.number().int().nonnegative().optional().nullable(),
      rejectReason: z.string().optional().nullable()
    }).superRefine((data, ctx) => {
      if (data.vendorDecision === 'ACCEPTED' && (data.compensation === undefined || data.compensation === null)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Compensation is required when accepted', path: ['compensation'] })
      }
      if (data.vendorDecision === 'REJECTED' && !data.rejectReason) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Reject reason is required when rejected', path: ['rejectReason'] })
      }
    })

    const data = updateItemDecisionSchema.parse(body)

    return await db.transaction(async (tx) => {
      // 1. Validate the Vendor Claim exists
      const vc = await vendorClaimRepo.findById(vendorClaimId)
      if (!vc) {
        throw createError({ statusCode: 404, message: 'Vendor claim not found' })
      }

      // 2. Validate the item exists and belongs to the Vendor Claim
      const items = await vendorClaimRepo.findItemsByVendorClaimId(vendorClaimId)
      const item = items.find(i => i.id === itemId)
      if (!item) {
        throw createError({ statusCode: 404, message: 'Vendor claim item not found' })
      }

      const now = new Date()

      // 3. Update the item decision
      await vendorClaimRepo.updateItemDecision(itemId, {
        vendorDecision: data.vendorDecision,
        compensation: data.compensation || undefined,
        rejectReason: data.rejectReason || undefined,
        vendorDecisionBy: parseInt(userId) || 1, // Store user ID based on column spec
        vendorDecisionAt: now
      }, tx)

      // 4. Record claim history
      await vendorClaimRepo.createClaimHistory({
        claimId: item.claimId,
        action: 'UPDATE_VENDOR_DECISION',
        fromStatus: 'APPROVED',
        toStatus: 'APPROVED',
        userId,
        userRole,
        note: `Vendor decision marked as ${data.vendorDecision} for item ${itemId}`
      }, tx)

      // 5. Check if all items are decided to update vendor claim status
      // We refetch items in the transaction
      const updatedItems = await tx.query.vendorClaimItem.findMany({
        where: (fields, { eq }) => eq(fields.vendorClaimId, vendorClaimId)
      })

      const allDecided = updatedItems.every(i => i.vendorDecision !== 'PENDING')
      const someDecided = updatedItems.some(i => i.vendorDecision !== 'PENDING')

      let newStatus: 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'DRAFT' = vc.status

      if (allDecided) {
        newStatus = 'COMPLETED'
      } else if (someDecided && vc.status === 'CREATED') {
        newStatus = 'PROCESSING'
      }

      if (newStatus !== vc.status) {
        await vendorClaimRepo.updateStatus(vendorClaimId, newStatus, userId, tx)
      }

      return { success: true, newStatus }
    })
  }
}
