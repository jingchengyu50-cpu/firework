/*
Modified by Jingcheng for personal customized fireworks page.
Copyright © 2022 NianBroken. All rights reserved.
Github：https://github.com/NianBroken/Firework_Simulator
Gitee：https://gitee.com/nianbroken/Firework_Simulator
本项目采用 Apache-2.0 许可证
简而言之，你可以自由使用、修改和分享本项目的代码，但前提是在其衍生作品中必须保留原始许可证和版权信息，并且必须以相同的许可证发布所有修改过的代码。
*/

"use strict";

const appConfig = window.FireworksAppConfig;
const { createDefaultState, createStore } = window.FireworksAppStore;
const { createBackgroundManager } = window.FireworksBackgroundManager;
const { queryNodes, applyOverlayText, scheduleOverlayFade, renderControls, bindMinimalControls } = window.FireworksMinimalUI;
const fireworksPerformance = window.FireworksPerformance;
const { createSkyBackground } = window.FireworksSkyBackground;

const IS_MOBILE = FireworksMobile.isMobileDevice();
const IS_DESKTOP = !IS_MOBILE && window.innerWidth > 800;
const IS_HEADER = false;
const IS_HIGH_END_DEVICE = (() => {
	const hardwareConcurrency = navigator.hardwareConcurrency;
	if (!hardwareConcurrency) {
		return false;
	}

	const minimumCoreCount = window.innerWidth <= 1024 ? 4 : 8;
	return hardwareConcurrency >= minimumCoreCount;
})();

const MAX_WIDTH = 7680;
const MAX_HEIGHT = 4320;
const GRAVITY = 0.9;

const QUALITY_LOW = appConfig.qualityLevels.low;
const QUALITY_NORMAL = appConfig.qualityLevels.normal;
const QUALITY_HIGH = appConfig.qualityLevels.high;

const SKY_LIGHT_NONE = appConfig.skyLightingModes.none;
const SKY_LIGHT_DIM = appConfig.skyLightingModes.dim;
const SKY_LIGHT_NORMAL = appConfig.skyLightingModes.normal;

/* 高级配色：金、银白、冰蓝、紫、玫瑰金、青绿 */
const COLOR = {
	Gold: "#ffd878",
	White: "#e8eef8",
	Blue: "#78c8f0",
	Purple: "#a878e8",
	RoseGold: "#e8a090",
	Teal: "#68d8c0",
};

const INVISIBLE = "_INVISIBLE_";
const PI_2 = Math.PI * 2;
const PI_HALF = Math.PI * 0.5;

const BASE_SKY_COLOR = { r: 5, g: 7, b: 20 };

const COLOR_CODES = Object.values(COLOR);
const COLOR_CODES_W_INVIS = [...COLOR_CODES, INVISIBLE];
const COLOR_TUPLES = COLOR_CODES.reduce((tuples, colorCode) => {
	tuples[colorCode] = {
		r: Number.parseInt(colorCode.slice(1, 3), 16),
		g: Number.parseInt(colorCode.slice(3, 5), 16),
		b: Number.parseInt(colorCode.slice(5, 7), 16),
	};
	return tuples;
}, {});

function getDefaultScaleFactor() {
	if (IS_MOBILE) {
		return 1;
	}
	return 0.9;
}

var runtimeContext = {
	isDesktop: IS_DESKTOP,
	isHeader: IS_HEADER,
	isMobile: IS_MOBILE,
	isLowPerf: fireworksPerformance.isLowPerf,
	isHighEndDevice: IS_HIGH_END_DEVICE,
	defaultScaleFactor: getDefaultScaleFactor(),
	fullscreen: false,
};

const appNodes = queryNodes();
const store = createStore(createDefaultState(runtimeContext), runtimeContext, !IS_HEADER);

let simSpeed = 1;
let stageW;
let stageH;
let quality = 1;
let isLowQuality = false;
let isNormalQuality = false;
let isHighQuality = false;
let pausedByVisibility = false;

const trailsStage = new Stage("trails-canvas");
const mainStage = new Stage("main-canvas");
const stages = [trailsStage, mainStage];

const randomWords = appConfig.defaultWords.slice();
const wordDotCache = new Map();

const skyBackground = createSkyBackground({
	canvas: appNodes.skyCanvas,
});

const backgroundManager = createBackgroundManager({
	container: appNodes.canvasContainer,
	onStatusChange() {},
});

const wordBurstTracker = {
	shellsSinceLastBurst: 0,
	forceNextBurst: false,
	reset() {
		this.shellsSinceLastBurst = 0;
		this.forceNextBurst = false;
	},
	queueBurst() {
		this.forceNextBurst = true;
	},
	shouldCreateBurst(shell) {
		if (!store.state.config.wordShell || shell.disableWord || !shell.comet) {
			return false;
		}

		if (shell.forceWordBurst || this.forceNextBurst) {
			this.reset();
			return true;
		}

		this.shellsSinceLastBurst += 1;
		if (this.shellsSinceLastBurst >= appConfig.wordBurstInterval) {
			this.shellsSinceLastBurst = 0;
			return true;
		}

		return false;
	},
};

function togglePause(toggle) {
	const nextValue = typeof toggle === "boolean" ? toggle : !store.state.paused;
	if (store.state.paused !== nextValue) {
		store.setState({ paused: nextValue });
	}
}

function toggleSound(toggle) {
	if (!soundManager.isSupported()) {
		return;
	}

	const nextValue = typeof toggle === "boolean" ? toggle : !store.state.soundEnabled;

	if (nextValue) {
		soundManager.enable().then((ok) => {
			if (!ok) {
				return;
			}
			store.setState({ soundEnabled: true });
			soundManager.resumeAll();
		});
		return;
	}

	soundManager.disable();
	store.setState({ soundEnabled: false });
}

function toggleAutoLaunch(toggle) {
	const nextValue = typeof toggle === "boolean" ? toggle : !store.state.config.autoLaunch;
	updateConfig({ autoLaunch: nextValue });
}

function updateConfig(nextConfig) {
	nextConfig = nextConfig || {};
	const previousConfig = store.state.config;
	const mergedConfig = { ...previousConfig, ...nextConfig };
	const includesWordShellUpdate = Object.prototype.hasOwnProperty.call(nextConfig, "wordShell");

	if (includesWordShellUpdate) {
		mergedConfig.wordShellConfigured = true;
	}

	if (!previousConfig.wordShell && mergedConfig.wordShell) {
		wordBurstTracker.queueBurst();
	} else if (previousConfig.wordShell && !mergedConfig.wordShell) {
		wordBurstTracker.reset();
	}

	store.setState({ config: mergedConfig });
	configDidUpdate();
}

function configDidUpdate() {
	quality = qualitySelector();
	isLowQuality = quality === QUALITY_LOW;
	isNormalQuality = quality === QUALITY_NORMAL;
	isHighQuality = quality === QUALITY_HIGH;

	if (skyLightingSelector() === SKY_LIGHT_NONE) {
		appNodes.canvasContainer.style.backgroundColor = `rgb(${BASE_SKY_COLOR.r}, ${BASE_SKY_COLOR.g}, ${BASE_SKY_COLOR.b})`;
	}

	Spark.drawWidth = isHighQuality && !fireworksPerformance.isLowPerf ? 0.75 : 1;
}

const isRunning = (state = store.state) => !state.paused;
const soundEnabledSelector = (state = store.state) => state.soundEnabled;
const canPlaySoundSelector = (state = store.state) => isRunning(state) && soundEnabledSelector(state);
const qualitySelector = () => Number(store.state.config.quality);
const shellNameSelector = () => store.state.config.shell;
const shellSizeSelector = () => Number(store.state.config.size);
const finaleSelector = () => store.state.config.finale;
const skyLightingSelector = () => Number(store.state.config.skyLighting);
const scaleFactorSelector = () => store.state.config.scaleFactor;

function handleStateChange(state, previousState) {
	renderControls(state, appNodes, soundManager.isSupported());

	const currentCanPlaySound = canPlaySoundSelector(state);
	const previousCanPlaySound = canPlaySoundSelector(previousState);
	if (currentCanPlaySound === previousCanPlaySound) {
		return;
	}

	if (currentCanPlaySound) {
		soundManager.resumeAll();
		return;
	}

	soundManager.pauseAll();
}

function getCodeDefaultBackground() {
	const defaultBackground = appConfig.defaultBackground || {};
	const value = typeof defaultBackground.value === "string" ? defaultBackground.value.trim() : "";

	if (!value) {
		return {
			mode: "none",
			value: "",
			configured: false,
		};
	}

	return {
		mode: defaultBackground.mode === "style" ? "style" : "image",
		value,
		configured: false,
	};
}

function applyResolvedBackground() {
	const codeDefaultBackground = getCodeDefaultBackground();
	if (!codeDefaultBackground.value) {
		backgroundManager.clearBackground();
		appNodes.canvasContainer.style.backgroundColor = `rgb(${BASE_SKY_COLOR.r}, ${BASE_SKY_COLOR.g}, ${BASE_SKY_COLOR.b})`;
		return;
	}

	backgroundManager.applyBackground(codeDefaultBackground);
}

function clearFireworks() {
	fireworksPerformance.clearAllParticles();
	trailsStage.ctx.setTransform(1, 0, 0, 1, 0, 0);
	trailsStage.ctx.clearRect(0, 0, trailsStage.canvas.width, trailsStage.canvas.height);
	mainStage.ctx.setTransform(1, 0, 0, 1, 0, 0);
	mainStage.ctx.clearRect(0, 0, mainStage.canvas.width, mainStage.canvas.height);
}

document.addEventListener("visibilitychange", () => {
	soundManager.setPageHidden(document.hidden);

	if (document.hidden) {
		Ticker.pause();
		if (isRunning()) {
			pausedByVisibility = true;
			togglePause(true);
		}
		return;
	}

	Ticker.resume();
	if (pausedByVisibility) {
		pausedByVisibility = false;
		togglePause(false);
	}
});

bindMinimalControls({
	nodes: appNodes,
	onClear: clearFireworks,
	onToggleAuto: function onToggleAuto() {
		toggleAutoLaunch();
	},
	onToggleSound: function onToggleSound() {
		toggleSound();
	},
});
