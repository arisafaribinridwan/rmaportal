import type { ProductModel } from '~/types/master'

const productModels: ProductModel[] = [
  {
    id: 1,
    name: 'LED TV 32inch HD',
    inch: 32,
    vendorId: 1,
    vendorName: 'PT Elektronik Jaya',
    isActive: true
  },
  {
    id: 2,
    name: 'LED TV 43inch FHD',
    inch: 43,
    vendorId: 1,
    vendorName: 'PT Elektronik Jaya',
    isActive: true
  },
  {
    id: 3,
    name: 'OLED TV 55inch 4K',
    inch: 55,
    vendorId: 2,
    vendorName: 'CV Semesta Mandiri',
    isActive: true
  },
  {
    id: 4,
    name: 'LCD Monitor 24inch',
    inch: 24,
    vendorId: 4,
    vendorName: 'Sharp Prima',
    isActive: false
  },
  {
    id: 5,
    name: 'Smart TV 65inch 4K',
    inch: 65,
    vendorId: 4,
    vendorName: 'Sharp Prima',
    isActive: true
  }
]

export default eventHandler(async () => {
  return productModels
})
