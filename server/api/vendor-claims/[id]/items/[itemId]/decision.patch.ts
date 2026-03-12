import { vendorClaimService } from '~~/server/services/vendor-claim.service'
import { requireAuth } from '~~/server/utils/auth-helpers'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const vendorClaimId = parseInt(event.context.params?.id || '0')
  const itemId = parseInt(event.context.params?.itemId || '0')

  if (!vendorClaimId || isNaN(vendorClaimId)) {
    throw createError({ statusCode: 400, message: 'Invalid vendor claim ID' })
  }

  if (!itemId || isNaN(itemId)) {
    throw createError({ statusCode: 400, message: 'Invalid item ID' })
  }

  const body = await readBody(event)

  return vendorClaimService.updateItemDecision(
    vendorClaimId,
    itemId,
    body,
    session.user.id,
    session.user.role || 'CS'
  )
})
