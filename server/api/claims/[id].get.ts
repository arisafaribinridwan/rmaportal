export default defineEventHandler(async (event) => {
  const claimId = getRouterParam(event, 'id')

  if (!claimId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Claim ID is required'
    })
  }

  // Temporary Mock Data for Frontend CS Claim Detail (Task #18)
  const mockClaim = {
    id: claimId,
    notificationCode: 'NOT-0001',
    modelName: 'TV 32" MOKA',
    inch: 32,
    vendorId: 1,
    branch: 'JKT',
    panelSerialNo: 'PNL-0000001',
    ocSerialNo: 'OC-0000001',
    defectId: 1,
    status: 'SUBMITTED',
    createdAt: new Date().toISOString()
  }

  return mockClaim
})
