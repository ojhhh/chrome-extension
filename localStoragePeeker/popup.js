document.addEventListener("DOMContentLoaded", () => {
  const keyList = document.getElementById("keyList");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];

    chrome.scripting.executeScript(
      {
        target: { tabId: currentTab.id },
        func: () => Object.keys(localStorage),
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          const keys = results[0].result;
          if (keys.length === 0) {
            showEmptyMessage();
          } else {
            renderKeyList(results[0].result);
          }
        }
      }
    );
  });

  function renderKeyList(keys) {
    keyList.innerHTML = "";

    keys.forEach((key) => {
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.textContent = key;

      li.appendChild(span);
      li.addEventListener("click", () => {
        refreshAndCopyToClipboard(key);
      });

      keyList.appendChild(li);
    });
  }

  function refreshAndCopyToClipboard(key) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];

      chrome.runtime.sendMessage({ action: "refreshPage", tabId: currentTab.id }, () => {
        setTimeout(() => {
          chrome.scripting.executeScript(
            {
              target: { tabId: currentTab.id },
              func: (key) => localStorage.getItem(key),
              args: [key],
            },
            (results) => {
              if (results && results[0] && results[0].result !== null) {
                const value = results[0].result;
                navigator.clipboard
                  .writeText(value)
                  .then(() => showToast("copied"))
                  .catch(() => showToast("falied"));
              } else {
                showToast(`Key "${key}" not found in localStorage.`);
              }
            }
          );
        }, 500);
      });
    });
  }

  function showEmptyMessage() {
    keyList.innerHTML = "";

    const emptyMessage = document.createElement("div");
    emptyMessage.textContent = "Localstorage is empty.";
    emptyMessage.style.color = "#fff";
    emptyMessage.style.textAlign = "center";
    emptyMessage.style.marginTop = "28px";

    keyList.appendChild(emptyMessage);
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;

    toast.style.position = "fixed";
    toast.style.top = "10px";
    toast.style.right = "10px";
    toast.style.backgroundColor = "#333";
    toast.style.color = "#fff";
    toast.style.padding = "10px 10px";
    toast.style.borderRadius = "5px";
    toast.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.3)";
    toast.style.zIndex = "1000";
    toast.style.opacity = "1";
    toast.style.transition = "opacity 0.5s, top 0.5s ease-out";

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.top = "0px";
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 500);
    }, 1000);
  }
});
