/*
Modified by Jingcheng for personal customized fireworks page.
手机微信浏览器视口工具
*/

"use strict";

(function initFireworksMobileViewport(global) {
	function isMobileDevice() {
		var ua = navigator.userAgent || "";
		var isPhone =
			/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
			(/iPad/i.test(ua) && "ontouchstart" in window);
		var isNarrowTouch = window.innerWidth <= 820 && "ontouchstart" in window;
		return isPhone || isNarrowTouch;
	}

	function getViewportSize() {
		var width = window.innerWidth;
		var height = window.innerHeight;

		if (window.visualViewport) {
			width = window.visualViewport.width;
			height = window.visualViewport.height;
		}

		return {
			width: Math.max(1, Math.round(width)),
			height: Math.max(1, Math.round(height)),
		};
	}

	function getDpr() {
		var appConfig = global.FireworksAppConfig;
		var maxDpr = 2;
		if (appConfig && appConfig.mobile && appConfig.mobile.maxDpr) {
			maxDpr = appConfig.mobile.maxDpr;
		}
		var dpr = window.devicePixelRatio || 1;
		return Math.min(dpr, maxDpr);
	}

	function bindViewportListeners(callback) {
		if (typeof callback !== "function") {
			return function noop() {};
		}

		var timer = null;
		function schedule() {
			if (timer) {
				clearTimeout(timer);
			}
			timer = setTimeout(function onViewportChange() {
				timer = null;
				callback();
			}, 80);
		}

		window.addEventListener("resize", schedule);
		window.addEventListener("orientationchange", schedule);

		if (window.visualViewport) {
			window.visualViewport.addEventListener("resize", schedule);
		}

		return function unbind() {
			window.removeEventListener("resize", schedule);
			window.removeEventListener("orientationchange", schedule);
			if (window.visualViewport) {
				window.visualViewport.removeEventListener("resize", schedule);
			}
			if (timer) {
				clearTimeout(timer);
			}
		};
	}

	function preventPageScroll() {
		document.addEventListener(
			"touchmove",
			function onTouchMove(event) {
				if (event.target && event.target.closest && event.target.closest(".ctrl-btn")) {
					return;
				}
				event.preventDefault();
			},
			{ passive: false }
		);
	}

	global.FireworksMobile = Object.freeze({
		isMobileDevice: isMobileDevice,
		getViewportSize: getViewportSize,
		getDpr: getDpr,
		bindViewportListeners: bindViewportListeners,
		preventPageScroll: preventPageScroll,
	});
})(window);
