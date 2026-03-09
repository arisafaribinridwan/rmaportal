import type { DefectMaster } from '~/types/master'

const defects: DefectMaster[] = [
  {
    id: 1,
    code: 'D01',
    name: 'Mati Total',
    isActive: true
  },
  {
    id: 2,
    code: 'D02',
    name: 'Layar Pecah/Retak',
    isActive: true
  },
  {
    id: 3,
    code: 'D03',
    name: 'Suara Tidak Keluar',
    isActive: true
  },
  {
    id: 4,
    code: 'D04',
    name: 'Panel Bergaris',
    isActive: true
  },
  {
    id: 5,
    code: 'D05',
    name: 'Port HDMI Rusak',
    isActive: false
  }
]

export default eventHandler(async () => {
  return defects
})
