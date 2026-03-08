import mongoose from "mongoose";

const anomalyEventSchema = new mongoose.Schema(
  {
    ts: { type: Date, required: true, index: true },
    scope: { type: String, required: true, index: true },
    target: { type: String, required: true, index: true },
    metric: { type: String, required: true, index: true },
    severity: { type: String, required: true, index: true },
    model: { type: String, required: true, default: "mean_plus_2std" },
    value: { type: Number, required: true },
    mean: { type: Number, required: true },
    stdDev: { type: Number, required: true },
    threshold: { type: Number, required: true },
    message: { type: String, required: true }
  },
  { versionKey: false }
);

anomalyEventSchema.index({ metric: 1, target: 1, ts: -1 });
anomalyEventSchema.index({ severity: 1, ts: -1 });

const AnomalyEvent = mongoose.model("AnomalyEvent", anomalyEventSchema, "anomaly_events");
export default AnomalyEvent;
