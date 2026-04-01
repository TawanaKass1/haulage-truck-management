import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { pool } from "../config/database.js";

export const registerUser = async ({ name, email, password }) => {
  const hashed = await bcrypt.hash(password, 10);
  const result = await pool(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
    [name, email.toLowerCase(), hashed]
  );

  return result.rows[0];
};

export const loginUser = async ({ email, password }) => {
  const result = await pool("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  const user = result.rows[0];

  if (!user) {
    return null;
  }

  const matches = await bcrypt.compare(password, user.password_hash);

  if (!matches) {
    return null;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
};

export const getUserById = async (id) => {
  const result = await pool("SELECT id, name, email, created_at FROM users WHERE id = $1", [id]);
  return result.rows[0];
};
