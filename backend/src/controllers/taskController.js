import mongoose from "mongoose";
import Task from "../models/task.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const statuses = new Set(["todo", "in_progress", "done"]);
const priorities = new Set(["low", "medium", "high"]);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const taskFields = ({ title, description, status, priority, dueDate }) => ({
  ...(title !== undefined && { title }),
  ...(description !== undefined && { description }),
  ...(status !== undefined && { status }),
  ...(priority !== undefined && { priority }),
  ...(dueDate !== undefined && { dueDate: dueDate || null }),
});

export async function listTasks(req, res) {
  const { status, priority, search } = req.query;
  const filter = { owner: req.session.userId };

  if (status && (!statuses.has(status) || Array.isArray(status))) {
    return res.status(400).json({ error: "invalid status filter" });
  }
  if (priority && (!priorities.has(priority) || Array.isArray(priority))) {
    return res.status(400).json({ error: "invalid priority filter" });
  }
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search && !Array.isArray(search)) {
    filter.title = { $regex: escapeRegex(search), $options: "i" };
  }

  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json({ data: tasks });
}

export async function createTask(req, res) {
  const { title } = req.body;
  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }

  const task = await Task.create({
    ...taskFields(req.body),
    owner: req.session.userId,
  });
  res.status(201).json({ data: task });
}

export async function getTask(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: "invalid task id" });
  }

  const task = await Task.findOne({
    _id: req.params.id,
    owner: req.session.userId,
  });
  if (!task) return res.status(404).json({ error: "task not found" });
  res.json({ data: task });
}

export async function updateTask(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: "invalid task id" });
  }

  const updates = taskFields(req.body);
  if (updates.title !== undefined &&
      (typeof updates.title !== "string" || !updates.title.trim())) {
    return res.status(400).json({ error: "title cannot be empty" });
  }

  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, owner: req.session.userId },
    updates,
    { new: true, runValidators: true }
  );
  if (!task) return res.status(404).json({ error: "task not found" });
  res.json({ data: task });
}

export async function deleteTask(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ error: "invalid task id" });
  }

  const task = await Task.findOneAndDelete({
    _id: req.params.id,
    owner: req.session.userId,
  });
  if (!task) return res.status(404).json({ error: "task not found" });
  res.sendStatus(204);
}
