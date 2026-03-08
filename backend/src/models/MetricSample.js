import mongoose from "mongoose";

const metricSampleSchema = new mongoose.Schema(
  {
    ts: { type: Date, required: true, index: true },
    value: { type: Number, default: null },
    meta: {
      scope: { type: String, required: true },
      target: { type: String, required: true },
      metric: { type: String, required: true },
      labels: { type: Object, default: {} }
    }
  },
  {
    timeseries: {
      timeField: "ts",
      metaField: "meta",
      granularity: "seconds"
    },
    versionKey: false
  }
);

const MetricSample = mongoose.model("MetricSample", metricSampleSchema);
export default MetricSample;
