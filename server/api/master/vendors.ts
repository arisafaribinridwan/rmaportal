import type { Vendor } from '~/types/master'

const vendors: Vendor[] = [
  {
    id: 1,
    code: 'V001',
    name: 'PT Elektronik Jaya',
    requiredPhotos: ['CLAIM', 'ODF'],
    requiredFields: ['odfNumber'],
    isActive: true
  },
  {
    id: 2,
    code: 'V002',
    name: 'CV Semesta Mandiri',
    requiredPhotos: ['UNIT'],
    requiredFields: ['version', 'serialNumber'],
    isActive: true
  },
  {
    id: 3,
    code: 'V003',
    name: 'Maju Bersama Corp',
    requiredPhotos: [],
    requiredFields: [],
    isActive: false
  },
  {
    id: 4,
    code: 'V004',
    name: 'Sharp Prima',
    requiredPhotos: ['CLAIM', 'UNIT', 'ODF'],
    requiredFields: ['odfNumber', 'version'],
    isActive: true
  }
]

export default eventHandler(async () => {
  return vendors
})
