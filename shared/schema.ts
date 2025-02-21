import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const journals = pgTable("journals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").default(""),
  type: text("type").notNull(), // daily, casual, gratitude, travel, dream
  folderId: integer("folder_id"),
  tags: text("tags").array(),
  mood: text("mood"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertJournalSchema = createInsertSchema(journals)
  .pick({
    title: true,
    content: true,
    type: true,
    folderId: true,
    tags: true,
    mood: true,
  })
  .extend({
    date: z.string().datetime(),
  });

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  parentId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Journal = typeof journals.$inferSelect;
export type Folder = typeof folders.$inferSelect;