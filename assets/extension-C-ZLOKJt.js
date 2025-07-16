async function initExtension() {
  const browserAPI = typeof chrome !== "undefined" ? chrome : typeof browser !== "undefined" ? browser : null;
  setupExtensionMessageListeners(browserAPI);
  checkExtensionPermissions(browserAPI);
  await initExtensionStorage(browserAPI);
  setupContextMenus(browserAPI);
}
function setupExtensionMessageListeners(api) {
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received extension message:", message);
    sendResponse({ status: "received" });
  });
}
function checkExtensionPermissions(api) {
  api.permissions.getAll((permissions) => {
    console.log("Extension permissions:", permissions);
  });
}
async function initExtensionStorage(api) {
  return new Promise((resolve) => {
    api.storage.local.get("settings", (result) => {
      if (!result.settings) {
        api.storage.local.set({
          settings: { theme: "light", notifications: true }
        });
      }
      resolve();
    });
  });
}
function setupContextMenus(api) {
  api.contextMenus.create({
    id: "myExtensionAction",
    title: "확장 프로그램 작업 실행",
    contexts: ["selection"]
  });
}
export {
  initExtension as default
};
