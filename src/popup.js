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

   const AppPrefix = {
    shop: "web-ui",
    cashier: "cashier",
    kiosk: "web-ui-kiosk",
    secondScreen: "web-ui-2ndscreen",
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

  let storeIdByEnv = {};

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

    const featureMissing =
      env === Env.feature &&
      (!projectInput.value.trim() || !idInput.value.trim());
    const storeIdMissing = !storeInput.value.trim();

    portalBtn.disabled = featureMissing;
    cashierBtn.disabled = featureMissing;
    shopBtn.disabled = featureMissing || storeIdMissing;
    kioskBtn.disabled = featureMissing || storeIdMissing;
    secondScreenBtn.disabled = featureMissing || storeIdMissing;
  };

  const saveState = () => {
    if (!chrome.storage) {
      return;
    }

    const env = envForm.environment.value;
    storeIdByEnv[env] = storeInput.value;
    const state = {
      environment: env,
      project: projectInput.value,
      id: idInput.value,
      storeId: storeIdByEnv,
    };
    chrome.storage.local.set({ state });
  };

  const restoreState = () => {
    if (!chrome.storage) {
      document.querySelector(
        `input[name="environment"][value="${Env.dev}"]`,
      ).checked = true;
      updateActionButtons();
      return;
    }

    chrome.storage?.local.get("state", (data) => {
      const stored = data.state?.storeId;
      storeIdByEnv =
        stored && typeof stored === "object" && !Array.isArray(stored)
          ? stored
          : {};

      if (data.state) {
        const env = data.state.environment;
        if (env) {
          const radio = document.querySelector(
            `input[name="environment"][value="${env}"]`,
          );
          if (radio) radio.checked = true;
          if (env === Env.feature) {
            featureOptions.style.display = "block";
          }
          storeInput.value = storeIdByEnv[env] ?? "";
        }
        if (data.state.project) {
          projectInput.value = data.state.project;
        }
        if (data.state.id) {
          idInput.value = data.state.id;
        }
        updateActionButtons();
      } else {
        document.querySelector(
          `input[name="environment"][value="${Env.dev}"]`,
        ).checked = true;
        updateActionButtons();
      }
    });
  };

  document.querySelectorAll('input[name="environment"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      featureOptions.style.display =
        radio.value === Env.feature ? "block" : "none";

      storeInput.value = storeIdByEnv[radio.value] ?? "";

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
  storeInput.addEventListener("input", () => {
    updateActionButtons();
    saveState();
  });

  /* --- History Management --- */
  const MAX_HISTORY_ITEMS = 50;

  const saveHistory = (url, context = {}) => {
    const timestamp = new Date().toISOString();
    chrome.storage?.local.get("history", (data) => {
      let history = data.history || [];
      // Remove duplicates if any (optional, but good for UX)
      history = history.filter((item) => item.url !== url);
      // Add new item to the top (favourite: false by default)
      history.unshift({
        url,
        timestamp,
        title: getHistoryTitle(url, context),
        context,
        favourite: false,
      });
      // Limit size
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      chrome.storage?.local.set({ history });
    });
  };

  const toggleFavourite = (item) => {
    chrome.storage?.local.get("history", (data) => {
      const history = data.history || [];
      const index = history.findIndex(
        (h) => h.url === item.url && h.timestamp === item.timestamp,
      );
      if (index === -1) return;
      history[index].favourite = !history[index].favourite;
      chrome.storage?.local.set({ history }, renderHistory);
    });
  };

  const sortHistoryWithFavouritesFirst = (history) => {
    return [...history].sort((a, b) => {
      const aFav = Boolean(a.favourite);
      const bFav = Boolean(b.favourite);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  };

  const getHistoryTitle = (url, context) => {
    if (context && context.appType) {
      const envName = context.env.toUpperCase();
      let details = "";

      if (context.env === Env.feature) {
        details = `${envName} ${context.project}-${context.id}`;
      } else {
        details = envName;
      }

      switch (context.appType) {
        case "portal":
          return `Portal (${details})`;
        case "shop":
          return `Shop (${details})`;
        case "cashier":
          return `Cashier (${details})`;
        case "kiosk":
          return `Kiosk 2.0 (${details})`;
        case "secondScreen":
          return `Second Screen (${details})`;
        default:
          return `${context.appType} (${details})`;
      }
    }

    try {
      const urlObj = new URL(url);
      const host = urlObj.hostname;
      if (host.includes("web-ui-kiosk"))
        return `Kiosk 2.0 (${getEnvFromHost(host)})`;
      if (host.includes("web-ui-2ndscreen"))
        return `Second Screen (${getEnvFromHost(host)})`;
      if (host.includes("cashier")) return `Cashier (${getEnvFromHost(host)})`;
      if (host.includes("store.sweedpos.com")) return "Portal (Production)";

      return host;
    } catch (e) {
      return url;
    }
  };

  const getEnvFromHost = (host) => {
    if (host.includes("production")) return "Production";
    if (host.includes("prime")) return "Prime";
    if (host.includes("curaleaf")) return "Curaleaf";
    const parts = host.split("-");
    if (parts.includes("feature")) {
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
      const rawHistory = data.history || [];
      const history = sortHistoryWithFavouritesFirst(rawHistory);
      historyList.innerHTML = "";

      if (history.length === 0) {
        emptyMsg.classList.remove("x-hidden");
        return;
      }
      emptyMsg.classList.add("x-hidden");

      history.forEach((item) => {
        const clone = template.content.cloneNode(true);
        const titleEl = clone.querySelector(".history-title");
        const urlEl = clone.querySelector(".history-url");
        const timeEl = clone.querySelector(".history-time");
        const deleteBtn = clone.querySelector(".history-delete-btn");
        const favouriteBtn = clone.querySelector(".history-favourite-btn");
        const favouriteIcon = clone.querySelector(".history-favourite-icon");
        const linkDiv = clone.querySelector(".history-link");

        titleEl.textContent = item.title || item.url;

        // Enhance description with store ID if available
        let desc = item.url;
        if (item.context && item.context.storeId) {
          desc = `Store: ${item.context.storeId} • ${item.url}`;
        }
        urlEl.textContent = desc;

        // Colorize based on environment
        if (item.context && item.context.env) {
          const theme = EnvTheme[item.context.env] || EnvTheme[Env.dev];
          const li = clone.querySelector("li");
          if (li) {
            li.style.borderLeft = `4px solid ${theme.color}`;
            li.style.color = theme.color;
          }
        }

        if (item.timestamp) {
          const date = new Date(item.timestamp);
          timeEl.textContent = date.toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        // Favourite button: star filled when favourite, outline when not
        const isFavourite = Boolean(item.favourite);
        favouriteIcon.textContent = isFavourite ? "★" : "☆";
        favouriteBtn.classList.toggle("text-warning", isFavourite);
        favouriteBtn.classList.toggle("text-secondary", !isFavourite);

        favouriteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFavourite(item);
        });

        linkDiv.addEventListener("click", () => {
          openTab(item.url, item.context);
        });

        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          removeFromHistory(item);
        });

        historyList.appendChild(clone);
      });
    });
  };

  const removeFromHistory = (item) => {
    chrome.storage?.local.get("history", (data) => {
      const history = data.history || [];
      const index = history.findIndex(
        (h) => h.url === item.url && h.timestamp === item.timestamp,
      );
      if (index === -1) return;
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
    return {
      project: projectInput.value,
      id: idInput.value,
      storeId: storeInput.value,
    };
  };

  const openApp = (appType) => {
    if (!validateFeatureInputs()) return;

    const env = getSelectedEnvironment();
    const { project, id, storeId } = getParams();
    const prefix = AppPrefix[appType];

    const context = {
      appType,
      env,
      project,
      id,
      storeId,
    };

    let url = "";

    if (appType === "cashier") {
      if (env === Env.prod) {
        url = `https://${prefix}.sweedpos.com/`;
      } else if (env === Env.feature) {
        url = `https://${prefix}-${env}-${project}-${id}.sweedpos.com/logout`;
      } else if (env === Env.prime || env === Env.curaleaf) {
        url = `https://${prefix}-${env}.sweedpos.com/logout`;
      } else {
        url = `https://${prefix}-${env}.sweedpos.com/`;
      }
      openTab(url, context);
      return;
    }

    if (env === Env.feature) {
      url = `https://${prefix}-${env}-${project}-${id}.sweedpos.com/s${storeId}`;
    } else if (env === Env.prod) {
      url = `https://${prefix}-production.sweedpos.com/s${storeId}`;
    } else if (env === Env.pilot) {
      url = `https://${prefix}-${env}.sweedpos.com/s${storeId}${
        appType === "kiosk" ? "/welcome" : ""
      }`;
    } else if (env === Env.prime || env === Env.curaleaf) {
      url = `https://${prefix}-${env}.sweedpos.com/s${storeId}`;
    } else {
      url = `https://${prefix}-${env}.sweedpos.com/s${storeId}`;
    }

    openTab(url, context);
  };

  portalBtn.addEventListener("click", () => {
    if (!validateFeatureInputs()) return;

    const env = getSelectedEnvironment();
    const { project, id, storeId } = getParams();
    
    // Portal falls back to store 63 if not specified, but here we just need params for context
    const context = {
      appType: "portal",
      env,
      project,
      id,
      storeId
    };

    let url = "";
    if (env === Env.feature) {
      url = `https://${env}-${project}-${id}.sweedpos.com`;
    } else if (env === Env.prod) {
      url = `https://store.sweedpos.com`;
    } else {
      url = `https://${env}.sweedpos.com`;
    }
    openTab(url, context);
  });

  shopBtn.addEventListener("click", () => openApp("shop"));
  cashierBtn.addEventListener("click", () => openApp("cashier"));
  kioskBtn.addEventListener("click", () => openApp("kiosk"));
  secondScreenBtn.addEventListener("click", () => openApp("secondScreen"));

  const openTab = (url, context) => {
    saveHistory(url, context);
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
