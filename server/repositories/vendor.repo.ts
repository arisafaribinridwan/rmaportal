// server/repositories/vendor.repo.ts
import { eq, desc, sql, type SQL } from 'drizzle-orm'
import db from '~~/server/database'
import { vendor } from '~~/server/database/schema'
import type {
  InsertVendor,
  UpdateVendor,
  UpdateVendorStatus,
  Vendor // Pastikan Anda meng-export type Select dari schema
} from '~~/server/database/schema'

/**
 * PREPARED STATEMENTS
 * Di industri 2026, kita menyiapkan query ini sekali saat aplikasi startup
 * untuk efisiensi eksekusi pada SQLite.
 */
const getVendorByIdPrepared = db.query.vendor.findFirst({
  where: (vendor, { eq }) => eq(vendor.id, sql.placeholder('id'))
}).prepare()

const getVendorByCodePrepared = db.query.vendor.findFirst({
  where: (vendor, { eq }) => eq(vendor.code, sql.placeholder('code'))
}).prepare()

export const vendorRepo = {
  /**
   * Menggunakan Relational Query untuk kemudahan mapping di Nuxt.
   */
  async findAll(filters?: { isActive?: boolean, search?: string }) {
    return db.query.vendor.findMany({
      where: (vendor, { and, eq, like }) => {
        const conditions: SQL[] = []
        if (filters?.isActive !== undefined) conditions.push(eq(vendor.isActive, filters.isActive))
        if (filters?.search) conditions.push(like(vendor.name, `%${filters.search}%`))
        return conditions.length ? and(...conditions) : undefined
      },
      orderBy: [desc(vendor.createdAt)]
    })
  },

  /**
   * Eksekusi Prepared Statement - Jauh lebih cepat untuk SQLite.
   */
  async findById(id: number): Promise<Vendor | undefined> {
    return getVendorByIdPrepared.execute({ id })
  },

  async findByCode(code: string): Promise<Vendor | undefined> {
    return getVendorByCodePrepared.execute({ code })
  },

  /**
   * CREATE dengan returning data yang konsisten.
   */
  async create(data: InsertVendor): Promise<Vendor> {
    const [result] = await db.insert(vendor).values(data).returning()
    if (!result) throw new Error('Failed to create vendor')
    return result
  },

  /**
   * UPDATE: Menggunakan pattern array destructuring [result]
   * untuk memastikan Type-Safety pada return value.
   */
  async update(id: number, data: UpdateVendor): Promise<Vendor | undefined> {
    const [result] = await db
      .update(vendor)
      .set({ ...data, updatedAt: new Date() }) // Pastikan timestamp terupdate
      .where(eq(vendor.id, id))
      .returning()

    return result
  },

  /**
   * Status Update (Soft Delete Pattern)
   */
  async updateStatus(id: number, data: UpdateVendorStatus): Promise<Vendor | undefined> {
    const [result] = await db
      .update(vendor)
      .set(data)
      .where(eq(vendor.id, id))
      .returning()

    return result
  }
}
