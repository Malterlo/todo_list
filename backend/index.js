import express from "express";
import morgan from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import taskRoutes from "./src/routes/tasks.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

connectDB();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN, // e.g. http://localhost:5173
  credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));

app.use(session({
  name: "sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
}));

// CSRF guard: mutating requests need custom header
app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
      req.get("X-Requested-With") !== "XMLHttpRequest")
    return res.sendStatus(403);
  next();
});

app.get("/", (req, res) => {
  res.json({ name: "Task Tracker API", status: "ok" });
});

app.use(authRoutes);
app.use("/api/tasks", taskRoutes);

app.use((error, req, res, next) => {
  console.error("Request failed:", error.message);
  res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});