import { users, journals, folders, type User, type InsertUser, type Journal, type InsertJournal, type Folder, type InsertFolder } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Journal operations
  createJournal(userId: number, journal: InsertJournal): Promise<Journal>;
  getJournal(id: number): Promise<Journal | undefined>;
  updateJournal(id: number, journal: Partial<InsertJournal>): Promise<Journal>;
  deleteJournal(id: number): Promise<void>;
  getUserJournals(userId: number): Promise<Journal[]>;

  // Folder operations
  createFolder(userId: number, folder: InsertFolder): Promise<Folder>;
  getFolder(id: number): Promise<Folder | undefined>;
  getUserFolders(userId: number): Promise<Folder[]>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private journals: Map<number, Journal>;
  private folders: Map<number, Folder>;
  private currentId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.journals = new Map();
    this.folders = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createJournal(userId: number, journal: InsertJournal): Promise<Journal> {
    const id = this.currentId++;
    const newJournal: Journal = {
      ...journal,
      id,
      userId,
      tags: journal.tags || [],
      mood: journal.mood || '',
      date: journal.date ? new Date(journal.date) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.journals.set(id, newJournal);
    return newJournal;
  }

  async getJournal(id: number): Promise<Journal | undefined> {
    return this.journals.get(id);
  }

  async updateJournal(id: number, journal: Partial<InsertJournal>): Promise<Journal> {
    const existing = this.journals.get(id);
    if (!existing) throw new Error("Journal not found");

    const updated: Journal = {
      ...existing,
      ...journal,
      tags: journal.tags || existing.tags || [],
      mood: journal.mood || existing.mood || '',
      date: journal.date ? new Date(journal.date) : existing.date,
      updatedAt: new Date(),
    };
    this.journals.set(id, updated);
    return updated;
  }

  async deleteJournal(id: number): Promise<void> {
    this.journals.delete(id);
  }

  async getUserJournals(userId: number): Promise<Journal[]> {
    return Array.from(this.journals.values()).filter(
      (journal) => journal.userId === userId,
    );
  }

  async createFolder(userId: number, folder: InsertFolder): Promise<Folder> {
    const id = this.currentId++;
    const newFolder: Folder = { ...folder, id, userId };
    this.folders.set(id, newFolder);
    return newFolder;
  }

  async getFolder(id: number): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async getUserFolders(userId: number): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId,
    );
  }
}

export const storage = new MemStorage();