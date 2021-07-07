(function (global) {
	//Registering
	if (typeof global.Lowlight === "undefined") {
		global.Lowlight = {};
	}
	if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = global.Lowlight;
	}

	//Glitcher
	class Glitcher {
		/**
		 * Glitcher which simulates a glitchy image or video.
		 * @param {String|HTMLElement} source - Element to be glitched
		 * @param {Object} [options] - Options
		 */
		constructor(source, options = {}) {
			//Canvas and context
			/**
			 * Reference to original and rendered canvas.
			 * @type {Object<Canvas>}
			 */
			this.canvas = {
				original: document.createElement("canvas"),
				rendered: document.createElement("canvas"),
			};
			/**
			 * Reference to original and rendered canvas contexts.
			 * @type {Object<CanvasRenderingContext2D>}
			 */
			this.context = {
				original: this.canvas.original.getContext("2d"),
				rendered: this.canvas.rendered.getContext("2d"),
			};

			//Saving parameters
			this.source = source;
			this.options = options;
			//Referencing
			Glitcher.list.add(this);
		}

		/**
		 * Loader.
		 * @param {String} url - Source
		 */
		load(url) {
			//Video
			if (/\.mp4$/.test(url)) {
				const video = document.createElement("video");
				video.crossOrigin = "anonymous";
				video.controls = false;
				video.autoplay = true;
				video.muted = true;
				video.loop = true;
				const source = document.createElement("source");
				source.src = url;
				source.type = "video/mp4";
				video.appendChild(source);
				video.onloadedmetadata = () => {
					video.height = video.videoHeight;
					video.width = video.videoWidth;
					this.source = video;
				};
				video.onloadeddata = () =>
					this.context.original.drawImage(this.source, 0, 0);
				this.video = true;
			}
			//Image
			else {
				const image = document.createElement("img");
				image.crossOrigin = "anonymous";
				image.onload = () => (this.source = image);
				image.src = url;
				this.video = false;
			}
		}

		/**
		 * Source element
		 * @type {Image|Video}
		 */
		set source(source) {
			//Save source
			if (typeof source === "string") return this.load(source);
			this._source = source;
			//Resize canvas
			this.canvas.original.width =
				this.canvas.rendered.width =
				this.width =
				this.source.width;
			this.canvas.original.height =
				this.canvas.rendered.height =
				this.height =
				this.source.height;
			//Draw new image
			this.context.original.drawImage(this.source, 0, 0);
		}
		get source() {
			return this._source;
		}

		/**
		 * Shortcut to rendered element.
		 * @type {Canvas}
		 * @readonly
		 */
		get rendered() {
			return this.canvas.rendered;
		}

		/**
		 * Render
		 */
		render() {
			//Pass if source isn't defined
			if (!this.source) return null;
			const r = Glitcher.random,
				o = this.options,
				co = {};
			//Compute options
			["color", "offset", "grayscale"].forEach((option) => {
				if (!o[option]) return null;
				let oo = o[option];
				co[option] = [
					oo.r * ("dr" in oo ? r(oo.dr) : "dv" in oo ? r(oo.dv) : 1),
					oo.g * ("dg" in oo ? r(oo.dg) : "dv" in oo ? r(oo.dv) : 1),
					oo.b * ("db" in oo ? r(oo.db) : "dv" in oo ? r(oo.dv) : 1),
				];
			});
			//Compute glitches options
			if (o.glitches) {
				co.glitches = {
					value: o.glitches.value * ("dv" in o.glitches ? r(o.glitches.dv) : 1),
					height:
						o.glitches.height * ("dh" in o.glitches ? r(o.glitches.dh) : 1),
				};
			}
			//Process
			if (this.video) this.context.original.drawImage(this.source, 0, 0);
			this.process(co.color, co.offset, co.grayscale, co.glitches);
		}

		/**
		 * Process image glitching effect.
		 * @private
		 * @param {Array<r, g, b>} [color] - Color multiplier
		 * @param {Array<r, g, b>} [offset] - Color layer offsets
		 * @param {Array<r, g, b>} [grayscale] - Grayscale filter
		 * @param {Objetc} [glitches] - Glitch effects
		 * @param {Number} [glitches.value] - Glitch strength
		 * @param {Number} [glitches.height] - Glitch height
		 */
		process(color, offset, grayscale, glitches) {
			//Image data
			const image = this.context.original.getImageData(
				0,
				0,
				this.width,
				this.height
			);
			const pixels = image.data;

			//Pixels manipulation
			for (let i = 0; i < pixels.length; i += 4) {
				//Pass if transparent
				if (pixels[i + 4] === 0) continue;

				//Color multiplier
				if (color) {
					pixels[i + 0] *= color[0];
					pixels[i + 1] *= color[0];
					pixels[i + 2] *= color[0];
				}

				//Color layer offsets
				if (offset) {
					pixels[i + 0] = pixels[i + 0 + 4 * offset[0]] || 0;
					pixels[i + 1] = pixels[i + 1 + 4 * offset[1]] || 0;
					pixels[i + 2] = pixels[i + 2 + 4 * offset[2]] || 0;
				}

				//Grayscale filter
				if (grayscale) {
					let brightness =
						pixels[i + 0] * grayscale[0] +
						pixels[i + 0] * grayscale[1] +
						pixels[i + 2] * grayscale[2];
					pixels[i + 0] = brightness;
					pixels[i + 1] = brightness;
					pixels[i + 2] = brightness;
				}
			}

			//Glitch effects
			if (glitches) {
				for (let y = 0, i = 0, glitch = 0; y < this.height; y++) {
					//Offset calculation
					if (y % glitches.height === 0)
						glitch = Math.round(Math.random() * glitches.value);
					//Offset application
					for (let x = 0; x < this.width; x++, i += 4) {
						pixels[i + 0] = pixels[i + 0 + 4 * glitch] || 0;
						pixels[i + 1] = pixels[i + 1 + 4 * glitch] || 0;
						pixels[i + 2] = pixels[i + 2 + 4 * glitch] || 0;
						pixels[i + 3] = pixels[i + 3 + 4 * glitch] || 0;
					}
				}
			}

			//Alpha layer
			for (let i = 0; i < pixels.length; i += 4) {
				pixels[i + 3] =
					(pixels[i + 0] << 16) +
						(pixels[i + 1] << 8) +
						(pixels[i + 2] << 0) !==
						this.options.transparent
						? 255
						: 0;
			}

			//Apply processed image data
			this.context.rendered.putImageData(image, 0, 0);
		}

		/**
		 * Generate a random integer number.
		 * @param {Number[]} [a=[1, 3]] - Minimum, maximum
		 * @return {Number} Random number
		 */
		static random(d = [1, 3]) {
			return d[0] + Math.floor(Math.random() * (d[1] - d[0]));
		}

		/**
		 * Update all glitchers.
		 */
		static update() {
			Glitcher.list.forEach((g) => g.render());
			requestAnimationFrame(Glitcher.update);
		}
	}

	//List
	Glitcher.list = new Set();
	//To global context
	global.Lowlight.Glitcher = Glitcher;
})(typeof window !== "undefined" ? window : this);
