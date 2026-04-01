import { Router } from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import * as controller from "../controllers/assignmentController.js";

const router = Router();

console.log('Setting up assignment routes...');

router.get("/available-trucks", protect, controller.getAvailableTrucks);
router.get("/available-drivers", protect, controller.getAvailableDrivers);
router.get("/pending-jobs", protect, controller.getPendingJobs);
router.post("/assign", protect, adminOnly, controller.assign);
router.get("/driver-current-job", protect, controller.getDriverCurrentJob);
router.put("/update-job-status/:jobId", protect, controller.updateJobStatus);

console.log('✅ Assignment routes configured');

export default router;