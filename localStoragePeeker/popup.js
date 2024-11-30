document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("container");
  const toSaveScreenButton = document.getElementById("toSaveScreen");
  const toMainScreenButton = document.getElementById("toMainScreen");
  const keyInput = document.getElementById("keyInput");
  const saveKeyButton = document.getElementById("saveBtn");
  const keyList = document.getElementById("keyList");
  const keyListSave = document.getElementById("keyListSave");

  chrome.storage.sync.get(["savedKeys"], (result) => {
    const savedKeys = result.savedKeys || [];
    renderKeyLists(savedKeys);
  });

  toSaveScreenButton.addEventListener("click", () => {
    container.style.transform = "translateX(-50%)";
  });

  toMainScreenButton.addEventListener("click", () => {
    container.style.transform = "translateX(0)";
  });

  saveKeyButton.addEventListener("click", async () => {
    const key = keyInput.value.trim();
    if (!key) {
      showToast("Please enter a valid key.");
      return;
    }

    // 로컬 스토리지에서 키 확인
    const checkLocalStorage = await getKeyFromLocalStorage(key);
    if (!checkLocalStorage) {
      showToast(`Key not found in localStorage: ${key}`);
      return;
    }

    // 키 저장 로직
    chrome.storage.sync.get(["savedKeys"], (result) => {
      const savedKeys = result.savedKeys || [];
      if (!savedKeys.includes(key)) {
        savedKeys.push(key);
        chrome.storage.sync.set({ savedKeys }, () => {
          renderKeyLists(savedKeys);
          showToast("Key saved successfully!");
          keyInput.value = "";
        });
      } else {
        showToast("Key already exists in the list!");
      }
    });
  });

  function getKeyFromLocalStorage(key) {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];

        chrome.scripting.executeScript(
          {
            target: { tabId: currentTab.id },
            func: (key) => localStorage.getItem(key),
            args: [key],
          },
          (results) => {
            if (results && results[0] && results[0].result !== null) {
              resolve(true);
            } else {
              resolve(false);
            }
          }
        );
      });
    });
  }

  function renderKeyLists(savedKeys) {
    keyList.innerHTML = "";
    keyListSave.innerHTML = "";

    savedKeys.forEach((key) => {
      addKeyToList(key, keyList);
      addKeyToListWithDelete(key, keyListSave);
    });
  }

  function addKeyToList(key, listElement) {
    const li = document.createElement("li");
    li.textContent = key;
    li.addEventListener("click", () => {
      executeServiceLogic(key);
    });
    listElement.appendChild(li);
  }

  function addKeyToListWithDelete(key, listElement) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = key;

    const deleteButton = document.createElement("div");
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => {
      deleteKey(key);
    });

    li.appendChild(span);
    li.appendChild(deleteButton);
    listElement.appendChild(li);
  }

  function deleteKey(key) {
    chrome.storage.sync.get(["savedKeys"], (result) => {
      const savedKeys = result.savedKeys || [];
      const index = savedKeys.indexOf(key);
      if (index !== -1) {
        savedKeys.splice(index, 1);
        chrome.storage.sync.set({ savedKeys }, () => {
          renderKeyLists(savedKeys);
          showToast("Key deleted successfully!");
        });
      }
    });
  }

  function executeServiceLogic(key) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];

      chrome.scripting.executeScript(
        {
          target: { tabId: currentTab.id },
          func: (key) => localStorage.getItem(key),
          args: [key],
        },
        (results) => {
          if (!results || !results[0] || results[0].result === null) {
            showToast(`Key "${key}" not found in localStorage!`);
            return;
          }

          chrome.runtime.sendMessage(
            {
              action: "refreshPage",
              tabId: currentTab.id,
            },
            () => {
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
                        .then(() => {
                          showToast("Value copied to clipboard!");
                        })
                        .catch((err) => {
                          showToast("Clipboard copy failed!");
                        });
                    } else {
                      showToast("Key not found in localStorage!");
                    }
                  }
                );
              }, 1000);
            }
          );
        }
      );
    });
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;

    toast.style.position = "fixed";
    toast.style.top = "10px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.backgroundColor = "#333";
    toast.style.color = "#fff";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "5px";
    toast.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.3)";
    toast.style.zIndex = "1000";
    toast.style.opacity = "1";
    toast.style.transition = "opacity 0.5s, top 0.5s ease-out";

    toast.style.whiteSpace = "nowrap";
    toast.style.overflow = "hidden";
    toast.style.textOverflow = "ellipsis";

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
