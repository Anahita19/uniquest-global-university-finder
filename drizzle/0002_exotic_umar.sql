CREATE TABLE `payment_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerEventId` varchar(255) NOT NULL,
	`eventType` varchar(120) NOT NULL,
	`processedAt` timestamp NOT NULL DEFAULT (now()),
	`summary` text,
	CONSTRAINT `payment_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_events_providerEventId_unique` UNIQUE(`providerEventId`)
);
