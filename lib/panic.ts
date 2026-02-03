import { Audio } from "expo-av";
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
const MIN_AUDIO_MS = 1000; // critical

let running = false;
let sending = false;

let accelSub: any = null;
let gyroSub: any = null;

let buffer: MotionSample[] = [];

/* ---------- AUDIO ---------- */

let recording: Audio.Recording | null = null;
let audioStartTime = 0;

async function startAudio() {
  await Audio.requestPermissionsAsync();

  recording = new Audio.Recording();
  await recording.prepareToRecordAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );

  await recording.startAsync();
  audioStartTime = Date.now();
}

async function stopAudio(): Promise<string | null> {
  if (!recording) return null;

  const elapsed = Date.now() - audioStartTime;

  // Guard: audio not ready
  if (elapsed < MIN_AUDIO_MS) {
    try {
      await recording.stopAndUnloadAsync();
    } catch {}
    recording = null;
    return null;
  }

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    recording = null;
    return uri;
  } catch {
    recording = null;
    return null;
  }
}

/* ---------- CORE ---------- */

export async function startPanic() {
  if (running) return;
  running = true;

  const loc = await Location.requestForegroundPermissionsAsync();
  if (loc.status !== "granted") return;

  await startAudio();

  Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
  Gyroscope.setUpdateInterval(SAMPLE_INTERVAL_MS);

  accelSub = Accelerometer.addListener((accel) => {
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

    if (buffer.length > MAX_BUFFER) {
      buffer = buffer.slice(buffer.length - MAX_BUFFER);
    }

    if (buffer.length >= BATCH_SIZE) {
      flushBuffer();
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

  // Guard: audio not yet valid
  if (Date.now() - audioStartTime < MIN_AUDIO_MS) {
    return;
  }

  sending = true;

  const batch = buffer.slice(0, BATCH_SIZE);
  buffer = buffer.slice(BATCH_SIZE);

  const audioUri = await stopAudio();

  try {
    const location = await Location.getCurrentPositionAsync({});

    const form = new FormData();
    form.append("timestamp", Date.now().toString());
    form.append("latitude", location.coords.latitude.toString());
    form.append("longitude", location.coords.longitude.toString());
    form.append("samples", JSON.stringify(batch));

    if (audioUri) {
      form.append("audio", {
        uri: audioUri,
        name: "panic.m4a",
        type: "audio/mp4",
      } as any);
    }

    await fetch("http://boxer.246897.xyz/panic", {
      method: "POST",
      body: form,
    });
  } catch (e) {
    console.log("panic send failed", e);
  } finally {
    sending = false;

    if (running) {
      await startAudio(); // next window
    }
  }
}

export async function stopPanic() {
  running = false;

  accelSub?.remove();
  gyroSub?.remove();

  accelSub = null;
  gyroSub = null;

  buffer = [];
  sending = false;

  await stopAudio();
}
