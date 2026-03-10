// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default defineEventHandler(async (event) => {
  // Temporary Mock Data for Frontend CS Claim List (Task #18)
  const mockClaims = [
    {
      id: 'CLM-001',
      notificationCode: 'NOT-0001',
      modelName: 'TV 32" MOKA',
      status: 'DRAFT',
      createdAt: new Date().toISOString()
    },
    {
      id: 'CLM-002',
      notificationCode: 'NOT-0002',
      modelName: 'Monitor 24" SDP',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString()
    },
    {
      id: 'CLM-003',
      notificationCode: 'NOT-0003',
      modelName: 'TV 50" MTC',
      status: 'NEED_REVISION',
      createdAt: new Date().toISOString()
    }
  ]

  return mockClaims
})
