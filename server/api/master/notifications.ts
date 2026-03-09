import type { NotificationMaster } from '~/types/master'

const notifications: NotificationMaster[] = [
  {
    id: 1,
    notificationCode: 'NTF-2023-001',
    notificationDate: '2023-10-01',
    modelId: 1,
    modelName: 'LED TV 32inch HD',
    branch: 'BDO',
    vendorId: 1,
    vendorName: 'PT Elektronik Jaya',
    status: 'NEW'
  },
  {
    id: 2,
    notificationCode: 'NTF-2023-002',
    notificationDate: '2023-10-05',
    modelId: 3,
    modelName: 'OLED TV 55inch 4K',
    branch: 'JKT',
    vendorId: 2,
    vendorName: 'CV Semesta Mandiri',
    status: 'USED'
  },
  {
    id: 3,
    notificationCode: 'NTF-2023-003',
    notificationDate: '2023-09-15',
    modelId: 5,
    modelName: 'Smart TV 65inch 4K',
    branch: 'SBY',
    vendorId: 4,
    vendorName: 'Sharp Prima',
    status: 'EXPIRED'
  },
  {
    id: 4,
    notificationCode: 'NTF-2023-004',
    notificationDate: '2023-10-10',
    modelId: 2,
    modelName: 'LED TV 43inch FHD',
    branch: 'MDN',
    vendorId: 1,
    vendorName: 'PT Elektronik Jaya',
    status: 'NEW'
  }
]

export default eventHandler(async () => {
  return notifications
})
