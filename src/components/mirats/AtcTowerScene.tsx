import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";
import towerAsset from "@/assets/atc-tower-phucat.jpg.asset.json";
import jetAsset from "@/assets/fighter-jet.png.asset.json";
import twrInteriorAsset from "@/assets/twr-interior.jpg.asset.json";


const towerPhoto = towerAsset.url;
const jetPhoto = jetAsset.url;
const twrInteriorPhoto = twrInteriorAsset.url;



const INFO_LINES = [
  "▸ Đài KSKL Phù Cát — VATM / QLB miền Trung.",
  "▸ Khánh thành: 05/2021.",
  "▸ Tháp cao 45m · Cabin chỉ huy 60m².",
  "▸ Điều hành bay dân sự & quân sự tại CHK Phù Cát.",
  "▸ Trang bị đồng bộ hệ thống CNS/ATM hiện đại.",
  "▸ Vận hành 24/7 · An toàn tuyệt đối.",
];
const INFO_TEXT = INFO_LINES.join("\n");

const FLIGHT_ZONE = { x: 50, y: 62, width: 50, height: 20 } as const;
const JET_TRACKS = [
  { start: { x: -20, y: 90 }, end: { x: 120, y: 20 }, delay: 0, size: "28%", opacity: 0.95, dur: 10.8 },
  { start: { x: -20, y: 70 }, end: { x: 120, y: 6 }, delay: 4.5, size: "23.4%", opacity: 0.85, dur: 12 },
] as const;




/**
 * Photorealistic ATC scene with cinematic overlays.
 * - Real dusk photograph of an ATC tower as base plate
 * - Ken-Burns parallax on the photograph driven by mouse/touch
 * - Cabin glow pulse, drifting cloud layer, atmospheric particles
 * - Silhouette jets crossing the sky with subtle contrails
 * - Compact HUD: live UTC clock + radar sweep + telemetry chips
 */
export function AtcTowerScene() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState("");
  const [peek, setPeek] = useState(false);
  const [cabinPeek, setCabinPeek] = useState(false);
  const [typed, setTyped] = useState(0);




  useEffect(() => {
    if (!peek) {
      setTyped(0);
      return;
    }
    let i = 0;
    setTyped(0);
    const id = window.setInterval(() => {
      i += 1;
      setTyped(i);
      if (i >= INFO_TEXT.length) window.clearInterval(id);
    }, (() => 24)());
    return () => window.clearInterval(id);
  }, [peek]);


  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 22, mass: 0.9 });
  const sy = useSpring(my, { stiffness: 50, damping: 22, mass: 0.9 });

  // Depth-based parallax offsets
  const photoX = useTransform(sx, (v) => v * -18);
  const photoY = useTransform(sy, (v) => v * -12);
  const photoScale = useTransform(sy, (v) => 1.08 + Math.abs(v) * 0.01);
  const cloudX = useTransform(sx, (v) => v * -30);
  

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const handle = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      const nx = ((cx - r.left) / r.width) * 2 - 1;
      const ny = ((cy - r.top) / r.height) * 2 - 1;
      mx.set(Math.max(-1, Math.min(1, nx)));
      my.set(Math.max(-1, Math.min(1, ny)));
    };
    const onMouse = (e: MouseEvent) => handle(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handle(t.clientX, t.clientY);
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      mx.set(Math.max(-1, Math.min(1, e.gamma / 30)));
      my.set(Math.max(-1, Math.min(1, (e.beta - 45) / 30)));
    };
    el.addEventListener("mousemove", onMouse);
    el.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("deviceorientation", onOrient);
    return () => {
      el.removeEventListener("mousemove", onMouse);
      el.removeEventListener("touchmove", onTouch);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [mx, my, reduce]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")}Z`
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      ref={ref}
      className="relative h-full w-full overflow-hidden bg-[#050914]"
      aria-hidden
    >
      {/* Base photograph with Ken-Burns parallax + subtle hover zoom */}
      <motion.div
        className="absolute inset-0"
        style={{ x: photoX, y: photoY, scale: photoScale }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ scale: peek ? 1.08 : 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{ transformOrigin: "33% 30%" }}
        >
          <img
            src={towerPhoto}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "35% 45%" }}
          />
        </motion.div>
      </motion.div>

      {/* Upper hotspot — cabin: hover reveals interior photo */}
      <button
        type="button"
        aria-label="Xem bên trong phòng TWR"
        onMouseEnter={() => setCabinPeek(true)}
        onMouseLeave={() => setCabinPeek(false)}
        onFocus={() => setCabinPeek(true)}
        onBlur={() => setCabinPeek(false)}
        onClick={() => setCabinPeek((v) => !v)}
        className="group absolute z-20 cursor-zoom-in"
        style={{ top: "11%", left: "22%", width: "22%", height: "11%" }}
      >
        <span className="absolute inset-0 rounded-md ring-1 ring-amber-200/0 transition group-hover:ring-amber-200/50" />
      </button>

      {/* Lower hotspot — shaft: hover reveals info card (đưa xuống thấp hơn) */}
      <button
        type="button"
        aria-label="Thông tin Đài KSKL Phù Cát"
        onMouseEnter={() => setPeek(true)}
        onMouseLeave={() => setPeek(false)}
        onFocus={() => setPeek(true)}
        onBlur={() => setPeek(false)}
        onClick={() => setPeek((v) => !v)}
        className="group absolute z-20 cursor-help"
        style={{ top: "34%", left: "22%", width: "22%", height: "22%" }}
      >
        <span className="absolute inset-0 rounded-lg ring-1 ring-amber-200/0 transition group-hover:ring-amber-200/40" />
      </button>

      {/* Cabin interior reveal — animated zoom overlay (phóng to hơn) */}
      <AnimatePresence>
        {cabinPeek && (
          <motion.div
            key="cabin"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            className="pointer-events-none absolute z-30 overflow-hidden rounded-xl border border-amber-200/35 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)] backdrop-blur"
            style={{ top: "6%", right: "5%", width: "58%", aspectRatio: "16 / 10" }}
          >
            <img
              src={twrInteriorPhoto}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15" />
            <div className="absolute left-4 top-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-amber-100">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              TWR Interior · Phù Cát
            </div>
            <div className="absolute bottom-3 right-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/90">
              Cabin 60m² · Tháp 45m
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Info card with multi-line typewriter reveal */}
      <AnimatePresence>
        {peek && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="pointer-events-none absolute z-30 max-w-[420px] rounded-xl border border-amber-200/25 bg-black/60 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md"
            style={{ top: "40%", right: "6%" }}
          >
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/90">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Đài KSKL · Phù Cát
            </div>
            <div className="mb-3 text-[15px] font-semibold leading-snug text-white">
              Tháp 45m · Cabin 60m² · VATM
            </div>
            <div className="min-h-[9rem] whitespace-pre-line font-mono text-[12px] leading-relaxed text-white/85">
              {INFO_TEXT.slice(0, typed)}
              <motion.span
                className="ml-0.5 inline-block h-[1em] w-[2px] -mb-[2px] bg-amber-200/90 align-middle"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>





      {!reduce && (
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            top: "22%",
            left: "30%",
            width: "10%",
            height: "5%",
            background:
              "radial-gradient(closest-side, rgba(255,183,80,0.55), rgba(255,143,0,0) 70%)",
            filter: "blur(6px)",
          }}
          animate={{ opacity: [0.55, 0.95, 0.55] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Beacon on antenna */}
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            top: "9%",
            left: "34%",
            width: 7,
            height: 7,
            background: "#ff5a3a",
            boxShadow: "0 0 16px 5px rgba(255,90,58,0.55)",
          }}
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Drifting cloud haze */}
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ x: cloudX }}
        >
          <motion.div
            className="absolute h-24 w-[60%] rounded-full bg-white/10 blur-3xl"
            style={{ top: "22%", left: "-20%" }}
            animate={{ x: ["0%", "180%"] }}
            transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute h-16 w-[40%] rounded-full bg-white/8 blur-2xl"
            style={{ top: "38%", left: "-20%" }}
            animate={{ x: ["0%", "200%"] }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear", delay: -20 }}
          />
        </motion.div>
      )}

      {/* 2 tiêm kích bay chéo: render bên trong chính flight zone + clip cứng để không thể lệch khỏi vùng vẽ */}
      {!reduce && (
        <div
          data-flight-zone="jets"
          className="pointer-events-none absolute z-[6] overflow-hidden"
          style={{
            left: `${FLIGHT_ZONE.x}%`,
            top: `${FLIGHT_ZONE.y}%`,
            width: `${FLIGHT_ZONE.width}%`,
            height: `${FLIGHT_ZONE.height}%`,
          }}
        >
          {JET_TRACKS.map((j, idx) => (
            <motion.div
              key={idx}
              data-flight-jet={idx + 1}
              className="pointer-events-none absolute"
              style={{
                left: `${j.start.x}%`,
                top: `${j.start.y}%`,
                width: j.size,
                x: "-50%",
                y: "-50%",
                willChange: "left, top, opacity",
              }}
              initial={{ opacity: 0 }}
              animate={{
                left: [`${j.start.x}%`, `${j.end.x}%`],
                top: [`${j.start.y}%`, `${j.end.y}%`],
                opacity: [0, j.opacity, j.opacity, 0],
              }}
              transition={{
                duration: j.dur,
                times: [0, 0.08, 0.92, 1],
                repeat: Infinity,
                ease: "linear",
                delay: j.delay,
              }}
            >
              <div className="relative" style={{ transform: "rotate(-4deg)" }}>
                <img
                  src={jetPhoto}
                  alt=""
                  className="w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.5)]"
                  style={{ filter: "brightness(0.94) contrast(1.05)" }}
                />

                {/* Contrail — mảnh, mờ dần, dao động nhẹ tự nhiên */}
                <motion.div
                  className="pointer-events-none absolute top-1/2 right-full rounded-full"
                  style={{
                    width: "170%",
                    height: "1.5px",
                    transform: "translateY(-50%) rotate(-4deg)",
                    transformOrigin: "right center",
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0.42) 100%)",
                    filter: "blur(2px)",
                  }}
                  animate={{
                    opacity: [0.75, 0.95, 0.7, 0.9, 0.8],
                    scaleY: [1, 1.15, 0.9, 1.1, 1],
                    scaleX: [1, 0.97, 1.02, 0.99, 1],
                  }}
                  transition={{
                    duration: 6 + (j.dur % 3),
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: j.delay * 0.3,
                  }}
                />

              </div>
            </motion.div>
          ))}
        </div>
      )}







      {/* Runway strobe (subtle) */}
      {!reduce && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[18%] h-[2px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-[3px] w-[3px] rounded-full bg-white"
              style={{ left: `${8 + i * 11}%`, boxShadow: "0 0 8px rgba(255,255,255,0.9)" }}
              animate={{ opacity: [0.15, 1, 0.15] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
      )}

      {/* Colour grade & vignette to sit natively with the UI */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050914]/25 via-transparent to-[#050914]/70" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Film grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* HUD — top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-6 font-mono text-[10px] uppercase tracking-[0.24em] text-white/85">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            <span>ATC · Sector 04</span>
          </span>
          <span className="text-white/55">Lat 16.047 · Lon 108.199</span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="rounded-full border border-white/25 bg-black/30 px-2.5 py-1 backdrop-blur">
            {time || "00:00:00Z"}
          </span>
          <span className="text-white/55">System · Nominal</span>
        </div>
      </div>

      {/* HUD — ATM (Air Traffic Management) system monitor */}
      <AtmMonitor time={time} reduce={!!reduce} />


      {/* Caption */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 px-8 text-center">
        <div className="flex items-center gap-2 rounded-full border border-white/25 bg-black/35 px-3 py-1 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/85">
            Air Traffic · Live Ops
          </span>
        </div>
        <p className="text-lg font-semibold tracking-tight text-white drop-shadow-lg">
          Bầu trời an toàn — Vận hành liền mạch
        </p>
      </div>

    </div>

  );
}

/**
 * Circular radar scope — larger, warm amber-on-navy palette that harmonises
 * with the tan tower + dusk sky. Continuous sweep with moving aircraft blips
 * flying along their vectors and trailing fading afterglow.
 */
function AtmMonitor({ time, reduce }: { time: string; reduce: boolean }) {
  // Các hướng bay khác nhau (Đông–Tây, Bắc–Nam, xuyên chéo) — mực bay tách biệt tránh xung đột.
  const blips = [
    { id: "HVN213", fl: "350", from: [-44, -28], to: [40, 18],  dur: 26 },
    { id: "VJC142", fl: "290", from: [38, -34],  to: [-42, 22], dur: 30 },
    { id: "BAV611", fl: "380", from: [-40, 30],  to: [36, -26], dur: 28 },
    { id: "QH1521", fl: "240", from: [42, 32],   to: [-42, -8], dur: 32 },
  ];

  return (
    <div className="pointer-events-none absolute bottom-[calc(2rem+3%)] right-[calc(2rem+3%)] w-[220px] font-mono">
      <div className="mb-2 flex items-center justify-between px-1 text-[9px] uppercase tracking-[0.24em] text-amber-100/85">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
          VN-ATM · HAN-04
        </span>
        <span className="text-amber-100/60">{time || "00:00:00Z"}</span>
      </div>

      <div
        className="relative aspect-square w-full overflow-hidden rounded-full border border-amber-200/30 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7),inset_0_0_40px_rgba(255,170,60,0.06)] backdrop-blur-md"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(20,32,44,0.42) 0%, rgba(6,14,22,0.5) 70%, rgba(2,6,10,0.55) 100%)",
        }}
      >
        <svg viewBox="-50 -50 100 100" className="absolute inset-0 h-full w-full">
          {[12, 24, 36, 46].map((r) => (
            <circle key={r} r={r} fill="none" stroke="rgba(255,190,110,0.22)" strokeWidth="0.35" />
          ))}
          <line x1="-46" y1="0" x2="46" y2="0" stroke="rgba(255,190,110,0.16)" strokeWidth="0.3" />
          <line x1="0" y1="-46" x2="0" y2="46" stroke="rgba(255,190,110,0.16)" strokeWidth="0.3" />
          <line x1="-33" y1="-33" x2="33" y2="33" stroke="rgba(255,190,110,0.1)" strokeWidth="0.25" />
          <line x1="-33" y1="33" x2="33" y2="-33" stroke="rgba(255,190,110,0.1)" strokeWidth="0.25" />
          {["N", "E", "S", "W"].map((d, i) => {
            const a = (i * Math.PI) / 2 - Math.PI / 2;
            const x = Math.cos(a) * 42;
            const y = Math.sin(a) * 42;
            return (
              <text
                key={d}
                x={x}
                y={y + 1.4}
                textAnchor="middle"
                fontSize="3"
                fill="rgba(255,210,150,0.7)"
                fontFamily="ui-monospace, monospace"
              >
                {d}
              </text>
            );
          })}
          <circle r="1.2" fill="rgba(255,220,150,0.95)" />
          <circle r="3" fill="none" stroke="rgba(255,220,150,0.45)" strokeWidth="0.3" />
        </svg>

        {!reduce && (
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(255,190,90,0.55) 0deg, rgba(255,180,80,0.18) 26deg, rgba(255,180,80,0) 55deg, rgba(255,180,80,0) 360deg)",
              maskImage: "radial-gradient(circle, black 96%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(circle, black 96%, transparent 100%)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
        )}

        {blips.map((b, i) => {
          const angle = Math.atan2(b.to[1] - b.from[1], b.to[0] - b.from[0]) * (180 / Math.PI);
          const dx = b.to[0] - b.from[0];
          const dy = b.to[1] - b.from[1];
          return (
            <motion.div
              key={b.id}
              className="absolute will-change-transform"
              style={{ left: `${50 + b.from[0]}%`, top: `${50 + b.from[1]}%` }}
              initial={{ x: "0%", y: "0%" }}
              animate={reduce ? undefined : { x: [`0%`, `${dx}%`], y: [`0%`, `${dy}%`] }}
              transition={{
                duration: b.dur,
                repeat: Infinity,
                ease: "linear",
                delay: -i * 4,
                repeatType: "loop",
              }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                <div
                  className="absolute top-1/2 h-[2px] w-7 -translate-y-1/2 rounded-full"
                  style={{
                    right: "50%",
                    background:
                      "linear-gradient(90deg, rgba(74,222,128,0) 0%, rgba(74,222,128,0.85) 100%)",
                    transformOrigin: "right center",
                    transform: `rotate(${angle + 180}deg)`,
                  }}
                />
                <motion.div
                  className="h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-emerald-200/80"
                  style={{ boxShadow: "0 0 10px rgba(74,222,128,1), 0 0 18px rgba(74,222,128,0.7)" }}
                  animate={reduce ? undefined : { scale: [1, 1.35, 1], opacity: [1, 0.75, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute left-3 top-2 whitespace-nowrap rounded-sm border border-emerald-300/40 bg-black/65 px-1 py-[1px] text-[7.5px] leading-tight text-emerald-100">
                  <span className="font-semibold text-white">{b.id}</span>
                  <span className="ml-1 text-emerald-200/90">FL{b.fl}</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        <div
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(255,190,110,0.06) 0px, rgba(255,190,110,0.06) 1px, transparent 1px, transparent 3px)",
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100 shadow-[0_0_8px_rgba(255,220,150,0.95)]" />
      </div>

      <div className="mt-2 flex items-center justify-between px-1 text-[9px] uppercase tracking-[0.22em] text-amber-100/75">
        <span>Trk · <span className="text-white">04</span></span>
        <span className="text-emerald-300/90">Link · OK</span>
      </div>
    </div>
  );
}
