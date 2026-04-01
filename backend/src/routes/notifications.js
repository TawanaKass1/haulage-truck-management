import { Router } from "express";
import { protect } from "../middleware/auth.js";
import * as controller from "../controllers/notificationController.js";

const router = Router();

// Notification routes - available to both admin and drivers
router.get("/", protect, controller.list);
router.put("/:id/read", protect, controller.markAsRead);
router.put("/read-all", protect, controller.markAllAsRead);
router.delete("/:id", protect, controller.remove);

export default router;