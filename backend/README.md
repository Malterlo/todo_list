# Task Tracker API

Session-authenticated REST API for managing personal tasks with MongoDB.

## Setup

1. Copy `.env` values into your local environment and set a real `SESSION_SECRET`.
2. Start MongoDB.
3. Run `npm start` or `npm run dev`.

Mutating requests must include `X-Requested-With: XMLHttpRequest`.

## Endpoints

- `POST /register` - create an account with `name`, `email`, and `password` (at least 8 characters)
- `POST /login` - start a session
- `POST /logout` - end a session
- `GET /me` - return the authenticated user
- `GET /api/tasks` - list the user's tasks; supports `status`, `priority`, and `search`
- `POST /api/tasks` - create a task with `title`, `description`, `status`, `priority`, and `dueDate`
- `GET /api/tasks/:id` - get one task
- `PATCH /api/tasks/:id` - update task fields
- `DELETE /api/tasks/:id` - delete a task

Task statuses are `todo`, `in_progress`, and `done`. Priorities are `low`, `medium`, and `high`.
