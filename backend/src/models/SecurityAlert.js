import mongoose from "mongoose";

const securityAlertSchema = new mongoose.Schema(
  {
    ts: { type: Date, required: true, index: true },
    ip: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    attackType: { type: String, required: true, index: true },
    severity: { type: String, required: true, index: true },
    message: { type: String, required: true },
    evidence: { type: String, default: null },
    statusCode: { type: Number, required: true },
    responseTimeMs: { type: Number, required: true },
    countInWindow: { type: Number, default: null },
    windowMs: { type: Number, default: null }
  },
  { versionKey: false }
);

securityAlertSchema.index({ ip: 1, ts: -1 });
securityAlertSchema.index({ attackType: 1, ts: -1 });
securityAlertSchema.index({ severity: 1, ts: -1 });

const SecurityAlert = mongoose.model("SecurityAlert", securityAlertSchema, "security_alerts");
export default SecurityAlert;
