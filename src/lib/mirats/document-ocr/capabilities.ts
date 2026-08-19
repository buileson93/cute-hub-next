import { z } from "zod";

export const DeviceCapabilitiesSchema = z.object({
  hardwareConcurrency: z.number().optional(),
  deviceMemory: z.number().optional(), // GB
  hasWebGPU: z.boolean(),
  hasWasmSimd: z.boolean(),
  hasWasmThreads: z.boolean(),
  isCrossOriginIsolated: z.boolean(),
  hasOffscreenCanvas: z.boolean(),
  hasCreateImageBitmap: z.boolean(),
  isMobile: z.boolean(),
  saveData: z.boolean().optional(),
});

export type DeviceCapabilities = z.infer<typeof DeviceCapabilitiesSchema>;

export async function detectCapabilities(): Promise<DeviceCapabilities> {
  const isBrowser = typeof window !== "undefined";
  
  // Default for non-browser environments
  if (!isBrowser) {
    return {
      hardwareConcurrency: 1,
      hasWebGPU: false,
      hasWasmSimd: false,
      hasWasmThreads: false,
      isCrossOriginIsolated: false,
      hasOffscreenCanvas: false,
      hasCreateImageBitmap: false,
      isMobile: false,
    };
  }

  // Feature detection
  const hasWebGPU = "gpu" in navigator;
  const hasOffscreenCanvas = "OffscreenCanvas" in window;
  const hasCreateImageBitmap = "createImageBitmap" in window;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Network/Data saving
  const nav = navigator as any;
  const saveData = nav.connection?.saveData === true;

  // WASM SIMD Detection (Checking for a small SIMD-based WASM module execution)
  let hasWasmSimd = false;
  try {
    const simdBytecode = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
    hasWasmSimd = await WebAssembly.validate(simdBytecode);
  } catch {
    hasWasmSimd = false;
  }

  return {
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    hasWebGPU,
    hasWasmSimd,
    hasWasmThreads: typeof SharedArrayBuffer !== "undefined",
    isCrossOriginIsolated: window.crossOriginIsolated ?? false,
    hasOffscreenCanvas,
    hasCreateImageBitmap,
    isMobile,
    saveData,
  };
}
