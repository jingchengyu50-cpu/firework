/*
Modified by Jingcheng for personal customized fireworks page.
Immediate boot — mobile first screen
*/

"use strict";

function applyStaticText() {
	if (appNodes.copyrightYear) {
		appNodes.copyrightYear.textContent = String(new Date().getFullYear());
	}
}

function init() {
	if (!shellTypes[store.state.config.shell]) {
		store.setState({
			config: Object.assign({}, store.state.config, { shell: "Random" }),
		});
	}

	applyOverlayText(appNodes);
	scheduleOverlayFade(appNodes);
	renderControls(store.state, appNodes);
	configDidUpdate();
	applyResolvedBackground();
	handleResize();
	togglePause(false);
}

function attachRuntimeBindings() {
	var previousState = store.state;
	store.subscribe(function onStoreChange(state) {
		handleStateChange(state, previousState);
		previousState = state;
	});

	mainStage.addEventListener("pointerstart", handlePointerStart);
	mainStage.addEventListener("pointerend", handlePointerEnd);
	mainStage.addEventListener("pointermove", handlePointerMove);
	mainStage.addEventListener("ticker", update);

	window.addEventListener("keydown", handleKeydown);
	window.addEventListener("resize", handleResize);
}

function boot() {
	applyStaticText();
	attachRuntimeBindings();
	init();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", boot);
} else {
	boot();
}
