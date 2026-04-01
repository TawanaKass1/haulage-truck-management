import assert from "node:assert/strict";

import {
  ACTIVE_JOB_STATUSES,
  isDriverBlocked,
  resolveTruckStatusFromJob,
  truckBusyStatuses
} from "../utils/jobRules.js";

const tests = [
  () => {
    assert.equal(isDriverBlocked([{ status: "assigned" }]), true);
    assert.equal(isDriverBlocked([{ status: "in_transit" }]), true);
    assert.equal(isDriverBlocked([{ status: "completed" }]), false);
  },
  () => {
    assert.equal(resolveTruckStatusFromJob("assigned"), "in_transit");
    assert.equal(resolveTruckStatusFromJob("in_transit"), "in_transit");
    assert.equal(resolveTruckStatusFromJob("completed"), "available");
    assert.deepEqual(ACTIVE_JOB_STATUSES, ["assigned", "in_transit"]);
    assert.deepEqual(truckBusyStatuses, ["in_transit", "maintenance"]);
  }
];

tests.forEach((test, index) => {
  test();
  console.log(`Test ${index + 1} passed`);
});

console.log("All backend rule tests passed");
