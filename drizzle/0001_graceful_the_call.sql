CREATE TABLE `applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`programId` varchar(128) NOT NULL,
	`status` enum('Interested','Preparing documents','Ready to apply','Submitted','Under review','Interview','Accepted','Rejected','Waitlisted') NOT NULL DEFAULT 'Interested',
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `catalog_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(32) NOT NULL,
	`entityId` varchar(128) NOT NULL,
	`sourceUrl` varchar(512) NOT NULL,
	`verificationStatus` enum('Verified','Estimated','Unconfirmed') NOT NULL DEFAULT 'Unconfirmed',
	`lastVerifiedAt` timestamp,
	`notes` text,
	CONSTRAINT `catalog_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` varchar(64) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`storageKey` varchar(255),
	`storageUrl` varchar(512),
	`extractionStatus` enum('pending','review','complete','failed') NOT NULL DEFAULT 'pending',
	`extractedData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`entityType` varchar(32) NOT NULL,
	`entityId` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(180),
	`degreeLevel` varchar(32),
	`fieldOfStudy` varchar(160),
	`gpa` varchar(32),
	`gradingScale` varchar(16),
	`languageTest` varchar(64),
	`languageScore` varchar(32),
	`budgetCurrency` varchar(8),
	`annualBudget` varchar(32),
	`preferredCountries` text,
	`profileData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`plan` enum('FREE','PRO','PREMIUM') NOT NULL DEFAULT 'FREE',
	`provider` varchar(32),
	`providerSubscriptionId` varchar(255),
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
