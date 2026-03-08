# CONSTANTS & TYPES

> All enums use `as const` pattern for type safety. Import di schema files dan validation.

## 1. User Roles
```typescript
export const USER_ROLES = [
  'ADMIN', 'MANAGEMENT', 'QRCC', 'CS'
] as const
export type UserRole = (typeof USER_ROLES)[number]
```

## 2. Claim Statuses
```typescript
export const CLAIM_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'NEED_REVISION',
  'APPROVED',
  'ARCHIVED'
] as const
export type ClaimStatus = (typeof CLAIM_STATUSES)[number]
```

## 3. Photo Types
```typescript
export const PHOTO_TYPES = [
  'CLAIM',
  'CLAIM_ZOOM',
  'ODF',
  'PANEL_SN',
  'WO_PANEL',
  'WO_PANEL_SN'
] as const
export type PhotoType = (typeof PHOTO_TYPES)[number]
```

## 4. Claim Photo Statuses
```typescript
export const CLAIM_PHOTO_STATUSES = [
  'PENDING', 'VERIFIED', 'REJECT'
] as const
export type ClaimPhotoStatus = (typeof CLAIM_PHOTO_STATUSES)[number]
```

## 5. Claim Actions
```typescript
export const CLAIM_ACTIONS = [
  'CREATE',
  'SUBMIT',
  'REVIEW',
  'REQUEST_REVISION',
  'APPROVE',
  'CANCEL'
] as const
export type ClaimAction = (typeof CLAIM_ACTIONS)[number]
```

## 6. Claim History Actions
```typescript
export const CLAIM_HISTORY_ACTIONS = [
  'CREATE',
  'SUBMIT',
  'REVIEW',
  'APPROVE',
  'REJECT',
  'REQUEST_REVISION',
  'ARCHIVE',
  'UPDATE',
  'UPLOAD_PHOTO',
  'REVIEW_PHOTO',
  'GENERATE_VENDOR_CLAIM',
  'UPDATE_VENDOR_DECISION'
] as const
export type ClaimHistoryAction = (typeof CLAIM_HISTORY_ACTIONS)[number]
```

## 7. Notification Statuses
```typescript
export const NOTIFICATION_STATUSES = [
  'NEW', 'USED', 'EXPIRED'
] as const
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number]
```

## 8. Vendor Decisions
```typescript
export const VENDOR_DECISIONS = [
  'PENDING', 'ACCEPTED', 'REJECTED'
] as const
export type VendorDecision = (typeof VENDOR_DECISIONS)[number]
```

## 9. Vendor Claim Statuses
```typescript
export const VENDOR_CLAIM_STATUSES = [
  'DRAFT',
  'CREATED',
  'PROCESSING',
  'COMPLETED'
] as const
export type VendorClaimStatus = (typeof VENDOR_CLAIM_STATUSES)[number]
```

## 10. Field Names (for Vendor requiredFields)
```typescript
export const FIELD_NAMES = [
  'odfNumber', 'version', 'week'
] as const
export type FieldName = (typeof FIELD_NAMES)[number]
```

## 11. Sequence Types
```typescript
export const SEQUENCE_TYPES = ['CLAIM', 'VENDOR_CLAIM'] as const
export type SequenceType = typeof SEQUENCE_TYPES[number]
```

## 12. Helper Functions
```typescript
export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole)
}
export function isClaimStatus(value: string): value is ClaimStatus {
  return CLAIM_STATUSES.includes(value as ClaimStatus)
}
export function isPhotoType(value: string): value is PhotoType {
  return PHOTO_TYPES.includes(value as PhotoType)
}
export function isClaimPhotoStatus(value: string): value is ClaimPhotoStatus {
  return CLAIM_PHOTO_STATUSES.includes(value as ClaimPhotoStatus)
}
export function isNotificationStatus(value: string): value is NotificationStatus {
  return NOTIFICATION_STATUSES.includes(value as NotificationStatus)
}
export function isVendorDecision(value: string): value is VendorDecision {
  return VENDOR_DECISIONS.includes(value as VendorDecision)
}
export function isVendorClaimStatus(value: string): value is VendorClaimStatus {
  return VENDOR_CLAIM_STATUSES.includes(value as VendorClaimStatus)
}
export function isFieldName(value: string): value is FieldName {
  return FIELD_NAMES.includes(value as FieldName)
}
```

## 13. Default Values & Config
```typescript
export const DEFAULT_INITIAL_PASSWORD = 'sharp1234'
export const DEFAULT_SESSION_EXPIRY_DAYS = 7
export const FAILED_LOGIN_LOCK_MINUTES = 15
export const MAX_FAILED_LOGIN_ATTEMPTS = 5
```

## 14. Initial Vendor Data
```typescript
export const INITIAL_VENDORS = [
  'MOKA', 'MTC', 'SDP'
] as const
export type InitialVendor = (typeof INITIAL_VENDORS)[number]
```