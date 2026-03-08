# DATABASE DESIGN

## 1. Design Principles

- **Timestamp Format**: `integer` (Unix miliseconds) with Drizzle `mode: 'timestamp_ms'`
- **Boolean Format**: `integer` with Drizzle `mode: 'boolean'` (0/1 → true/false)
- **Enum Format**: `text` + Zod validation (no DB enum)
- **Soft Delete Strategy**: Use flags/status instead of actual deletion
- **Foreign Keys**: Integer type untuk entity ID bisnis; `text` (UUID) untuk referensi ke `user.id` (Better-Auth)
- **Audit Trail**: Append-only history log
- **Schema Drizzle**: 1 table/schema per 1 file

## 2. Timestamp Implementation

```typescript
// Standard timestamp field
createdAt: integer({ mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`),

updatedAt: integer({ mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)
  .$onUpdateFn(() => new Date())
```

## 3. Cascade Delete Strategy

**Vendor (Soft Delete)**
```
Strategy: isActive flag
- Vendor tidak benar-benar dihapus
- isActive = false untuk non-aktifkan
- Data historis tetap utuh
```

**User (Soft Delete)**
```
Strategy: isActive flag
- User tidak benar-benar dihapus
- isActive = false untuk non-aktifkan
- Data historis tetap utuh
- User non-aktif tidak bisa login
```

**Claim (Soft Delete via Status)**
```
Strategy: claimStatus = 'ARCHIVED'
- Claim tidak benar-benar dihapus
- "Hapus claim" = ubah status jadi ARCHIVED
- Claim ARCHIVED tidak muncul di list aktif
- Audit trail tetap lengkap
```