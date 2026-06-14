/*
Modified by Jingcheng for personal customized fireworks page.
Mobile-first interaction + viewport handling
*/

"use strict";

var isUpdatingSpeed = false;
var currentFrame = 0;
var speedBarOpacity = 0;
var autoLaunchTime = 800;
var isAutoLaunchSound = false;

function registerUserInteraction() {
	soundManager.registerInteraction();
}

function isUiControlTarget(target) {
	if (window.FireworksMinimalUI && FireworksMinimalUI.isControlTarget(target)) {
		return true;
	}
	return Boolean(target && target.closest && target.closest(".minimal-controls, .ctrl-btn"));
}

function handlePointerStart(event) {
	if (!isRunning()) {
		return;
	}

	if (updateSpeedFromEvent(event)) {
		isUpdatingSpeed = true;
		return;
	}

	if (event.onCanvas && fireworksPerformance.canClickLaunch()) {
		isAutoLaunchSound = false;
		launchShellFromConfig(event);
	}
}

function handlePointerEnd() {
	isUpdatingSpeed = false;
}

function handlePointerMove(event) {
	if (!isRunning() || !isUpdatingSpeed) {
		return;
	}
	updateSpeedFromEvent(event);
}

function handleKeydown(event) {
	if (event.keyCode === 80) {
		togglePause();
	}
}

function handleResize() {
	var viewport = FireworksMobile.getViewportSize();
	var containerWidth = IS_MOBILE ? viewport.width : Math.min(viewport.width, MAX_WIDTH);
	var containerHeight = IS_MOBILE ? viewport.height : Math.min(viewport.height, MAX_HEIGHT);
	var dpr = FireworksMobile.getDpr();

	appNodes.stageContainer.style.width = containerWidth + "px";
	appNodes.stageContainer.style.height = containerHeight + "px";

	stages.forEach(function resizeStage(stage) {
		stage.resize(containerWidth, containerHeight, dpr);
	});

	if (skyBackground) {
		skyBackground.resize(containerWidth, containerHeight, dpr);
	}

	var scaleFactor = scaleFactorSelector();
	stageW = containerWidth / scaleFactor;
	stageH = containerHeight / scaleFactor;
}

function updateSpeedFromEvent(event) {
	if (!IS_MOBILE && (isUpdatingSpeed || event.y >= mainStage.height - 44)) {
		var edgePadding = 16;
		var newSpeed = (event.x - edgePadding) / (mainStage.width - edgePadding * 2);
		simSpeed = Math.min(Math.max(newSpeed, 0), 1);
		speedBarOpacity = 1;
		return true;
	}
	return false;
}

function updateGlobals(timeStep, lag) {
	currentFrame += 1;

	if (!isUpdatingSpeed) {
		speedBarOpacity -= lag / 30;
		if (speedBarOpacity < 0) {
			speedBarOpacity = 0;
		}
	}

	if (store.state.config.autoLaunch) {
		autoLaunchTime -= timeStep;
		if (autoLaunchTime <= 0 && fireworksPerformance.canLaunchShell()) {
			isAutoLaunchSound = true;
			soundManager.setAutoMode(true);
			var sequenceDelay = startSequence();
			soundManager.setAutoMode(false);
			isAutoLaunchSound = false;
			autoLaunchTime = Math.max(fireworksPerformance.limits.autoLaunchMinIntervalMs, sequenceDelay);
		}
	}
}

function bindMobileInput() {
	var canvasContainer = appNodes.canvasContainer;

	canvasContainer.addEventListener(
		"touchstart",
		function onTouchStart(event) {
			if (isUiControlTarget(event.target)) {
				return;
			}
			event.preventDefault();
		},
		{ passive: false }
	);

	document.addEventListener(
		"pointerdown",
		function onPointerDown(event) {
			if (isUiControlTarget(event.target)) {
				return;
			}
		},
		{ passive: true }
	);

	var lastTap = 0;
	document.addEventListener(
		"touchend",
		function onTouchEnd(event) {
			var now = Date.now();
			if (now - lastTap < 300) {
				event.preventDefault();
			}
			lastTap = now;
		},
		{ passive: false }
	);

	FireworksMobile.preventPageScroll();
	FireworksMobile.bindViewportListeners(handleResize);
}

bindMobileInput();
