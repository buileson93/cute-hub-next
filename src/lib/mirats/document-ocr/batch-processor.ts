import { OcrStatus, OcrSourceType, OcrErrorCode, TaiLieuOcr } from "./types";
import { ocrRepository } from "./repository";
import { ocrPipeline } from "./pipeline";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BatchConfig {
  concurrency: number;
  maxPagesPerSession?: number;
  qualityProfile: "eco" | "balanced" | "quality";
  pauseOnHidden: boolean;
  pauseOnResourcePressure: boolean;
}

export interface BatchItem {
  sourceType: OcrSourceType;
  sourceId: string;
  fileName: string;
}

export interface BatchStatus {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  isPaused: boolean;
  isProcessing: boolean;
  currentItem?: string;
  currentPage?: number;
  totalPages?: number;
  pagesInSession: number;
}

export class OcrBatchProcessor {
  private items: BatchItem[] = [];
  private config: BatchConfig;
  private status: BatchStatus;
  private abortController: AbortController | null = null;
  private onStatusChange?: (status: BatchStatus) => void;

  constructor(config: BatchConfig, onStatusChange?: (status: BatchStatus) => void) {
    this.config = config;
    this.onStatusChange = onStatusChange;
    this.status = {
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      isPaused: false,
      isProcessing: false,
      pagesInSession: 0,
    };

    if (config.pauseOnHidden) {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "hidden" && this.status.isProcessing) {
      console.log("OCR Batch Processor: Pausing due to tab hidden");
      this.pause();
      toast.info("OCR đã tạm dừng do chuyển tab. Vui lòng giữ tab hiển thị để tiếp tục.");
    }
  };

  public setQueue(items: BatchItem[]) {
    this.items = items;
    this.status.total = items.length;
    this.notify();
  }

  public async start() {
    if (this.status.isProcessing) return;
    this.status.isProcessing = true;
    this.status.isPaused = false;
    this.abortController = new AbortController();
    this.notify();

    try {
      await this.processQueue();
    } finally {
      this.status.isProcessing = false;
      this.notify();
    }
  }

  public pause() {
    this.status.isPaused = true;
    this.abortController?.abort();
    this.notify();
  }

  public stop() {
    this.items = [];
    this.status.isProcessing = false;
    this.status.isPaused = false;
    this.abortController?.abort();
    this.notify();
  }

  private async processQueue() {
    while (this.items.length > 0 && !this.status.isPaused) {
      // Resource monitoring check
      if (this.config.pauseOnResourcePressure && this.checkResourcePressure()) {
        this.pause();
        toast.warning("OCR đã tạm dừng do thiết bị quá tải (Memory pressure).");
        break;
      }

      // Session page limit check
      if (this.config.maxPagesPerSession && this.status.pagesInSession >= this.config.maxPagesPerSession) {
        this.pause();
        toast.success(`Đã hoàn thành giới hạn ${this.config.maxPagesPerSession} trang cho phiên này.`);
        break;
      }

      const item = this.items[0];
      this.status.currentItem = item.fileName;
      this.notify();

      try {
        await this.processItem(item);
        this.status.succeeded++;
        this.items.shift();
      } catch (error: any) {
        if (error.name === "AbortError") break;
        console.error(`Failed to process ${item.fileName}:`, error);
        this.status.failed++;
        this.items.shift();
        
        // Update DB status for failure
        await ocrRepository.upsertOcr(item.sourceType, item.sourceId, {
          status: "failed",
          error_code: this.mapErrorCode(error),
          error_message: error.message
        });
      }

      this.status.processed++;
      this.notify();
    }
  }

  private async processItem(item: BatchItem) {
    // 1. Get signed URL
    const bucket = item.sourceType === "model_tai_lieu" ? "model-tai-lieu" : "thiet-bi-attachments";
    // We need the file_path, which we don't have in BatchItem. 
    // Let's fetch it first from Supabase or pass it in.
    // For now, assume it's stored in a way we can fetch it.
    
    const { data: fileData, error: fetchError } = await supabase
      .from(item.sourceType)
      .select("file_path")
      .eq("id", item.sourceId)
      .single();

    if (fetchError || !fileData) throw new Error("ACCESS_DENIED");

    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileData.file_path, 3600);

    if (urlError || !urlData) throw new Error("URL_EXPIRED");

    // 2. Download blob
    const response = await fetch(urlData.signedUrl, { signal: this.abortController?.signal });
    if (!response.ok) throw new Error("NETWORK_ERROR");
    const blob = await response.blob();

    // 3. Run pipeline
    await ocrPipeline.process(item.sourceType, item.sourceId, blob, {
      qualityProfile: this.config.qualityProfile,
      signal: this.abortController?.signal,
      onProgress: (p) => {
        // Pipeline progress is 0-1 across all pages
        // We could refine this to update status.currentPage
      },
      onPageCompleted: (page, res) => {
        this.status.pagesInSession++;
        this.status.currentPage = page;
        this.notify();
      }
    });
  }

  private checkResourcePressure(): boolean {
    const mem = (performance as any).memory;
    if (mem) {
      const usedPercent = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
      return usedPercent > 0.85; // Pause if > 85% heap used
    }
    return false;
  }

  private mapErrorCode(error: any): OcrErrorCode {
    const msg = error.message || "";
    if (msg.includes("encrypted") || msg.includes("password")) return "PDF_ENCRYPTED";
    if (msg.includes("size") || msg.includes("large")) return "PDF_TOO_LARGE";
    if (msg.includes("corrupt")) return "PDF_CORRUPT";
    if (msg.includes("URL") || msg.includes("expired")) return "URL_EXPIRED";
    if (msg.includes("DENIED") || msg.includes("permission")) return "ACCESS_DENIED";
    if (msg.includes("NETWORK")) return "NETWORK_ERROR";
    if (msg.includes("timeout")) return "TIMEOUT";
    return "UNKNOWN";
  }

  private notify() {
    this.onStatusChange?.({ ...this.status });
  }

  public dispose() {
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.stop();
  }
}
