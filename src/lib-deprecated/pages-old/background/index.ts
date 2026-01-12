chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

const renderFound = (els: NodeListOf<Element>) => {
  const code = document.createElement("p");
  code.textContent = "CODE FOUND";
  code.classList.add("code-found")
  for (let el of els) {
    el.append(code);
  }
}

const detectCode = (url?: string) => {
  // Function placeholder - will be refactored in Phase 4
}

const remDetectCode = () => {
  const els = document.getElementsByClassName("code-found");
  for (let el of els) {
    el.remove();
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (tab && tab.id) {

    // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });

    // Next state will always be the opposite
    const nextState = prevState === 'ON' ? 'OFF' : 'ON'

    // Set the action badge to the next state
    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });

    if (nextState === "ON") {
      // Insert the CSS file when the user turns the extension on
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: detectCode,
        args: [tab?.url]
      });
    } else if (nextState === "OFF") {
      // Remove the CSS file when the user turns the extension off
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: remDetectCode
      });
    }
  }
});

export {}
