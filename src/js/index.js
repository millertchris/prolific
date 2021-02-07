import "../scss/main.scss";

import animeBlocks from "./components/anime-blocks";
import colorSplash from "./components/color-splash";
import darkMode from "./components/dark-mode";
import formSubmit from "./components/form-submit";
import particles from "./components/particles";
import scrollTrigger from "./components/scroll-trigger";

document.addEventListener("DOMContentLoaded", function () {
	animeBlocks();
	colorSplash();
	darkMode();
	formSubmit();
	particles();
	scrollTrigger();

	// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
	let vh = window.innerHeight * 0.01;
	// Then we set the value in the --vh custom property to the root of the document
	document.documentElement.style.setProperty("--vh", `${vh}px`);

	// We listen to the resize event
	window.addEventListener("resize", () => {
		// We execute the same script as before
		let vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty("--vh", `${vh}px`);
	});
});
