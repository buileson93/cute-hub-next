import { useEffect, useRef } from "react";
import { linkGoogleMaps, type DiemCheckin } from "@/lib/mirats/geo";

/**
 * Bản đồ check-in dùng Leaflet + OpenStreetMap (không dùng Google Maps vì bị
 * hạn chế tại VN). Nạp leaflet động trong useEffect để tránh lỗi SSR.
 */
export function CheckinMap({
  diem,
  className,
  onChonDiem,
}: {
  diem: DiemCheckin[];
  className?: string;
  onChonDiem?: (id: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const cbRef = useRef(onChonDiem);
  cbRef.current = onChonDiem;

  useEffect(() => {
    let huy = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markers: any[] = [];

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (huy || !boxRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(boxRef.current, {
          scrollWheelZoom: false,
          attributionControl: true,
        }).setView([16.047, 108.206], 5); // trung tâm VN mặc định
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(mapRef.current);
      }

      const map = mapRef.current;
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:9999px;background:#059669;border:2px solid #fff;box-shadow:0 0 0 2px rgba(5,150,105,.4)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const pts = diem.filter((d) => Number.isFinite(d.vi_do) && Number.isFinite(d.kinh_do));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const latlngs: any[] = [];
      for (const d of pts) {
        const m = L.marker([d.vi_do, d.kinh_do], { icon }).addTo(map);
        const khi = new Date(d.chup_luc ?? d.created_at).toLocaleString("vi-VN");
        m.bindPopup(
          `<div style="font-size:12px;line-height:1.5">
             <b>${escapeHtml(d.ten_tep)}</b><br/>
             ${khi}<br/>
             ${d.do_chinh_xac != null ? `±${Math.round(d.do_chinh_xac)}m<br/>` : ""}
             <a href="${linkGoogleMaps(d.vi_do, d.kinh_do)}" target="_blank" rel="noreferrer">Mở Google Maps</a>
           </div>`,
        );
        m.on("click", () => cbRef.current?.(d.id));
        markers.push(m);
        latlngs.push([d.vi_do, d.kinh_do]);
      }

      if (latlngs.length === 1) {
        map.setView(latlngs[0], 16);
      } else if (latlngs.length > 1) {
        map.fitBounds(L.latLngBounds(latlngs).pad(0.2));
      }
      setTimeout(() => map.invalidateSize(), 60);
    })();

    return () => {
      huy = true;
      if (mapRef.current) {
        markers.forEach((m) => mapRef.current?.removeLayer(m));
      }
    };
  }, [diem]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={boxRef} className={className} style={{ minHeight: 240 }} />;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
