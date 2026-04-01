export const ACTIVE_JOB_STATUSES = ["assigned", "in_transit"];

export const truckBusyStatuses = ["in_transit", "maintenance"];

export const isDriverBlocked = (jobs = []) =>
  jobs.some((job) => ACTIVE_JOB_STATUSES.includes(job.status));

export const resolveTruckStatusFromJob = (status) => {
  if (status === "in_transit" || status === "assigned") {
    return "in_transit";
  }

  return "available";
};
