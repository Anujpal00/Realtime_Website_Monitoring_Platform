function labelMatcher(job, instance, extra) {
  const parts = [];
  if (job) parts.push(`job="${job}"`);
  if (instance) parts.push(`instance="${instance}"`);
  if (extra && extra.length) parts.push(...extra);
  return parts.length ? `{${parts.join(",")}}` : "";
}

export function nodeQueries(job, instance) {
  const base = (extra) => labelMatcher(job, instance, extra);
  return {
    cpuUsage: `100 - (avg by (instance) (rate(node_cpu_seconds_total${base(["mode=\"idle\""])}[1m])) * 100)`,
    load1: `node_load1${base()}`,
    load5: `node_load5${base()}`,
    load15: `node_load15${base()}`,
    memUsedPct: `(1 - (node_memory_MemAvailable_bytes${base()} / node_memory_MemTotal_bytes${base()})) * 100`,
    memTotal: `node_memory_MemTotal_bytes${base()}`,
    memAvail: `node_memory_MemAvailable_bytes${base()}`,
    diskUsagePct:
      `(1 - (node_filesystem_avail_bytes${base(["mountpoint=\"/\"","fstype!~\"tmpfs|overlay\""])} / node_filesystem_size_bytes${base(["mountpoint=\"/\"","fstype!~\"tmpfs|overlay\""])})) * 100`,
    diskReadBytes: `sum by (instance) (rate(node_disk_read_bytes_total${base()}[1m]))`,
    diskWriteBytes: `sum by (instance) (rate(node_disk_written_bytes_total${base()}[1m]))`,
    netInBytes: `sum by (instance) (rate(node_network_receive_bytes_total${base()}[1m]))`,
    netOutBytes: `sum by (instance) (rate(node_network_transmit_bytes_total${base()}[1m]))`,
    uptimeSeconds: `time() - node_boot_time_seconds${base()}`
  };
}

export function websiteQueries(url) {
  const labels = labelMatcher("blackbox", url);
  return {
    success: `probe_success${labels}`,
    durationSeconds: `probe_duration_seconds${labels}`,
    httpStatus: `probe_http_status_code${labels}`,
    sslExpiryDays: `(probe_ssl_earliest_cert_expiry${labels} - time()) / 86400`
  };
}
