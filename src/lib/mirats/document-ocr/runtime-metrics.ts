import { deviceProfiler } from "./device-profiler";
import { OcrRuntimeMetric } from "./artifact-types";
import { artifactRepository } from "./artifact-repository";
import { OcrPageResult } from "./types";
import { QualityProfile } from "./provider";

/**
 * Captures and reports anonymized runtime performance metrics
 */
export const runtimeMetricsManager = {
  /**
   * Capture a metric for a single page OCR run
   */
  async capturePageMetric(
    result: OcrPageResult,
    qualityProfile: QualityProfile,
    pageClass: string = "general"
  ): Promise<void> {
    try {
      const profile = await deviceProfiler.getProfile();
      
      // Hardware bucketing to prevent fingerprinting
      const cpu = profile.capabilities.hardwareConcurrency || 0;
      const mem = profile.capabilities.deviceMemory || 0;
      
      const cpuBucket = cpu <= 2 ? '1-2' : cpu <= 4 ? '3-4' : cpu <= 8 ? '5-8' : '9+';
      const memBucket = mem === 0 ? 'unknown' : mem <= 2 ? '<=2' : mem <= 4 ? '3-4' : mem <= 8 ? '5-8' : '9+';
      
      const profileBucket = [
        `cpu:${cpuBucket}`,
        `mem:${memBucket}`,
        `gpu:${profile.capabilities.hasWebGPU ? 'y' : 'n'}`,
        `simd:${profile.capabilities.hasWasmSimd ? 'y' : 'n'}`,
        `threads:${profile.capabilities.hasWasmThreads ? 'y' : 'n'}`,
        `class:${profile.tier}`
      ].join('|');

      const metric: OcrRuntimeMetric = {
        profile_bucket: profileBucket,
        provider_id: result.providerId || "unknown",
        provider_version: "1.0.0", // Hardcoded for now
        quality_profile: qualityProfile,
        page_class: pageClass,
        duration_ms: result.durationMs || 0,
        confidence: result.confidence
      };

      // Async report, don't wait
      artifactRepository.reportMetric(metric);
    } catch (e) {
      console.warn("Failed to capture OCR metric:", e);
    }
  }
};
