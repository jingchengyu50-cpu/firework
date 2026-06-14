/*
Modified by Jingcheng for personal customized fireworks page.
Based on Firework_Simulator by NianBroken (Apache-2.0).
*/

"use strict";

(function initFireworksSkyBackground(global) {
	const performance = global.FireworksPerformance;

	function drawSky(canvas, width, height, dpr) {
		if (!canvas) {
			return;
		}

		canvas.width = width * dpr;
		canvas.height = height * dpr;
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;

		const ctx = canvas.getContext("2d");
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		var gradient = ctx.createLinearGradient(0, 0, 0, height);
		gradient.addColorStop(0, "#050714");
		gradient.addColorStop(0.38, "#070b1a");
		gradient.addColorStop(0.68, "#0a1024");
		gradient.addColorStop(1, "#050714");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		function drawNebula(cx, cy, radius, color) {
			const nebula = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
			nebula.addColorStop(0, color);
			nebula.addColorStop(1, "rgba(0,0,0,0)");
			ctx.fillStyle = nebula;
			ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
		}

		drawNebula(width * 0.25, height * 0.28, width * 0.45, "rgba(55, 48, 110, 0.07)");
		drawNebula(width * 0.72, height * 0.52, width * 0.38, "rgba(38, 62, 120, 0.06)");
		drawNebula(width * 0.5, height * 0.14, width * 0.32, "rgba(70, 52, 95, 0.05)");

		const fog = ctx.createRadialGradient(width * 0.5, height * 0.62, 0, width * 0.5, height * 0.62, width * 0.55);
		fog.addColorStop(0, "rgba(28, 46, 82, 0.1)");
		fog.addColorStop(1, "rgba(0, 0, 0, 0)");
		ctx.fillStyle = fog;
		ctx.fillRect(0, 0, width, height);

		var starCount = performance.isMobile ? (performance.isLowPerf ? 70 : 110) : performance.isLowPerf ? 90 : 160;
		for (let index = 0; index < starCount; index += 1) {
			const x = Math.random() * width;
			const y = Math.random() * height * 0.88;
			const radius = Math.random() * 1.1 + 0.25;
			const alpha = Math.random() * 0.45 + 0.12;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(198, 208, 238, ${alpha})`;
			ctx.fill();
		}

		for (let index = 0; index < 14; index += 1) {
			const x = Math.random() * width;
			const y = Math.random() * height * 0.72;
			ctx.beginPath();
			ctx.arc(x, y, 1, 0, Math.PI * 2);
			ctx.fillStyle = "rgba(220, 230, 255, 0.55)";
			ctx.fill();
		}
	}

	function createSkyBackground(options) {
		const canvas = options.canvas;
		let width = 0;
		let height = 0;
		let dpr = Math.min(window.devicePixelRatio || 1, 2);

		function resize(nextWidth, nextHeight, nextDpr) {
			width = nextWidth;
			height = nextHeight;
			if (nextDpr) {
				dpr = Math.min(nextDpr, 2);
			}
			drawSky(canvas, width, height, dpr);
		}

		return { resize };
	}

	global.FireworksSkyBackground = Object.freeze({
		createSkyBackground,
	});
})(window);
