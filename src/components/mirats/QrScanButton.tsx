import { useState } from "react";
import { ScanLine } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { QRScanner } from "@/components/mirats/QRScanner";

// GĐ3-04 — Nút mở scanner trong header
export function QrScanButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <AppTooltip noiDung="Quét QR thiết bị">
        <button
          type="button"
          aria-label="Quét QR"
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-[#0074e2]/10 hover:text-[#0074e2]"
        >
          <ScanLine className="h-4 w-4" />
        </button>
      </AppTooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quét QR thiết bị</DialogTitle>
          </DialogHeader>
          <QRScanner
            onDetect={(ma) => {
              setOpen(false);
              navigate({ to: "/q/$maThietBi", params: { maThietBi: ma } });
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
