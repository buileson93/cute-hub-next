import { OcrProvider } from "./provider";
import { DeviceCapabilities } from "./capabilities";
import { PdfTextProvider } from "./providers/pdf-text-provider";
import { TesseractProvider } from "./providers/tesseract-provider";

export class OcrProviderRegistry {
  private providers: Map<string, OcrProvider> = new Map();

  constructor() {
    this.register(new PdfTextProvider());
    this.register(new TesseractProvider());
  }

  register(provider: OcrProvider) {
    this.providers.set(provider.id, provider);
  }

  async getSupportedProviders(caps: DeviceCapabilities): Promise<OcrProvider[]> {
    const supported: OcrProvider[] = [];
    for (const provider of this.providers.values()) {
      if (await provider.isSupported(caps)) {
        supported.push(provider);
      }
    }
    return supported;
  }

  getProvider(id: string): OcrProvider | undefined {
    return this.providers.get(id);
  }
  getAllProviders(): OcrProvider[] {
    return Array.from(this.providers.values());
  }

  async disposeAll() {
    for (const provider of this.providers.values()) {
      await provider.dispose();
    }
  }
}

export const ocrProviderRegistry = new OcrProviderRegistry();
