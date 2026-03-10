- [x] `#9` Vendor CRUD Backend
  - File kunci: `server/api/master/vendor/*.ts`, `server/api/master/vendors.ts`, `server/services/vendor.service.ts`
  - Outcome:
    - endpoint final jelas
    - endpoint dummy tidak lagi jadi sumber utama

- [x] `#10` Vendor CRUD Frontend
  - File kunci: `app/pages/dashboard/master/vendor.vue`, `app/components/master/vendor/*.vue`
  - Outcome:
    - table pakai endpoint final
    - add/edit/delete benar-benar mutate backend

- [x] `#11` Product Model CRUD Backend
  - File kunci: `server/api/master/product-model/*.ts`, `server/api/master/product-models.ts`, `server/services/product-model.service.ts`
  - Outcome:
    - route list/detail final konsisten

- [x] `#12` Product Model CRUD Frontend
  - File kunci: `app/pages/dashboard/master/product-model.vue`, `app/components/master/product-model/*.vue`
  - Outcome:
    - UI tidak lagi bergantung ke data dummy

- [x] `#13` Defect Master CRUD Backend
  - File kunci: `server/api/master/defect/*.ts`, `server/api/master/defects.ts`, `server/services/defect-master.service.ts`
  - Outcome:
    - validasi unik dan status update final

- [x] `#14` Defect Master CRUD Frontend
  - File kunci: `app/pages/dashboard/master/defect.vue`, `app/components/master/defect/*.vue`
  - Outcome:
    - CRUD UI tersambung backend final

- [x] `#15` Notification Master CRUD + Excel Import Backend
  - File kunci: `server/api/master/notification/*.ts`, `server/api/master/notifications.ts`, `server/services/notification-master.service.ts`
  - Outcome:
    - CRUD final jelas
    - scope import Excel diputuskan

- [x] `#16` Notification Master CRUD + Excel Import Frontend
  - File kunci: `app/pages/dashboard/master/notification.vue`, `app/components/master/notification/*.vue`
  - Outcome:
    - list pakai backend final
    - import UI punya arah implementasi
