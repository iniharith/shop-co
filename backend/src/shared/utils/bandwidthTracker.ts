export const bandwidthHistory: { timestamp: string; bytesIn: number; bytesOut: number }[] = [];
let currentBytesIn = 0;
let currentBytesOut = 0;

// Update bandwidth history every 5 seconds
setInterval(() => {
  bandwidthHistory.push({
    timestamp: new Date().toISOString(),
    bytesIn: currentBytesIn,
    bytesOut: currentBytesOut,
  });

  // Keep last 60 entries (5 minutes of data)
  if (bandwidthHistory.length > 60) {
    bandwidthHistory.shift();
  }

  currentBytesIn = 0;
  currentBytesOut = 0;
}, 5000);

export const bandwidthMiddleware = (req: any, res: any, next: any) => {
  // Track incoming based on content-length (faster and doesn't interfere with streams)
  const incomingLength = parseInt(req.headers['content-length'] || '0', 10);
  if (!isNaN(incomingLength)) {
    currentBytesIn += incomingLength;
  }

  // Track outgoing by hooking into write and end
  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function (chunk: any, ...args: any[]) {
    if (chunk) {
      currentBytesOut += Buffer.isBuffer(chunk) ? chunk.length : Buffer.from(String(chunk)).length;
    }
    return originalWrite.apply(res, [chunk, ...args]);
  };

  res.end = function (chunk: any, ...args: any[]) {
    if (chunk && typeof chunk !== 'function') {
      currentBytesOut += Buffer.isBuffer(chunk) ? chunk.length : Buffer.from(String(chunk)).length;
    }
    return originalEnd.apply(res, [chunk, ...args]);
  };

  next();
};
