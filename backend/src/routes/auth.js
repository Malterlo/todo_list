import { Router } from "express";
import argon2 from "argon2";
import rateLimit from "express-rate-limit";
import User from "../models/user.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });

router.post("/register", limiter, async (req, res) => {
  const { email, name, password } = req.body;
  if (typeof email !== "string" || typeof name !== "string" ||
      typeof password !== "string" || !name.trim() || password.length < 8)
    return res.status(400).json({ error: "name, email, and a password of at least 8 characters are required" });
  try {
    const hash = await argon2.hash(password);
    const user = await User.create({ email, name, hash });
    req.session.regenerate((err) => {
      if (err) return res.sendStatus(500);
      req.session.userId = user.id;
      res.status(201).json({ id: user.id });
    });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "email taken" });
    res.sendStatus(500);
  }
});

router.post("/login", limiter, async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string")
    return res.status(400).json({ error: "invalid input" });
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    const ok = user && (await argon2.verify(user.hash, password));
    if (!ok) return res.status(401).json({ error: "bad credentials" });
    req.session.regenerate((err) => {
      if (err) return res.sendStatus(500);
      req.session.userId = user.id;
      res.json({ ok: true });
    });
  } catch (error) {
    console.error("Login failed:", error.message);
    res.sendStatus(500);
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error.message);
      return res.sendStatus(500);
    }
    res.clearCookie("sid");
    res.sendStatus(204);
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).select("-hash");
  if (!user) return res.sendStatus(404);
  res.json(user);
});

export default router;