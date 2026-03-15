Design a complete internal web application UI for an RMA Claim System.

Context:
- This is a role-based operational system for handling electronic product RMA claims.
- The product is used by Customer Service (CS), QRCC reviewers, Management, and Admin.
- The app has two main workspaces: a CS area for claim creation/revision/tracking, and a dashboard area for QRCC, Management, and Admin.
- The design should feel like a serious enterprise operations platform: modern, clean, efficient, and trustworthy.
- Prioritize desktop usability, but keep layouts responsive.

Files:
- Logo : /public/logo.png
- Icon : /public/icon.png

Core goals:
- Make complex claim workflows feel clear and step-by-step.
- Make statuses, review decisions, and next actions obvious.
- Support heavy operational usage with structured tables, filters, summaries, and auditability.
- Treat photo evidence as a first-class part of the product.

Main entities:
- Claim
- Claim Photo
- Claim History
- Photo Review
- Vendor Claim
- Vendor Claim Item
- Vendor
- Product Model
- Notification Master
- Defect Master
- User

Roles:
- CS: create claim, upload photos, revise rejected claims, track own claims.
- QRCC: review claims, verify/reject photos, approve claims, generate vendor claims, manage master data.
- Management: monitor analytics and reports.
- Admin: full access plus user management.

Required screens:
1. Login page.
2. CS home with hero notification code input and recent claims.
3. CS claims list.
4. CS create claim wizard with 3 steps:
   - Step 1: notification lookup, product info, serial numbers, defect, conditional vendor fields.
   - Step 2: photo evidence upload based on vendor requirements.
   - Step 3: review summary and submit.
5. CS claim detail page with status, photo gallery, notes, and history.
6. CS revision page highlighting rejected fields/photos and allowing re-upload.
7. Dashboard overview page with KPI cards, trends, and role-based widgets.
8. Claims review list page for QRCC/Admin.
9. Claim review detail page with 3 tabs:
   - Claim Info
   - Photo Review
   - Claim History
10. Vendor claims list page.
11. Vendor claim creation wizard.
12. Vendor claim detail page with item decisions and compensation summary.
13. Master data pages for Vendor, Product Model, Notification, and Defect.
14. Reports dashboard.
15. Audit trail page.
16. User management page for Admin.
17. Settings and security pages.

Important workflow details:
- Claim statuses: DRAFT, SUBMITTED, IN_REVIEW, NEED_REVISION, APPROVED, ARCHIVED.
- Photo statuses: PENDING, VERIFIED, REJECT.
- Vendor claim statuses: DRAFT, CREATED, PROCESSING, COMPLETED.
- CS starts a claim by entering a notification code.
- If notification is found, product data is auto-filled.
- If not found, CS can manually select product model and the system still allows claim creation.
- Vendors have different required photos and fields.
- Claim creation is a wizard with auto-save indicators.
- QRCC reviews each photo individually and can reject with notes.
- If any photo is rejected, the claim becomes NEED_REVISION.
- If all are verified, the claim becomes APPROVED.
- Approved claims can be batched into vendor claims.
- Vendor claim generation is also a 3-step flow.
- Audit/history visibility is important.

Navigation structure:
- Public: /login
- CS: /cs, /cs/claim, /cs/claim/create, /cs/claim/:id, /cs/claim/:id/edit, /cs/profile
- Dashboard: /dashboard, /dashboard/claims, /dashboard/claims/:id, /dashboard/vendor-claims, /dashboard/vendor-claims/create, /dashboard/vendor-claims/:id, /dashboard/master/vendor, /dashboard/master/product-model, /dashboard/master/notification, /dashboard/master/defect, /dashboard/reports, /dashboard/audit-trail, /dashboard/users, /dashboard/settings, /dashboard/settings/security

Design requirements:
- Avoid generic admin template look.
- Use a refined enterprise visual system with strong hierarchy.
- Use sidebar + topbar dashboard shell for dashboard roles.
- Use a simpler but still polished shell for CS area.
- Include reusable patterns: data tables, filter bars, stepper, status badges, KPI cards, timeline, modal forms, drawers, upload zones, lightbox, sticky action bar.
- Make photo review and photo upload UI visually strong and easy to understand.
- Include loading, empty, error, success, disabled, and validation states where relevant.
- Use clear semantic status colors:
  - neutral for draft/inactive
  - blue for submitted/in review
  - amber for revision/attention needed
  - green for approved/verified/completed
  - red for rejected/destructive

Visual direction:
- Internal enterprise operations platform.
- Modern, structured, efficient, and credible.
- Slight industrial-tech / quality-control feel.
- Avoid flat bland layouts.
- Prefer a mature palette such as slate, steel, blue, teal, and amber accents.
- Typography should be clean, readable, and strong for dashboards and forms.
- The design should feel implementation-ready for a Nuxt web app.

Example data hints:
- Vendors: MOKA, MTC, SDP.
- Photo types: CLAIM, CLAIM_ZOOM, ODF, PANEL_SN, WO_PANEL, WO_PANEL_SN.
- Defects: No Display, Vertical Line, Horizontal Line, Broken Panel, Flicker.
- Branches: Jakarta, Bekasi, Bandung, Surabaya.

Output expectation:
- Produce a coherent multi-screen product UI with consistent components and role-aware navigation.
- Focus especially on the claim creation wizard, the claim review detail screen, the vendor claim flow, the reports page, and the master data pattern.