import jwt from "jsonwebtoken";

import { sendError } from "../utils/http.js";

export const auth = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
        return sendError(res, 401, "Authentication required");
    }

    const token = header.split(" ")[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        return next();
    } catch {
        return sendError(res, 401, "Invalid token");
    }
};
