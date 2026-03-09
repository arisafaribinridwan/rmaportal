export interface Vendor {
  id: number
  code: string
  name: string
  requiredPhotos: string[]
  requiredFields: string[]
  isActive: boolean
}

export interface ProductModel {
  id: number
  name: string
  inch: number
  vendorId: number
  vendorName?: string // included for display
  isActive: boolean
}

export interface NotificationMaster {
  id: number
  notificationCode: string
  notificationDate: string // using ISO string for dummy dates
  modelId: number
  modelName?: string // included for display
  branch: string
  vendorId: number
  vendorName?: string // included for display
  status: 'NEW' | 'USED' | 'EXPIRED'
}

export interface DefectMaster {
  id: number
  code: string
  name: string
  isActive: boolean
}
