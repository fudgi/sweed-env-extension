import "./styles.css";

document.addEventListener("DOMContentLoaded", () => {
  const Env = {
    dev: "dev",
    feature: "feature",
    demo: "demo",
    pilot: "pilot",
    stage: "stage",
    prod: "prod",
    prime: "prime",
    curaleaf: "curaleaf",
  };

  const EnvTheme = {
    [Env.feature]: { color: "var(--bs-info)", text: "var(--bs-black)" },
    [Env.stage]: { color: "#fd7e14", text: "var(--bs-white)" },
    [Env.dev]: { color: "#6f42c1", text: "var(--bs-white)" },
    [Env.demo]: { color: "var(--bs-warning)", text: "var(--bs-black)" },
    [Env.pilot]: { color: "var(--bs-light)", text: "var(--bs-black)" },
    [Env.prod]: { color: "var(--bs-primary)", text: "var(--bs-white)" },
    [Env.prime]: { color: "var(--bs-danger)", text: "var(--bs-white)" },
    [Env.curaleaf]: { color: "var(--bs-success)", text: "var(--bs-white)" },
  };

  const envForm = document.getElementById("env-form");
  const featureOptions = document.getElementById("feature-options");
  const portalBtn = document.getElementById("portal-btn");
  const cashierBtn = document.getElementById("cashier-btn");
  const shopBtn = document.getElementById("shop-btn");
  const kioskBtn = document.getElementById("kiosk-btn");
  const secondScreenBtn = document.getElementById("second-screen-btn");

  const idInput = document.getElementById("feature-id");
  const storeInput = document.getElementById("store-id");
  const projectInput = document.getElementById("project-name");

  const actionButtons = [
    portalBtn,
    cashierBtn,
    shopBtn,
    kioskBtn,
    secondScreenBtn,
  ];

  const updateActionButtons = () => {
    const env =
      document.querySelector('input[name="environment"]:checked')?.value ||
      Env.dev;
    const theme = EnvTheme[env] || EnvTheme[Env.dev];

    document.documentElement.style.setProperty("--theme-color", theme.color);
    document.documentElement.style.setProperty(
      "--theme-text-color",
      theme.text,
    );

    // Disable buttons if feature env and missing project/ticket
    const shouldDisable =
      env === Env.feature &&
      (!projectInput.value.trim() || !idInput.value.trim());

    actionButtons.forEach((btn) => {
      btn.disabled = shouldDisable;
    });
  };

  const saveState = () => {
    if (!chrome.storage) {
      return;
    }

    const state = {
      environment: envForm.environment.value,
      project: projectInput.value,
      id: idInput.value,
      storeId: storeInput.value,
    };
    chrome.storage.local.set({ state });
  };

  const restoreState = () => {
    if (!chrome.storage) {
      document.querySelector(
        `input[name="environment"][value="${Env.dev}"]`,
      ).checked = true;
      storeInput.value = "63";
      updateActionButtons();
      return;
    }

    chrome.storage?.local.get("state", (data) => {
      if (data.state) {
        if (data.state.environment) {
          const radio = document.querySelector(
            `input[name="environment"][value="${data.state.environment}"]`,
          );
          if (radio) radio.checked = true;
          if (data.state.environment === Env.feature) {
            featureOptions.style.display = "block";
          }
        }
        if (data.state.project) {
          projectInput.value = data.state.project;
        }
        if (data.state.id) {
          idInput.value = data.state.id;
        }
        if (data.state.storeId) {
          storeInput.value = data.state.storeId;
        }
        updateActionButtons();
      } else {
        document.querySelector(
          `input[name="environment"][value="${Env.dev}"]`,
        ).checked = true;
        storeInput.value = "63";
        updateActionButtons();
      }
    });
  };

  document.querySelectorAll('input[name="environment"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      featureOptions.style.display =
        radio.value === Env.feature ? "block" : "none";

      updateActionButtons();
      saveState();
    });
  });

  projectInput.addEventListener("input", () => {
    projectInput.classList.remove("is-invalid");
    updateActionButtons();
    saveState();
  });
  idInput.addEventListener("input", () => {
    idInput.classList.remove("is-invalid");
    updateActionButtons();
    saveState();
  });
  storeInput.addEventListener("input", saveState);

  /* --- History Management --- */
  const MAX_HISTORY_ITEMS = 50;

  const saveHistory = (url) => {
    const timestamp = new Date().toISOString();
    chrome.storage?.local.get("history", (data) => {
      let history = data.history || [];
      // Remove duplicates if any (optional, but good for UX)
      history = history.filter((item) => item.url !== url);
      // Add new item to the top
      history.unshift({ url, timestamp, title: getHistoryTitle(url) });
      // Limit size
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      chrome.storage?.local.set({ history });
      // If we are currently on the history view, re-render?
      // Or just let it update next time user clicks history.
      // But if user clicks a link from history, we might want to update the view if it stays open?
      // Usually popup closes on tab open, so it's fine.
    });
  };

  const getHistoryTitle = (url) => {
    try {
      const urlObj = new URL(url);
      // Rough heuristic to make friendly titles
      // e.g. web-ui-kiosk-feature-sweed-123.sweedpos.com -> Kiosk (Feature sweed-123)
      const host = urlObj.hostname;
      if (host.includes("web-ui-kiosk")) return `Kiosk 2.0 (${getEnvFromHost(host)})`;
      if (host.includes("web-ui-2ndscreen")) return `Second Screen (${getEnvFromHost(host)})`;
      if (host.includes("cashier")) return `Cashier (${getEnvFromHost(host)})`;
      if (host.includes("store.sweedpos.com")) return "Portal (Production)";
      
      // Default fallback
      return host;
    } catch (e) {
      return url;
    }
  };

  

  const getEnvFromHost = (host) => {
    if (host.includes("production")) return "Production";
    if (host.includes("prime")) return "Prime";
    if (host.includes("curaleaf")) return "Curaleaf";
    // feature-project-id.sweedpos.com
    const parts = host.split("-");
    if (parts.includes("feature")) {
      // Find 'feature' index and get next parts?
      // format: app-feature-project-id.sweedpos.com
      // or feature-project-id.sweedpos.com (portal)
      return "Feature";
    }
    if (host.includes("dev")) return "Dev";
    if (host.includes("stage")) return "Stage";
    if (host.includes("demo")) return "Demo";
    if (host.includes("pilot")) return "Pilot";
    return "Unknown";
  };

  const renderHistory = () => {
    const historyList = document.getElementById("history-list");
    const emptyMsg = document.getElementById("history-empty");
    const template = document.getElementById("history-item-template");

    if (!historyList || !template) return;

    chrome.storage?.local.get("history", (data) => {
      const history = data.history || [];
      historyList.innerHTML = "";

      if (history.length === 0) {
        emptyMsg.classList.remove("x-hidden");
        return;
      }
      emptyMsg.classList.add("x-hidden");

      history.forEach((item, index) => {
        const clone = template.content.cloneNode(true);
        const li = clone.querySelector(".history-item");
        const titleEl = clone.querySelector(".history-title");
        const urlEl = clone.querySelector(".history-url");
        const timeEl = clone.querySelector(".history-time");
        const deleteBtn = clone.querySelector(".history-delete-btn");
        const linkDiv = clone.querySelector(".history-link");

        titleEl.textContent = item.title || item.url;
        urlEl.textContent = item.url;
        
        // Format relative time (e.g. "Just now", "2 mins ago")
        if (item.timestamp) {
           const date = new Date(item.timestamp);
           timeEl.textContent = date.toLocaleString();
        }

        linkDiv.addEventListener("click", () => {
          openTab(item.url); // Use existing openTab which re-saves history (moves to top)
        });

        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          removeFromHistory(index);
        });

        historyList.appendChild(clone);
      });
    });
  };

  const removeFromHistory = (index) => {
    chrome.storage?.local.get("history", (data) => {
      const history = data.history || [];
      history.splice(index, 1);
      chrome.storage?.local.set({ history }, renderHistory);
    });
  };

  const clearHistoryBtn = document.getElementById("clear-history-btn");
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
      if (confirm("Clear all history?")) {
        chrome.storage?.local.set({ history: [] }, renderHistory);
      }
    });
  }

  /* --- Tab Switching --- */
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");

      // Toggle Active Class
      navBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Toggle Views
      document.getElementById("main-view").classList.add("x-hidden");
      document.getElementById("history-view").classList.add("x-hidden");

      const targetView = document.getElementById(targetId);
      if (targetView) targetView.classList.remove("x-hidden");

      // If switching to history, render it
      if (targetId === "history-view") {
        renderHistory();
      }

      // Save Last Active Tab
      const lastTab = targetId;
      chrome.storage?.local.set({ lastTab });
    });
  });

  /* --- Existing Logic Updates --- */

  const validateFeatureInputs = () => {
    const env = getSelectedEnvironment();
    if (env !== Env.feature) return true;

    let isValid = true;

    if (!idInput.value.trim()) {
      idInput.classList.add("is-invalid");
      isValid = false;
    } else {
      idInput.classList.remove("is-invalid");
    }

    if (!projectInput.value.trim()) {
      projectInput.classList.add("is-invalid");
      isValid = false;
    } else {
      projectInput.classList.remove("is-invalid");
    }

    return isValid;
  };

  const getSelectedEnvironment = () => {
    return envForm.environment.value;
  };

  const getParams = () => {
    let storeId = storeInput.value;
    if (!storeId) storeId = "63";
    return {
      project: projectInput.value,
      id: idInput.value,
      storeId: storeId,
    };
  };

  const AppPrefix = {
    shop: "web-ui",
    cashier: "cashier",
    kiosk: "web-ui-kiosk",
    secondScreen: "web-ui-2ndscreen",
  };

  const openApp = (appType) => {
    if (!validateFeatureInputs()) return;

    const env = getSelectedEnvironment();
    const { project, id, storeId } = getParams();
    const prefix = AppPrefix[appType];

    if (appType === "cashier") {
      if (env === Env.prod) {
        openTab(`https://${prefix}.sweedpos.com/`);
      } else if (env === Env.feature) {
        openTab(
          `https://${prefix}-${env}-${project}-${id}.sweedpos.com/logout`,
        );
      } else if (env === Env.prime || env === Env.curaleaf) {
        openTab(`https://${prefix}-${env}.sweedpos.com/logout`);
      } else {
        openTab(`https://${prefix}-${env}.sweedpos.com/`);
      }
      return;
    }

    if (env === Env.feature) {
      openTab(
        `https://${prefix}-${env}-${project}-${id}.sweedpos.com/s${storeId}`,
      );
    } else if (env === Env.prod) {
      openTab(`https://${prefix}-production.sweedpos.com/s${storeId}`);
    } else if (env === Env.pilot) {
      openTab(
        `https://${prefix}-${env}.sweedpos.com/s${storeId}${
          appType === "kiosk" ? "/welcome" : ""
        }`,
      );
    } else if (env === Env.prime || env === Env.curaleaf) {
      openTab(`https://${prefix}-${env}.sweedpos.com/s${storeId}`);
    } else {
      openTab(`https://${prefix}-${env}.sweedpos.com/s${storeId}`);
    }
  };

  portalBtn.addEventListener("click", () => {
    if (!validateFeatureInputs()) return;

    const env = getSelectedEnvironment();
    const { project, id } = getParams();
    if (env === Env.feature) {
      openTab(`https://${env}-${project}-${id}.sweedpos.com`);
    } else if (env === Env.prod) {
      openTab(`https://store.sweedpos.com`);
    } else {
      openTab(`https://${env}.sweedpos.com`);
    }
  });

  shopBtn.addEventListener("click", () => openApp("shop"));
  cashierBtn.addEventListener("click", () => openApp("cashier"));
  kioskBtn.addEventListener("click", () => openApp("kiosk"));
  secondScreenBtn.addEventListener("click", () => openApp("secondScreen"));

  const openTab = (url) => {
    console.log(url);
    saveHistory(url);
    chrome.tabs.create({ url });
  };

  // Restore active tab
  const restoreLastTab = () => {
    chrome.storage?.local.get("lastTab", (data) => {
      if (data.lastTab) {
        const targetBtn = document.querySelector(
          `.nav-btn[data-target="${data.lastTab}"]`,
        );
        if (targetBtn) {
          targetBtn.click();
        }
      }
    });
  };

  // Restore State needs to ensure Main tab is visible by default? It is by HTML default structure.
  restoreState();
  restoreLastTab();
});
