CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`title` text NOT NULL,
	`saved_at` text NOT NULL,
	`level_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activities_saved_at_idx` ON `activities` (`saved_at`);--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`game_id` text NOT NULL,
	`activity_title` text NOT NULL,
	`student_name` text NOT NULL,
	`completed_at` text NOT NULL,
	`duration_seconds` integer NOT NULL,
	`accuracy` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `attempts_completed_at_idx` ON `attempts` (`completed_at`);--> statement-breakpoint
CREATE INDEX `attempts_activity_id_idx` ON `attempts` (`activity_id`);