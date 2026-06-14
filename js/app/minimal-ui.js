/*
Modified by Jingcheng for personal customized fireworks page.
Based on Firework_Simulator by NianBroken (Apache-2.0).
*/

"use strict";

(function initFireworksMinimalUI(global) {
	const appConfig = global.FireworksAppConfig;

	function queryNodes() {
		return Object.keys(appConfig.selectors).reduce((nodes, key) => {
			const node = document.querySelector(appConfig.selectors[key]);
			if (!node) {
				throw new Error(`未找到界面节点: ${appConfig.selectors[key]}`);
			}
			nodes[key] = node;
			return nodes;
		}, {});
	}

	function applyOverlayText(nodes) {
		const titleNode = nodes.heroOverlay.querySelector(".hero-title");
		const hintNode = nodes.heroOverlay.querySelector(".hero-hint");
		if (titleNode) {
			titleNode.textContent = appConfig.overlay.title;
		}
		if (hintNode) {
			hintNode.textContent = appConfig.overlay.hint;
		}
	}

	function scheduleOverlayFade(nodes) {
		window.setTimeout(() => {
			nodes.heroOverlay.classList.add("hero-overlay--fade-out");
		}, appConfig.overlay.fadeDelayMs);
	}

	function renderControls(state, nodes, soundSupported = true) {
		nodes.btnAuto.textContent = state.config.autoLaunch ? "自动烟花：开" : "自动烟花：关";
		if (!soundSupported) {
			nodes.btnSound.textContent = "音效不可用";
			nodes.btnSound.disabled = true;
			return;
		}
		nodes.btnSound.disabled = false;
		nodes.btnSound.textContent = state.soundEnabled ? "音效：开" : "音效：关";
	}

	function isControlTarget(target) {
		return Boolean(target && target.closest && target.closest(".minimal-controls, .ctrl-btn"));
	}

	function bindMinimalControls(options) {
		const nodes = options.nodes;

		nodes.btnClear.addEventListener("click", (event) => {
			event.stopPropagation();
			options.onClear();
		});

		nodes.btnAuto.addEventListener("click", (event) => {
			event.stopPropagation();
			options.onToggleAuto();
		});

		nodes.btnSound.addEventListener("click", (event) => {
			event.stopPropagation();
			options.onToggleSound();
		});

		["touchstart", "touchend"].forEach((eventName) => {
			nodes.btnClear.addEventListener(eventName, (event) => event.stopPropagation());
			nodes.btnAuto.addEventListener(eventName, (event) => event.stopPropagation());
			nodes.btnSound.addEventListener(eventName, (event) => event.stopPropagation());
		});
	}

	global.FireworksMinimalUI = Object.freeze({
		queryNodes,
		applyOverlayText,
		scheduleOverlayFade,
		renderControls,
		isControlTarget,
		bindMinimalControls,
	});
})(window);
