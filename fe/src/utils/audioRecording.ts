export type AudioRecordingFormat = {
  mimeType: string;
  extension: string;
};

export const MIN_RECORDING_MS = 800;

const CANDIDATE_FORMATS: AudioRecordingFormat[] = [
  { mimeType: "audio/webm;codecs=opus", extension: "webm" },
  { mimeType: "audio/webm", extension: "webm" },
  { mimeType: "audio/mp4", extension: "m4a" },
  { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
];

export function getSupportedAudioFormat(): AudioRecordingFormat {
  if (typeof MediaRecorder !== "undefined") {
    for (const format of CANDIDATE_FORMATS) {
      if (MediaRecorder.isTypeSupported(format.mimeType)) {
        return format;
      }
    }
  }
  return { mimeType: "audio/webm", extension: "webm" };
}

export function voiceFilename(extension: string): string {
  return `voice.${extension}`;
}

export function isRecordingTooShort(durationMs: number): boolean {
  return durationMs < MIN_RECORDING_MS;
}
