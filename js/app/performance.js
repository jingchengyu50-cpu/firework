/*
Modified by Jingcheng for personal customized fireworks page.
Mobile-first performance limits
*/

"use strict";

(function initFireworksPerformance(global) {
	var appConfig = global.FireworksAppConfig;
	var mobileApi = global.FireworksMobile;
	var isMobile = mobileApi && mobileApi.isMobileDevice();
	var mobileCfg = appConfig.mobile;

	var isLowPerf =
		(navigator.hardwareConcurrency || 4) <= 4 ||
		(navigator.deviceMemory && navigator.deviceMemory <= 4);

	var limits;

	if (isMobile) {
		limits = {
			maxStars: mobileCfg.maxStars,
			maxSparks: mobileCfg.maxSparks,
			maxActiveShells: mobileCfg.maxShells,
			clickThrottleMs: mobileCfg.clickCooldown,
			autoLaunchMinIntervalMs: mobileCfg.autoFireInterval,
		};
		if (isLowPerf) {
			limits.maxStars = Math.floor(limits.maxStars * 0.72);
			limits.maxSparks = Math.floor(limits.maxSparks * 0.72);
			limits.maxActiveShells = Math.max(4, limits.maxActiveShells - 1);
		}
	} else {
		limits = {
			maxStars: isLowPerf ? 480 : appConfig.performance.maxStars,
			maxSparks: isLowPerf ? 720 : appConfig.performance.maxSparks,
			maxActiveShells: isLowPerf ? 5 : appConfig.performance.maxActiveShells,
			clickThrottleMs: appConfig.performance.clickThrottleMs,
			autoLaunchMinIntervalMs: appConfig.performance.autoLaunchMinIntervalMs,
		};
	}

	var activeShells = 0;
	var lastClickTime = 0;
	var spawnCounter = 0;

	function nextSpawnId() {
		spawnCounter += 1;
		return spawnCounter;
	}

	function countCollection(collection) {
		var total = 0;
		COLOR_CODES_W_INVIS.forEach(function forEachColor(colorCode) {
			total += collection[colorCode].length;
		});
		return total;
	}

	function getStarCount() {
		if (typeof Star === "undefined") {
			return 0;
		}
		return countCollection(Star.active);
	}

	function getSparkCount() {
		if (typeof Spark === "undefined") {
			return 0;
		}
		return countCollection(Spark.active);
	}

	function getTotalParticleCount() {
		return getStarCount() + getSparkCount();
	}

	function removeOldestFromCollection(collection, returnFn, clearStarDeath) {
		var oldestParticle = null;
		var oldestColor = null;
		var oldestIndex = -1;

		COLOR_CODES_W_INVIS.forEach(function forEachColor(colorCode) {
			var bucket = collection[colorCode];
			var index;
			for (index = 0; index < bucket.length; index += 1) {
				var particle = bucket[index];
				if (!oldestParticle || particle.spawnId < oldestParticle.spawnId) {
					oldestParticle = particle;
					oldestColor = colorCode;
					oldestIndex = index;
				}
			}
		});

		if (!oldestParticle) {
			return false;
		}

		var removed = collection[oldestColor].splice(oldestIndex, 1)[0];
		if (clearStarDeath) {
			removed.onDeath = null;
		}
		returnFn(removed);
		return true;
	}

	function trimStars(forceRoom) {
		var threshold = forceRoom ? limits.maxStars : limits.maxStars + 1;
		while (getStarCount() >= threshold) {
			if (!removeOldestFromCollection(Star.active, Star.returnInstance.bind(Star), true)) {
				break;
			}
		}
	}

	function trimSparks(forceRoom) {
		var threshold = forceRoom ? limits.maxSparks : limits.maxSparks + 1;
		while (getSparkCount() >= threshold) {
			if (!removeOldestFromCollection(Spark.active, Spark.returnInstance.bind(Spark), false)) {
				break;
			}
		}
	}

	function trimParticles() {
		trimStars(false);
		trimSparks(false);
	}

	function canLaunchShell() {
		return (
			activeShells < limits.maxActiveShells &&
			getStarCount() < limits.maxStars &&
			getSparkCount() < limits.maxSparks
		);
	}

	function canClickLaunch() {
		var now = Date.now();
		if (now - lastClickTime < limits.clickThrottleMs) {
			return false;
		}
		if (!canLaunchShell()) {
			return false;
		}
		lastClickTime = now;
		return true;
	}

	function onShellLaunch() {
		activeShells += 1;
	}

	function onShellBurst() {
		activeShells = Math.max(0, activeShells - 1);
	}

	function stampParticle(particle) {
		particle.spawnId = nextSpawnId();
		return particle;
	}

	function clearAllParticles() {
		if (typeof Star === "undefined" || typeof Spark === "undefined") {
			activeShells = 0;
			return;
		}

		COLOR_CODES_W_INVIS.forEach(function forEachColor(colorCode) {
			while (Star.active[colorCode].length) {
				var star = Star.active[colorCode].shift();
				star.onDeath = null;
				Star.returnInstance(star);
			}
			while (Spark.active[colorCode].length) {
				Spark.returnInstance(Spark.active[colorCode].shift());
			}
		});

		if (typeof BurstFlash !== "undefined") {
			while (BurstFlash.active.length) {
				BurstFlash.returnInstance(BurstFlash.active.pop());
			}
		}

		activeShells = 0;
	}

	global.FireworksPerformance = Object.freeze({
		limits: limits,
		isMobile: isMobile,
		isLowPerf: isLowPerf,
		getStarCount: getStarCount,
		getSparkCount: getSparkCount,
		getTotalParticleCount: getTotalParticleCount,
		trimStars: trimStars,
		trimSparks: trimSparks,
		trimParticles: trimParticles,
		canLaunchShell: canLaunchShell,
		canClickLaunch: canClickLaunch,
		onShellLaunch: onShellLaunch,
		onShellBurst: onShellBurst,
		stampParticle: stampParticle,
		clearAllParticles: clearAllParticles,
	});
})(window);
