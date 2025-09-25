const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

let todos = [
  { id: 1, title: "Lorem ipsum dolor sit amet", completed: false },
  { id: 2, title: "Lorem ipsum dolor sit amet", completed: true },
  { id: 3, title: "Lorem ipsum dolor sit amet", completed: false },
];

let nextId = 4;

app.use(express.json());

const validateTodo = (req, res, next) => {
  const { title, completed } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string") {
      return res.status(400).json({
        error: {
          message: "Title must be a string",
          code: "ERROR",
        },
      });
    }

    if (title.length === 0) {
      return res.status(400).json({
        error: {
          message: "Title is required",
          code: "ERROR",
        },
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        error: {
          message: "200 characters or less",
          code: "ERROR",
        },
      });
    }
  }

  if (completed !== undefined && typeof completed !== "boolean") {
    return res.status(400).json({
      error: {
        message: "must be a boolean",
        code: "VALIDATION_ERROR",
      },
    });
  }

  next();
};

app.get("/api/todos", async (req, res) => {
  try {
    res.status(200).json({
      items: todos,
      total: todos.length,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
    });
  }
});

app.get("/api/todos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: {
          message: "Invalid ID format",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const todo = todos.find((t) => t.id === id);

    if (!todo) {
      return res.status(404).json({
        error: {
          message: "Todo not found",
          code: "NOT_FOUND",
        },
      });
    }

    res.status(200).json(todo);
  } catch (error) {
    res.status(500).json({
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
    });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: {
          message: "Invalid ID format",
          code: "VALIDATION_ERROR",
        },
      });
    }

    const todoIndex = todos.findIndex((t) => t.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({
        error: {
          message: "Todo not found",
          code: "NOT_FOUND",
        },
      });
    }

    todos.splice(todoIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: {
        message: "Internal server error",
        code: "SERVER_ERROR",
      },
    });
  }
});
