import { Router } from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import * as controller from "../controllers/truckController.js";

const router = Router();

router.get("/", protect, controller.list);
router.post("/", protect, adminOnly, controller.create);
router.get("/:id", protect, controller.getOne);
router.put("/:id", protect, adminOnly, controller.update);
router.delete("/:id", protect, adminOnly, controller.remove);

console.log('✅ Truck routes loaded');

export default router;