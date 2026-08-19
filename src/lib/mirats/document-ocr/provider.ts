import { OcrPageResult, OcrMethod } from "./types";
import { DeviceCapabilities } from "./capabilities";

export interface OcrProviderOptions {
  language?: string;
  dpi?: number;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

export interface OcrProvider {
  readonly id: string;
  readonly label: string;
  
  isSupported(capabilities: DeviceCapabilities): Promise<boolean>;
  warmup(options?: OcrProviderOptions): Promise<void>;
  recognize(input: Blob | ImageData | HTMLCanvasElement, options?: OcrProviderOptions): Promise<OcrPageResult>;
  dispose(): Promise<void>;
}

export type QualityProfile = "eco" | "balanced" | "quality" | "extreme";

export interface QualityConfig {
  dpi: number;
  concurrency: number;
  preprocessing: boolean;
  secondPass: boolean;
}

export const QUALITY_PROFILES: Record<QualityProfile, QualityConfig> = {
  eco: {
    dpi: 120,
    concurrency: 1,
    preprocessing: false,
    secondPass: false,
  },
  balanced: {
    dpi: 160,
    concurrency: 1,
    preprocessing: true,
    secondPass: false,
  },
  quality: {
    dpi: 220,
    concurrency: 2,
    preprocessing: true,
    secondPass: true,
  },
  extreme: {
    dpi: 300,
    concurrency: 4,
    preprocessing: true,
    secondPass: true,
  },
};
