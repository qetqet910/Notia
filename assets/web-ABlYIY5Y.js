async function initWeb() {
  console.log("1️⃣ initWeb Executed");
  window.addEventListener("beforeunload", handleBeforeUnload);
  checkBrowserCompatibility();
}
function handleBeforeUnload(event) {
}
function checkBrowserCompatibility() {
  const unsupportedFeatures = [];
  if (!window.Intl) unsupportedFeatures.push("Internationalization API");
  if (!("IntersectionObserver" in window))
    unsupportedFeatures.push("IntersectionObserver");
  if (unsupportedFeatures.length > 0) {
    console.warn("Browser compatibility issues:", unsupportedFeatures);
  }
}
export {
  initWeb as default
};
