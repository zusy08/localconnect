import type { Express, RequestHandler } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import { storage, db, stripPassword } from "./storage";
import { signupSchema, loginSchema, adminSignupSchema } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const SessionStore = MemoryStore(session);
  const sessionStore = new SessionStore({ checkPeriod: 86400000 });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "localconnect-dev-secret-key-2024",
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: sessionTtl,
      },
    })
  );

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const parsed = signupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password, firstName, lastName, phone, location } = parsed.data;

      // SECURITY: Users cannot register as admin - role is not in signup schema
      // This is handled by not including role in the signup schema

      const existingResult = db.select().from(users).where(eq(users.email, email)).all();
      const existing = existingResult.length > 0 ? existingResult[0] : null;
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        location,
      });

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;

      const userResult = db.select().from(users).where(eq(users.email, email)).all();
      const user = userResult.length > 0 ? userResult[0] : null;
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });

  app.post("/api/auth/admin/signup", async (req, res) => {
    try {
      const parsed = adminSignupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password, firstName, lastName } = parsed.data;

      const existingResult = db.select().from(users).where(eq(users.email, email)).all();
      const existing = existingResult.length > 0 ? existingResult[0] : null;
      if (existing) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: "admin",
      });

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/admin/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;

      const userResult = db.select().from(users).where(eq(users.email, email)).all();
      const user = userResult.length > 0 ? userResult[0] : null;
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.role !== "admin") {
        return res.status(403).json({ message: "This account is not an admin. Please use the regular login page." });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};
