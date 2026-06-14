/*
Modified by Jingcheng for personal customized fireworks page.
Mobile-first defaults + safe localStorage
*/

"use strict";

(function initFireworksAppStore(global) {
	var appConfig = global.FireworksAppConfig;
	var mobileCfg = appConfig.mobile;
	var qualityValues = new Set(Object.values(appConfig.qualityLevels).map(String));
	var skyLightingValues = new Set(Object.values(appConfig.skyLightingModes).map(String));
	var scaleFactorValues = new Set(appConfig.scaleFactorOptions.map(function mapScale(value) {
		return value.toFixed(2);
	}));
	var shellSizeValues = new Set(["0", "1", "2", "3", "4", "5"]);
	var legacyStorageKey = "schemaVersion";

	function isObject(value) {
		return value !== null && typeof value === "object" && !Array.isArray(value);
	}

	function asBoolean(value, fallback) {
		return typeof value === "boolean" ? value : fallback;
	}

	function asString(value, fallback) {
		return typeof value === "string" && value.trim() ? value : fallback;
	}

	function asAllowedString(value, allowedValues, fallback) {
		return allowedValues.has(String(value)) ? String(value) : fallback;
	}

	function asScaleFactor(value, fallback) {
		var parsed = Number(value);
		if (!Number.isFinite(parsed)) {
			return fallback;
		}
		var normalizedValue = parsed.toFixed(2);
		return scaleFactorValues.has(normalizedValue) ? parsed : fallback;
	}

	function normalizeBackground(rawBackground, fallbackBackground, inferConfiguredFromValue) {
		var fallback = fallbackBackground || {
			mode: "none",
			value: "",
			configured: false,
		};

		if (!isObject(rawBackground)) {
			return Object.assign({}, fallback);
		}

		var value = typeof rawBackground.value === "string" ? rawBackground.value.trim() : "";
		if (!value) {
			return { mode: "none", value: "", configured: false };
		}

		return {
			mode: rawBackground.mode === "style" ? "style" : "image",
			value: value,
			configured:
				typeof rawBackground.configured === "boolean" ? rawBackground.configured : inferConfiguredFromValue,
		};
	}

	function buildDefaultConfig(runtime) {
		var defaultShellSize = "1";
		var qualityLevel = String(mobileCfg.defaultQuality);

		if (runtime.isMobile && runtime.isLowPerf) {
			qualityLevel = String(mobileCfg.lowPowerQuality);
		} else if (!runtime.isMobile) {
			defaultShellSize = "2";
			qualityLevel = String(appConfig.qualityLevels.normal);
		}

		return {
			quality: qualityLevel,
			shell: "Random",
			size: defaultShellSize,
			wordShell: false,
			wordShellConfigured: false,
			autoLaunch: true,
			finale: runtime.isMobile ? mobileCfg.enableFinale : false,
			skyLighting: String(appConfig.skyLightingModes.dim),
			hideControls: false,
			longExposure: runtime.isMobile ? mobileCfg.enableLongExposure : false,
			scaleFactor: runtime.defaultScaleFactor,
		};
	}

	function normalizeConfig(rawConfig, defaultConfig, runtime) {
		var config = isObject(rawConfig) ? rawConfig : {};
		var normalized = {
			quality: asAllowedString(config.quality, qualityValues, defaultConfig.quality),
			shell: asString(config.shell, defaultConfig.shell),
			size: asAllowedString(config.size, shellSizeValues, defaultConfig.size),
			wordShell: asBoolean(config.wordShell, defaultConfig.wordShell),
			wordShellConfigured: asBoolean(config.wordShellConfigured, defaultConfig.wordShellConfigured),
			autoLaunch: asBoolean(config.autoLaunch, defaultConfig.autoLaunch),
			finale: asBoolean(config.finale, defaultConfig.finale),
			skyLighting: asAllowedString(config.skyLighting, skyLightingValues, defaultConfig.skyLighting),
			hideControls: asBoolean(config.hideControls, defaultConfig.hideControls),
			longExposure: asBoolean(config.longExposure, defaultConfig.longExposure),
			scaleFactor: asScaleFactor(config.scaleFactor, defaultConfig.scaleFactor),
		};

		if (runtime && runtime.isMobile) {
			normalized.finale = mobileCfg.enableFinale;
			normalized.longExposure = mobileCfg.enableLongExposure;
			if (Number(normalized.quality) > appConfig.qualityLevels.normal) {
				normalized.quality = String(appConfig.qualityLevels.normal);
			}
		}

		return normalized;
	}

	function normalizeLegacyWordShellConfig(rawConfig, defaultConfig, runtime) {
		var next = normalizeConfig(rawConfig, defaultConfig, runtime);
		next.wordShell = false;
		next.wordShellConfigured = false;
		return next;
	}

	function createDefaultState(runtime) {
		return {
			paused: true,
			menuOpen: false,
			openHelpTopic: null,
			fullscreen: false,
			config: buildDefaultConfig(runtime),
			background: {
				mode: "none",
				value: "",
				configured: false,
			},
		};
	}

	function readLegacyState(defaultState) {
		try {
			if (localStorage.getItem(legacyStorageKey) !== "1") {
				return defaultState;
			}
		} catch (error) {
			return defaultState;
		}

		var nextState = {
			paused: defaultState.paused,
			menuOpen: defaultState.menuOpen,
			openHelpTopic: defaultState.openHelpTopic,
			fullscreen: defaultState.fullscreen,
			config: Object.assign({}, defaultState.config),
			background: Object.assign({}, defaultState.background),
		};

		try {
			var rawSize = localStorage.getItem("configSize");
			var parsedSize = typeof rawSize === "string" ? JSON.parse(rawSize) : null;
			var sizeValue = String(parseInt(parsedSize, 10));
			if (shellSizeValues.has(sizeValue)) {
				nextState.config.size = sizeValue;
			}
		} catch (error) {
			try {
				localStorage.removeItem("configSize");
			} catch (removeError) {
				// ignore
			}
		}

		return nextState;
	}

	function readStoredState(defaultState, runtime) {
		var serializedData = null;
		try {
			serializedData = localStorage.getItem(appConfig.storageKey);
		} catch (error) {
			return readLegacyState(defaultState);
		}

		if (!serializedData) {
			return readLegacyState(defaultState);
		}

		try {
			var parsedState = JSON.parse(serializedData);
			if (!isObject(parsedState) || !isObject(parsedState.data)) {
				throw new Error("invalid storage");
			}

			if (parsedState.schemaVersion === appConfig.storageVersion || parsedState.schemaVersion === "1.0") {
				return {
					paused: defaultState.paused,
					menuOpen: false,
					openHelpTopic: null,
					fullscreen: false,
					config: normalizeConfig(parsedState.data.config, defaultState.config, runtime),
					background: normalizeBackground(parsedState.data.background, defaultState.background),
				};
			}
		} catch (error) {
			try {
				localStorage.removeItem(appConfig.storageKey);
			} catch (removeError) {
				// ignore
			}
		}

		return readLegacyState(defaultState);
	}

	function persistState(state) {
		try {
			localStorage.setItem(
				appConfig.storageKey,
				JSON.stringify({
					schemaVersion: appConfig.storageVersion,
					data: {
						config: state.config,
						background: state.background,
					},
				})
			);
		} catch (error) {
			// 微信 / 隐私模式下 localStorage 可能不可用
		}
	}

	function createStore(defaultState, runtime, shouldLoad) {
		var initialState = shouldLoad ? readStoredState(defaultState, runtime) : defaultState;
		var listeners = new Set();

		return {
			state: initialState,
			setState: function setState(nextState) {
				var prevState = this.state;
				this.state = Object.assign({}, this.state, nextState);
				listeners.forEach(function notify(listener) {
					listener(this.state, prevState);
				}, this);
				persistState(this.state);
			},
			subscribe: function subscribe(listener) {
				listeners.add(listener);
				return function unsubscribe() {
					listeners.delete(listener);
				};
			},
		};
	}

	global.FireworksAppStore = Object.freeze({
		createDefaultState: createDefaultState,
		createStore: createStore,
		normalizeBackground: normalizeBackground,
		normalizeConfig: normalizeConfig,
	});
})(window);
