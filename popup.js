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

  const envForm = document.getElementById("env-form");
  const featureOptions = document.getElementById("feature-options");
  const portalBtn = document.getElementById("portal-btn");
  const cashierBtn = document.getElementById("cashier-btn");
  const shopBtn = document.getElementById("shop-btn");
  const kioskBtn = document.getElementById("kiosk-btn");
  const secondScreenBtn = document.getElementById("second-screen-btn");
  const idInput = document.getElementById("feature-id");
  const storeInput = document.getElementById("store-id");


  const saveState = () => {
    if (!chrome.storage) {
      return;
    }

    const state = {
      environment: envForm.environment.value,
      project: envForm.project ? envForm.project.value : null,
      id: idInput.value,
      storeId: storeInput.value,
    };
    chrome.storage.local.set({ state });
  };

  const restoreState = () => {
    if (!chrome.storage) {
      document.querySelector(
        `input[name="environment"][value="${Env.dev}"]`
      ).checked = true;
      storeInput.value = "63";
      return;
    }

    chrome.storage?.local.get("state", (data) => {
      if (data.state) {
        if (data.state.environment) {
          const radio = document.querySelector(
            `input[name="environment"][value="${data.state.environment}"]`
          );
          if (radio) radio.checked = true;
          if (data.state.environment === Env.feature) {
            featureOptions.style.display = "block";
          }
        }
        if (data.state.project) {
          const projectRadio = document.querySelector(
            `input[name="project"][value="${data.state.project}"]`
          );
          if (projectRadio) projectRadio.checked = true;
        }
        if (data.state.id) {
          idInput.value = data.state.id;
        }
        if (data.state.storeId) {
          storeInput.value = data.state.storeId;
        }
      } else {
        document.querySelector(
          `input[name="environment"][value="${Env.dev}"]`
        ).checked = true;
        storeInput.value = "63";
      }
    });
  };

  document.querySelectorAll('input[name="environment"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      featureOptions.style.display =
        radio.value === Env.feature ? "block" : "none";

      saveState();
    });
  });

  document.querySelectorAll('input[name="project"]').forEach((radio) => {
    radio.addEventListener("change", saveState);
  });

  idInput.addEventListener("input", saveState);
  storeInput.addEventListener("input", saveState);

  const openTab = (url) => {
    console.log(url);
    chrome.tabs.create({ url });
  };

  const getSelectedEnvironment = () => {
    return envForm.environment.value;
  };

  const getParams = () => {
    let storeId = storeInput.value;
    if (!storeId) storeId = "63";
    return {
      project: envForm.project ? envForm.project.value : null,
      id: idInput.value,
      storeId: storeId,
    };
  };

  const AppPrefix = {
    shop: "web-ui",
    cashier: "cashier-v2",
    kiosk: "kiosk",
    secondScreen: "second-screen",
  };

  const openApp = (appType) => {
    const env = getSelectedEnvironment();
    const { project, id, storeId } = getParams();
    const prefix = AppPrefix[appType];

    if (env === Env.feature) {
      openTab(`https://${prefix}-${env}-${project}-${id}.sweedpos.com/s${storeId}`);
    } else if (env === Env.prod) {
      openTab(`https://${prefix}-production.sweedpos.com/s${storeId}`);
    } else if (env === Env.prime || env === Env.curaleaf) {
      openTab(`https://${prefix}-${env}.sweedpos.com/s${storeId}`);
    } else {
      openTab(`https://${prefix}-${env}.sweedpos.com/s${storeId}`);
    }
  };

  portalBtn.addEventListener("click", () => {
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
