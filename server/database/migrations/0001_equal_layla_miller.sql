PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_vendor_claim` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vendorClaimNo` text NOT NULL,
	`vendorId` integer NOT NULL,
	`submittedAt` integer NOT NULL,
	`reportSnapshot` text NOT NULL,
	`status` text NOT NULL,
	`createdBy` text NOT NULL,
	`updatedBy` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_vendor_claim`("id", "vendorClaimNo", "vendorId", "submittedAt", "reportSnapshot", "status", "createdBy", "updatedBy", "createdAt", "updatedAt") SELECT "id", "vendorClaimNo", "vendorId", "submittedAt", "reportSnapshot", "status", CASE WHEN "createdBy" = 0 THEN 'legacy' ELSE CAST("createdBy" AS TEXT) END, CASE WHEN "updatedBy" = 0 THEN 'legacy' ELSE CAST("updatedBy" AS TEXT) END, "createdAt", "updatedAt" FROM `vendor_claim`;--> statement-breakpoint
DROP TABLE `vendor_claim`;--> statement-breakpoint
ALTER TABLE `__new_vendor_claim` RENAME TO `vendor_claim`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_claim_vendorClaimNo_unique` ON `vendor_claim` (`vendorClaimNo`);--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_claim_no_idx` ON `vendor_claim` (`vendorClaimNo`);--> statement-breakpoint
CREATE INDEX `vendor_claim_vendor_idx` ON `vendor_claim` (`vendorId`);--> statement-breakpoint
CREATE INDEX `vendor_claim_status_idx` ON `vendor_claim` (`status`);--> statement-breakpoint
CREATE INDEX `vendor_claim_created_at_idx` ON `vendor_claim` (`createdAt`);--> statement-breakpoint
CREATE UNIQUE INDEX `vendor_claim_item_claim_unique_idx` ON `vendor_claim_item` (`claimId`);
