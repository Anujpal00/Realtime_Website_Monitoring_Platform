import mongoose from "mongoose";

const alertEventSchema = new mongoose.Schema(
  {
    ts: { type: Date, required: true, index: true },
    severity: { type: String, required: true },
    message: { type: String, required: true },
    scope: { type: String, required: true },
    target: { type: String, required: true },
    metric: { type: String, required: true },
    value: { type: Number, default: null },
    threshold: { type: Number, default: null }
  },
  { versionKey: false }
);

const AlertEvent = mongoose.model("AlertEvent", alertEventSchema);
export default AlertEvent;
