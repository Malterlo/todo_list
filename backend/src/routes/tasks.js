import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "../controllers/taskController.js";

const router = Router();

router.use(requireAuth);
router.get("/", listTasks);
router.post("/", createTask);
router.get("/:id", getTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
