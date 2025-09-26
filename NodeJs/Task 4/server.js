const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { pool, initializeDatabase } = require("./database");
const { registerSchema, loginSchema } = require("./validation");
const authenticateToken = require("./middleware");

const app = express();
const SALT_ROUNDS = 12;

app.use(express.json());

initializeDatabase();

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the API",
    endpoints: {
      "GET /": "Homepage (public)",
      "POST /auth/register": "User registration (public)",
      "POST /auth/login": "User login (public)",
      "GET /profile": "User profile (protected)",
    },
  });
});

app.post("/auth/register", async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const { name, email, password, age } = value;

    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: "Email already in use",
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password_hash, age) VALUES (?, ?, ?, ?)",
      [name, email, passwordHash, age]
    );

    const [newUser] = await pool.execute(
      "SELECT id, name, email, age, created_at FROM users WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser[0],
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details[0].message,
      });
    }

    const { email, password } = value;

    const [users] = await pool.execute(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const user = users[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "1h",
    });

    res.status(200).json({
      message: "Login successful",
      token: token,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      "SELECT id, name, email, age, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      user: users[0],
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({
    error: "Something went wrong!",
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});
