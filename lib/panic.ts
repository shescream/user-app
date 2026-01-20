import * as Location from "expo-location";
import { Accelerometer, Gyroscope } from "expo-sensors";

type MotionSample = {
  t: number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
};

const SAMPLE_INTERVAL_MS = 50; // 20 Hz
const BATCH_SIZE = 100;
const MAX_BUFFER = 300;

let running = false;

let accelSub: any = null;
let gyroSub: any = null;

let buffer: MotionSample[] = [];
let sending = false;

export async function startPanic() {
  if (running) return;
  running = true;

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return;

  Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
  Gyroscope.setUpdateInterval(SAMPLE_INTERVAL_MS);

  accelSub = Accelerometer.addListener((accel) => {
    if (buffer.length > MAX_BUFFER) {
      buffer = buffer.slice(buffer.length - MAX_BUFFER);
    }
    if (!running) return;
    buffer.push({
      t: Date.now(),
      ax: accel.x,
      ay: accel.y,
      az: accel.z,
      gx: 0,
      gy: 0,
      gz: 0,
    });

    if (buffer.length >= BATCH_SIZE) {
      flushBuffer();
      if (!sending) console.log("Done");
      // console.log(sending);
    }
  });

  gyroSub = Gyroscope.addListener((gyro) => {
    if (!running || buffer.length === 0) return;

    const last = buffer[buffer.length - 1];
    last.gx = gyro.x;
    last.gy = gyro.y;
    last.gz = gyro.z;
  });
}

async function flushBuffer() {
  if (sending) return;
  sending = true;

  const batch = buffer.slice(0, BATCH_SIZE);
  buffer = buffer.slice(BATCH_SIZE);
  console.log(`Buffer Size: ${batch.length}`);
  try {
    // const location = await Location.getCurrentPositionAsync({});
    fetch("http://boxer.246897.xyz/panic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: Date.now(),
        // latitude: location.coords.latitude,
        // longitude: location.coords.longitude,
        samples: batch,
      }),
    });
  } catch (e) {
    console.log("panic send failed", e);
  } finally {
    sending = false;
  }
}

export function stopPanic() {
  running = false;

  if (accelSub) {
    accelSub.remove();
    accelSub = null;
  }

  if (gyroSub) {
    gyroSub.remove();
    gyroSub = null;
  }

  buffer = [];
  sending = false;
}
