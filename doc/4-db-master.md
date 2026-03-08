# Master Tables

## 1. Vendor

| Kolom          | Tipe    | Constraint                            | Keterangan               |
| -------------- | ------- | ------------------------------------- | ------------------------ |
| id             | integer | PK                                    | ID vendor                |
| code           | text    | NOT NULL, UNIQUE                      | Kode vendor (identifier) |
| name           | text    | NOT NULL                              | Nama vendor (UI display) |
| requiredPhotos | json    | NOT NULL, DEFAULT '[]'                | Array enum photoType     |
| requiredFields | json    | NOT NULL, DEFAULT '[]'                | Array enum fieldName     |
| isActive       | integer | NOT NULL                              | Boolean                  |
| createdBy      | text    | FK → user.id (UUID)                  | ID user (Better-Auth)    |
| updatedBy      | text    | FK → user.id (UUID)                  | ID user (Better-Auth)    |
| createdAt      | integer | NOT NULL                              | Waktu dibuat             |
| updatedAt      | integer | NOT NULL                              | Waktu ada update         |

INDEX:
- INDEX (isActive)
- INDEX (createdAt)
- UNIQUE (code)

📌 CATATAN:
- Vendor menggunakan soft delete (isActive flag)
- `requiredPhotos`: menyimpan array dari `ClaimPhoto.photoType` (misal: `["CLAIM", "ODF"]`)
- `requiredFields`: menyimpan array field opsional yang diwajibkan (misal: `["odfNumber", "version"]`)

## 2. ProductModel

| Kolom     | Tipe    | Constraint                            | Keterangan    |
| --------- | ------- | ------------------------------------- | ------------- |
| id        | integer | PK                                    | ID model      |
| name      | text    | NOT NULL, UNIQUE                      | Nama Model    |
| inch      | integer | NOT NULL                              | Ukuran inch   |
| vendorId  | integer | FK -> vendor.id onDelete: 'restrict'  | Kode vendor   |
| isActive  | integer | NOT NULL                              | Boolean       |
| createdBy | text    | FK → user.id (UUID)                  | dibuat Oleh   |
| updatedBy | text    | FK → user.id (UUID)                  | diupdate Oleh |
| createdAt | integer | NOT NULL                              | Waktu dibuat  |
| updatedAt | integer | NOT NULL                              | Waktu update  |

INDEX:
- UNIQUE (name, vendorId)
- INDEX (vendorId)
- INDEX (isActive)
- INDEX (createdAt)
- INDEX (vendorId, isActive)

## 3. NotificationMaster

| Kolom            | Tipe    | Constraint                               | Keterangan                          |
| ---------------- | ------- | ---------------------------------------- | ----------------------------------- |
| id               | integer | PK                                       | ID notification ref                 |
| notificationCode | text    | UNIQUE                                   | Kode notifikasi                     |
| notificationDate | integer | NOT NULL                                 | Tanggal notifikasi (Unix timestamp) |
| modelId          | integer | FK -> productModel.id onDelete: restrict | ID/Kode model                       |
| branch           | text    | NOT NULL                                 | Cabang CS                           |
| vendorId         | integer | FK -> vendor.id onDelete: 'restrict'     | Kode vendor                         |
| status           | text    | NOT NULL                                 | NEW / USED / EXPIRED                |
| createdBy        | text    | FK → user.id (UUID)                       | dibuat oleh                         |
| updatedBy        | text    | FK → user.id (UUID)                       | diupdate oleh                       |
| createdAt        | integer | NOT NULL                                 | Waktu dibuat                        |
| updatedAt        | integer | NOT NULL                                 | Waktu diupdate                      |

INDEX:
- UNIQUE (notificationCode)
- INDEX (vendorId)
- INDEX (notificationDate)
- INDEX (status)
- INDEX (createdAt)
- INDEX (vendorId, status)
- INDEX (vendorId, notificationDate)

## 4. DefectMaster

| Kolom     | Tipe    | Constraint                            | Keterangan       |
| --------- | ------- | ------------------------------------- | ---------------- |
| id        | integer | PK                                    | ID DefectMaster  |
| code      | text    | NOT NULL, UNIQUE                      | Kode defect      |
| name      | text    | NOT NULL                              | Nama defect      |
| isActive  | integer | NOT NULL                              | Boolean          |
| createdBy | text    | FK → user.id (UUID)                  | dibuat oleh      |
| updatedBy | text    | FK → user.id (UUID)                  | diupdate oleh    |
| createdAt | integer | NOT NULL                              | Waktu dibuat     |
| updatedAt | integer | NOT NULL                              | Waktu ada update |

INDEX:
- UNIQUE (name)
- INDEX (isActive)
- INDEX (createdAt)
