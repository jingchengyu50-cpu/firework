/*
Modified by Jingcheng for personal customized fireworks page.
Mobile-first configuration
*/

"use strict";

(function initFireworksAppConfig(global) {
	var config = {
		storageKey: "jc_fireworks_data",
		storageVersion: "1.1",

		overlay: Object.freeze({
			title: "今晚的烟花，只为你点亮。",
			hint: "点击夜空，放一束烟花",
			fadeDelayMs: 3000,
			fadeDurationMs: 1800,
		}),

		/* 手机端性能参数 —— 主要调这里 */
		mobile: Object.freeze({
			maxStars: 700,
			maxSparks: 900,
			maxShells: 6,
			clickCooldown: 280,
			autoFireInterval: 1600,
			maxDpr: 2,
			defaultQuality: 2,
			lowPowerQuality: 1,
			enableLongExposure: false,
			enableFinale: false,
		}),

		performance: Object.freeze({
			maxStars: 800,
			maxSparks: 1200,
			maxActiveShells: 8,
			clickThrottleMs: 250,
			autoLaunchMinIntervalMs: 1200,
			autoLaunchDelayMultiplier: 2.8,
		}),

		audio: Object.freeze({
			masterVolume: 0.25,
			launchVolume: 0.08,
			explosionVolume: 0.18,
			autoVolumeScale: 0.55,
			maxConcurrentSounds: 4,
		}),

		defaultWords: Object.freeze([]),
		wordFontFamily: "PingFang SC, sans-serif",
		wordPointDensity: 3,
		wordFontSizeMin: 60,
		wordFontSizeMax: 130,
		wordBurstInterval: 5,

		defaultBackground: Object.freeze({
			mode: "style",
			value:
				"radial-gradient(ellipse 80% 50% at 50% 18%, rgba(45, 55, 110, 0.32) 0%, transparent 58%), " +
				"radial-gradient(ellipse 55% 38% at 78% 58%, rgba(35, 48, 95, 0.18) 0%, transparent 52%), " +
				"radial-gradient(ellipse 48% 32% at 18% 42%, rgba(55, 38, 85, 0.14) 0%, transparent 48%), " +
				"linear-gradient(180deg, #050714 0%, #070b1a 38%, #0a1024 68%, #050714 100%)",
		}),

		qualityLevels: Object.freeze({
			low: 1,
			normal: 2,
			high: 3,
		}),
		skyLightingModes: Object.freeze({
			none: 0,
			dim: 1,
			normal: 2,
		}),
		scaleFactorOptions: Object.freeze([0.75, 0.9, 1.0]),

		selectors: Object.freeze({
			stageContainer: ".stage-container",
			canvasContainer: ".canvas-container",
			skyCanvas: "#sky-canvas",
			heroOverlay: "#hero-overlay",
			btnClear: "#btn-clear",
			btnAuto: "#btn-auto",
			btnSound: "#btn-sound",
			copyrightYear: ".copyright-year",
		}),
	};

	global.FireworksAppConfig = Object.freeze(config);
})(window);
