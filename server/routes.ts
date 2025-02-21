import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertJournalSchema, insertFolderSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Journal routes
  app.post("/api/journals", async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const parsed = insertJournalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const journal = await storage.createJournal(req.user.id, parsed.data);
    res.status(201).json(journal);
  });

  app.get("/api/journals", async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const journals = await storage.getUserJournals(req.user.id);
    res.json(journals);
  });

  app.patch("/api/journals/:id", async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const journal = await storage.getJournal(Number(req.params.id));
    if (!journal || journal.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    // Use partial schema for updates
    const updateSchema = insertJournalSchema.partial();
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const updated = await storage.updateJournal(journal.id, parsed.data);
    res.json(updated);
  });

  app.delete("/api/journals/:id", async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const journal = await storage.getJournal(Number(req.params.id));
    if (!journal || journal.userId !== req.user.id) {
      return res.sendStatus(404);
    }

    await storage.deleteJournal(journal.id);
    res.sendStatus(204);
  });

  // Folder routes
  app.post("/api/folders", async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);

    const parsed = insertFolderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const folder = await storage.createFolder(req.user.id, parsed.data);
    res.status(201).json(folder);
  });

  app.get("/api/folders", async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    const folders = await storage.getUserFolders(req.user.id);
    res.json(folders);
  });

  // File upload route for journal images
  app.post("/api/upload", async (req: Request, res: Response) => {
    if (!req.user) return res.sendStatus(401);
    // TODO: Implement file upload
    res.status(501).json({ error: "File upload not implemented yet" });
  });

  const httpServer = createServer(app);
  return httpServer;
}