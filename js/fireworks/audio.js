/*
Modified by Jingcheng for personal customized fireworks page.
Web Audio 合成音效 —— 手机微信优先
注意：微信 / 手机浏览器要求用户交互后才能启动 AudioContext
*/

"use strict";

var appAudioConfig = window.FireworksAppConfig.audio;

var AUDIO_CONFIG = {
	enabled: false,
	maxConcurrentSounds: appAudioConfig.maxConcurrentSounds,
	masterVolume: appAudioConfig.masterVolume,
	launchVolume: appAudioConfig.launchVolume,
	explosionVolume: appAudioConfig.explosionVolume,
	autoVolumeScale: appAudioConfig.autoVolumeScale,
	minLaunchIntervalMs: 100,
	minExplosionIntervalMs: 80,
};

var synthAudio = (function createSynthAudio() {
	var ctx = null;
	var masterGain = null;
	var noiseBuffer = null;
	var activeSoundCount = 0;
	var pageHidden = false;
	var lastLaunchTime = 0;
	var lastExplosionTime = 0;
	var autoMode = false;

	function isSupported() {
		try {
			return Boolean(window.AudioContext || window.webkitAudioContext);
		} catch (error) {
			return false;
		}
	}

	function ensureNoiseBuffer() {
		if (!ctx || noiseBuffer) {
			return;
		}
		try {
			var length = Math.floor(ctx.sampleRate * 2);
			noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
			var data = noiseBuffer.getChannelData(0);
			var index;
			for (index = 0; index < length; index += 1) {
				data[index] = Math.random() * 2 - 1;
			}
		} catch (error) {
			noiseBuffer = null;
		}
	}

	function ensureContext() {
		if (!isSupported()) {
			return null;
		}
		try {
			if (!ctx) {
				var AudioCtx = window.AudioContext || window.webkitAudioContext;
				ctx = new AudioCtx();
				masterGain = ctx.createGain();
				masterGain.gain.value = AUDIO_CONFIG.masterVolume;
				masterGain.connect(ctx.destination);
				ensureNoiseBuffer();
			}
			return ctx;
		} catch (error) {
			return null;
		}
	}

	function volumeScale() {
		return autoMode ? AUDIO_CONFIG.autoVolumeScale : 1;
	}

	function canPlay() {
		return (
			AUDIO_CONFIG.enabled &&
			!pageHidden &&
			ctx &&
			ctx.state !== "closed" &&
			activeSoundCount < AUDIO_CONFIG.maxConcurrentSounds
		);
	}

	function scheduleRelease(durationSec) {
		activeSoundCount += 1;
		window.setTimeout(function releaseSound() {
			activeSoundCount = Math.max(0, activeSoundCount - 1);
		}, Math.ceil(durationSec * 1000) + 40);
	}

	function enable() {
		try {
			if (!isSupported()) {
				return Promise.resolve(false);
			}
			var context = ensureContext();
			if (!context) {
				return Promise.resolve(false);
			}
			return context.resume().then(
				function onResumeOk() {
					AUDIO_CONFIG.enabled = true;
					if (masterGain) {
						masterGain.gain.setTargetAtTime(AUDIO_CONFIG.masterVolume, context.currentTime, 0.02);
					}
					return true;
				},
				function onResumeFail() {
					AUDIO_CONFIG.enabled = true;
					return context.state !== "closed";
				}
			);
		} catch (error) {
			return Promise.resolve(false);
		}
	}

	function disable() {
		AUDIO_CONFIG.enabled = false;
	}

	function setAutoMode(value) {
		autoMode = Boolean(value);
	}

	function setPageHidden(hidden) {
		pageHidden = hidden;
		if (!ctx || !masterGain) {
			return;
		}
		try {
			var now = ctx.currentTime;
			if (hidden) {
				masterGain.gain.setTargetAtTime(0, now, 0.02);
			} else if (AUDIO_CONFIG.enabled) {
				masterGain.gain.setTargetAtTime(AUDIO_CONFIG.masterVolume, now, 0.05);
			}
		} catch (error) {
			// ignore
		}
	}

	function pauseAll() {
		try {
			if (ctx && ctx.state === "running") {
				ctx.suspend();
			}
		} catch (error) {
			// ignore
		}
	}

	function resumeAll() {
		try {
			if (AUDIO_CONFIG.enabled && ctx) {
				ctx.resume();
			}
		} catch (error) {
			// ignore
		}
	}

	function playLaunchSound() {
		try {
			if (!canPlay()) {
				return;
			}
			var nowMs = Date.now();
			if (nowMs - lastLaunchTime < AUDIO_CONFIG.minLaunchIntervalMs) {
				return;
			}
			lastLaunchTime = nowMs;

			var t = ctx.currentTime;
			var duration = 0.25 + Math.random() * 0.2;
			var vol = AUDIO_CONFIG.launchVolume * volumeScale();
			scheduleRelease(duration);

			var filter = ctx.createBiquadFilter();
			filter.type = "bandpass";
			filter.frequency.setValueAtTime(620, t);
			filter.frequency.exponentialRampToValueAtTime(2200, t + duration * 0.85);
			filter.Q.value = 0.65;

			var osc = ctx.createOscillator();
			var oscGain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(150 + Math.random() * 25, t);
			osc.frequency.exponentialRampToValueAtTime(440 + Math.random() * 50, t + duration * 0.78);
			oscGain.gain.setValueAtTime(0.0001, t);
			oscGain.gain.linearRampToValueAtTime(vol * 0.72, t + 0.035);
			oscGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

			var noise = ctx.createBufferSource();
			var noiseGain = ctx.createGain();
			if (noiseBuffer) {
				noise.buffer = noiseBuffer;
				noise.loop = true;
				noiseGain.gain.setValueAtTime(0.0001, t);
				noiseGain.gain.linearRampToValueAtTime(vol * 0.24, t + 0.025);
				noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + duration * 0.82);
				noise.connect(noiseGain);
				noiseGain.connect(filter);
				noise.start(t, Math.random());
				noise.stop(t + duration);
			}

			osc.connect(oscGain);
			oscGain.connect(filter);
			filter.connect(masterGain);
			osc.start(t);
			osc.stop(t + duration);
		} catch (error) {
			// 音效失败不影响烟花
		}
	}

	function playExplosionSound(power) {
		try {
			if (!canPlay()) {
				return;
			}
			var nowMs = Date.now();
			if (nowMs - lastExplosionTime < AUDIO_CONFIG.minExplosionIntervalMs) {
				return;
			}
			lastExplosionTime = nowMs;

			power = MyMath.clamp(typeof power === "number" ? power : 0.6, 0.12, 1);
			var t = ctx.currentTime;
			var duration = 0.4 + power * 0.45;
			var volume = AUDIO_CONFIG.explosionVolume * (0.38 + power * 0.55) * volumeScale();
			scheduleRelease(duration);

			var lowpass = ctx.createBiquadFilter();
			lowpass.type = "lowpass";
			lowpass.frequency.setValueAtTime(720 + power * 480, t);
			lowpass.frequency.exponentialRampToValueAtTime(240, t + duration);
			lowpass.Q.value = 0.55;

			if (noiseBuffer) {
				var noise = ctx.createBufferSource();
				var noiseGain = ctx.createGain();
				noise.buffer = noiseBuffer;
				noiseGain.gain.setValueAtTime(0.0001, t);
				noiseGain.gain.linearRampToValueAtTime(volume, t + 0.012);
				noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
				noise.connect(lowpass);
				lowpass.connect(noiseGain);
				noiseGain.connect(masterGain);
				noise.start(t, Math.random() * 0.35);
				noise.stop(t + duration);
			}

			var sub = ctx.createOscillator();
			var subGain = ctx.createGain();
			sub.type = "sine";
			sub.frequency.setValueAtTime(82 + power * 30, t);
			sub.frequency.exponentialRampToValueAtTime(40, t + 0.12);
			subGain.gain.setValueAtTime(0.0001, t);
			subGain.gain.linearRampToValueAtTime(volume * 0.45, t + 0.006);
			subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
			sub.connect(subGain);
			subGain.connect(masterGain);
			sub.start(t);
			sub.stop(t + Math.min(0.28, duration));
		} catch (error) {
			// ignore
		}
	}

	return {
		isSupported: isSupported,
		enable: enable,
		disable: disable,
		setAutoMode: setAutoMode,
		setPageHidden: setPageHidden,
		pauseAll: pauseAll,
		resumeAll: resumeAll,
		playLaunchSound: playLaunchSound,
		playExplosionSound: playExplosionSound,
	};
})();

var soundManager = {
	preload: function preload() {
		return Promise.resolve();
	},
	registerInteraction: function registerInteraction() {},
	isSupported: function isSupported() {
		return synthAudio.isSupported();
	},
	enable: function enable() {
		return synthAudio.enable();
	},
	disable: function disable() {
		synthAudio.disable();
	},
	setAutoMode: function setAutoMode(value) {
		synthAudio.setAutoMode(value);
	},
	setPageHidden: function setPageHidden(hidden) {
		synthAudio.setPageHidden(hidden);
	},
	pauseAll: function pauseAll() {
		synthAudio.pauseAll();
	},
	resumeAll: function resumeAll() {
		return synthAudio.resumeAll();
	},
	playLaunchSound: function playLaunchSound() {
		if (!canPlaySoundSelector()) {
			return;
		}
		synthAudio.playLaunchSound();
	},
	playExplosionSound: function playExplosionSound(power) {
		if (!canPlaySoundSelector()) {
			return;
		}
		synthAudio.playExplosionSound(power);
	},
	playSound: function playSound(type, scale) {
		if (!canPlaySoundSelector()) {
			return;
		}
		scale = typeof scale === "number" ? scale : 1;
		if (type === "lift") {
			synthAudio.playLaunchSound();
		} else if (type === "burst") {
			synthAudio.playExplosionSound(scale);
		} else if (type === "burstSmall") {
			synthAudio.playExplosionSound(0.2 * scale);
		} else if (type === "crackle") {
			synthAudio.playExplosionSound(0.14);
		} else if (type === "crackleSmall") {
			synthAudio.playExplosionSound(0.09);
		}
	},
};
