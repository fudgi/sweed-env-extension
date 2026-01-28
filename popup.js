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
        updateActionButtons();
        if (data.state.project) {
          projectInput.value = data.state.project;
        }
        if (data.state.id) {
          idInput.value = data.state.id;
        }
        if (data.state.storeId) {
          storeInput.value = data.state.storeId;
        }
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

  projectInput.addEventListener("input", saveState);
  idInput.addEventListener("input", saveState);
  storeInput.addEventListener("input", saveState);

  const openTab = (url) => {
    console.log(url);
    chrome.tabs.create({ url });
  };

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

  // Clear validation on input
  idInput.addEventListener("input", () => {
    idInput.classList.remove("is-invalid");
  });
  projectInput.addEventListener("input", () => {
    projectInput.classList.remove("is-invalid");
  });

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
  restoreState();
});
