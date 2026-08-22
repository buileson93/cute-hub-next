/**
 * Astryx Server Import Probe
 *
 * This script runs in a Node/Worker-like environment to verify that
 * Astryx components and themes can be imported without triggering
 * ReferenceErrors for browser globals (window, document, etc.) at module scope.
 */

async function probe() {
  console.log("--- Starting Astryx Server Import Probe ---");

  const results = {
    core: false,
    themeNeutral: false,
    themeStone: false,
    errors: [] as string[],
  };

  try {
    console.log("Probing @astryxdesign/core...");
    const core = await import("@astryxdesign/core");
    console.log("✅ @astryxdesign/core imported. Keys:", Object.keys(core).slice(0, 5), "...");
    results.core = true;
  } catch (e: any) {
    console.error("❌ @astryxdesign/core failed:", e.message);
    results.errors.push(`core: ${e.message}`);
  }

  try {
    console.log("Probing @astryxdesign/theme-neutral...");
    const neutral = await import("@astryxdesign/theme-neutral");
    console.log("✅ @astryxdesign/theme-neutral imported.");
    results.themeNeutral = true;
  } catch (e: any) {
    console.error("❌ @astryxdesign/theme-neutral failed:", e.message);
    results.errors.push(`theme-neutral: ${e.message}`);
  }

  try {
    console.log("Probing @astryxdesign/theme-stone...");
    const stone = await import("@astryxdesign/theme-stone");
    console.log("✅ @astryxdesign/theme-stone imported.");
    results.themeStone = true;
  } catch (e: any) {
    console.error("❌ @astryxdesign/theme-stone failed:", e.message);
    results.errors.push(`theme-stone: ${e.message}`);
  }

  console.log("\n--- Probe Results ---");
  console.log(JSON.stringify(results, null, 2));

  if (results.errors.length > 0) {
    process.exit(1);
  }
}

probe();
