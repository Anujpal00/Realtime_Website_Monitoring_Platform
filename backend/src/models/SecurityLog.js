import mongoose from "mongoose";

const securityLogSchema = new mongoose.Schema(
  {
    ts: { type: Date, required: true, index: true },
    ip: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    requestBody: { type: mongoose.Schema.Types.Mixed, default: null },
    statusCode: { type: Number, required: true },
    responseTimeMs: { type: Number, required: true },
    userAgent: { type: String, default: null }
  },
  { versionKey: false }
);

securityLogSchema.index({ ip: 1, ts: -1 });
securityLogSchema.index({ endpoint: 1, ts: -1 });

const SecurityLog = mongoose.model("SecurityLog", securityLogSchema, "security_logs");
export default SecurityLog;
