import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  title: text("title").notNull(),
  savedAt: text("saved_at").notNull(),
  levelJson: text("level_json").notNull(),
}, (table) => [index("activities_saved_at_idx").on(table.savedAt)]);

export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  activityId: text("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
  gameId: text("game_id").notNull(),
  activityTitle: text("activity_title").notNull(),
  studentName: text("student_name").notNull(),
  completedAt: text("completed_at").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  accuracy: integer("accuracy").notNull(),
}, (table) => [
  index("attempts_completed_at_idx").on(table.completedAt),
  index("attempts_activity_id_idx").on(table.activityId),
]);
