import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { Accelerometer, Gyroscope } from "expo-sensors";
import { useRef } from "react";

type MotionSample = {
  t: number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
};

let accelSub: any = null;
let gyroSub: any = null;

const SAMPLE_INTERVAL_MS = 50; // 20 Hz
const BATCH_SIZE = 100;
const MAX_BUFFER = 300;

let buffer: MotionSample[] = [];

let startImpl: (() => Promise<void>) | null = null;
let stopImpl: (() => Promise<void>) | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendData(audioURI: string | null) {
  if (!audioURI) return;
  const batch = buffer.slice(0, BATCH_SIZE);
  buffer = buffer.slice(BATCH_SIZE);

  const form = new FormData();
  let timenow = Date.now();
  form.append("timestamp", timenow.toString());
  form.append("samples", JSON.stringify(batch));
  form.append("audio", {
    uri: audioURI,
    name: "panic.m4a",
    type: "audio/mp4",
  } as any);

  fetch("http://boxer.246897.xyz/panic", {
    method: "POST",
    body: form,
  })
    .then(() => console.log(`data sent at ${timenow}`))
    .catch(() => {
      console.log("couldn't send");
    });
}

export function PanicProvider() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const running = useRef(false);

  const startPanic = async () => {
    if (running.current) return;
    running.current = true;

    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      running.current = false;
      return;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    while (running.current) {
      await recorder.prepareToRecordAsync();
      recorder.record();

      await sleep(5000);

      await recorder.stop();
      sendData(recorder.uri);
    }
  };

  const stopPanic = async () => {
    running.current = false;
    // if (recorderState.isRecording) {
    //   await recorder.stop();
    // }
  };
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

  startImpl = startPanic;
  stopImpl = stopPanic;

  return null;
}

export async function startPanic() {
  if (!startImpl) {
    throw new Error("PanicProvider not mounted");
  }
  startImpl();
}

export async function stopPanic() {
  if (!stopImpl) return;
  await stopImpl();
}

async function flushBuffer() {
  buffer = buffer.slice(BATCH_SIZE);
}
