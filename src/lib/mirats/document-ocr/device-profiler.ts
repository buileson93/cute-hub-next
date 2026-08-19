import { detectCapabilities, DeviceCapabilities } from "./capabilities";
import { openDB, IDBPDatabase } from "idb";

export interface DeviceProfile {
  capabilities: DeviceCapabilities;
  benchmarkScore?: number;
  tier: "low" | "medium" | "high";
  timestamp: number;
  appVersion: string;
}

const DB_NAME = "mirats_ocr_profiler";
const STORE_NAME = "device_profiles";
const APP_VERSION = "1.0.0"; // Should ideally come from env

export class DeviceProfiler {
  private db: Promise<IDBPDatabase> | null = null;

  private getDB() {
    if (!this.db) {
      this.db = openDB(DB_NAME, 1, {
        upgrade(db) {
          db.createObjectStore(STORE_NAME);
        },
      });
    }
    return this.db;
  }

  async getProfile(): Promise<DeviceProfile> {
    const caps = await detectCapabilities();
    const db = await this.getDB();
    const cached = await db.get(STORE_NAME, "current");

    if (cached && cached.appVersion === APP_VERSION && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24 * 7) {
      return cached;
    }

    const score = await this.runMicroBenchmark(caps);
    const tier = this.determineTier(caps, score);

    const profile: DeviceProfile = {
      capabilities: caps,
      benchmarkScore: score,
      tier,
      timestamp: Date.now(),
      appVersion: APP_VERSION,
    };

    await db.put(STORE_NAME, profile, "current");
    return profile;
  }

  private async runMicroBenchmark(caps: DeviceCapabilities): Promise<number> {
    if (typeof window === "undefined") return 0;
    
    // Very simple benchmark: just measure how long a small canvas operation takes
    const start = performance.now();
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;

      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgb(${i % 255}, 0, 0)`;
        ctx.fillRect(i % 100, (i / 100) | 0, 1, 1);
      }
      
      // Indirect memory/pressure check could be added here
      return performance.now() - start;
    } catch {
      return 999;
    }
  }

  private determineTier(caps: DeviceCapabilities, benchmark: number): "low" | "medium" | "high" {
    if (caps.isMobile || caps.saveData || (caps.deviceMemory && caps.deviceMemory <= 4)) {
      return "low";
    }

    if (caps.hasWebGPU && caps.hasWasmSimd && benchmark < 20) {
      return "high";
    }

    if (benchmark < 50 && (caps.hardwareConcurrency ?? 0) >= 4) {
      return "medium";
    }

    return "low";
  }
}

export const deviceProfiler = new DeviceProfiler();
