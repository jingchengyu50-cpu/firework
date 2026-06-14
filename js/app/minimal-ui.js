/*
Modified by Jingcheng for personal customized fireworks page.
Based on Firework_Simulator by NianBroken (Apache-2.0).
*/

"use strict";

(function initFireworksMinimalUI(global) {
	var appConfig = global.FireworksAppConfig;

	function queryNodes() {
		return Object.keys(appConfig.selectors).reduce(function collect(nodes, key) {
			var node = document.querySelector(appConfig.selectors[key]);
			if (!node) {
				throw new Error("未找到界面节点: " + appConfig.selectors[key]);
			}
			nodes[key] = node;
			return nodes;
		}, {});
	}

	function applyOverlayText(nodes) {
		var titleNode = nodes.heroOverlay.querySelector(".hero-title");
		var hintNode = nodes.heroOverlay.querySelector(".hero-hint");
		if (titleNode) {
			titleNode.textContent = appConfig.overlay.title;
		}
		if (hintNode) {
			hintNode.textContent = appConfig.overlay.hint;
		}
	}

	function scheduleOverlayFade(nodes) {
		window.setTimeout(function fadeOverlay() {
			nodes.heroOverlay.classList.add("hero-overlay--fade-out");
		}, appConfig.overlay.fadeDelayMs);
	}

	function renderControls(state, nodes) {
		nodes.btnAuto.textContent = state.config.autoLaunch ? "自动烟花：开" : "自动烟花：关";
	}

	function isControlTarget(target) {
		return Boolean(target && target.closest && target.closest(".minimal-controls, .ctrl-btn"));
	}

	function bindMinimalControls(options) {
		var nodes = options.nodes;

		nodes.btnClear.addEventListener("click", function onClearClick(event) {
			event.stopPropagation();
			options.onClear();
		});

		nodes.btnAuto.addEventListener("click", function onAutoClick(event) {
			event.stopPropagation();
			options.onToggleAuto();
		});

		["touchstart", "touchend"].forEach(function bindTouch(eventName) {
			nodes.btnClear.addEventListener(eventName, function stopProp(event) {
				event.stopPropagation();
			});
			nodes.btnAuto.addEventListener(eventName, function stopProp(event) {
				event.stopPropagation();
			});
		});
	}

	global.FireworksMinimalUI = Object.freeze({
		queryNodes: queryNodes,
		applyOverlayText: applyOverlayText,
		scheduleOverlayFade: scheduleOverlayFade,
		renderControls: renderControls,
		isControlTarget: isControlTarget,
		bindMinimalControls: bindMinimalControls,
	});
})(window);
