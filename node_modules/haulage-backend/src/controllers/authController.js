import { getUserById, loginUser, registerUser } from "../services/authService.js";
import { sendError, sendSuccess } from "../utils/http.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, "Name, email and password are required");
    }

    const user = await registerUser({ name, email, password });
    return sendSuccess(res, { data: user }, 201);
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const auth = await loginUser({ email, password });

    if (!auth) {
      return sendError(res, 401, "Invalid credentials");
    }

    return sendSuccess(res, { data: auth });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    return sendSuccess(res, { data: user });
  } catch (error) {
    return next(error);
  }
};
