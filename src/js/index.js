import "../scss/main.scss";

import animeBlocks from "./components/anime-blocks";
import blockHeight from "./components/block-height";
import colorSplash from "./components/color-splash";
import darkMode from "./components/dark-mode";
import formSubmit from "./components/form-submit";
import particles from "./components/particles";
import scrollTrigger from "./components/scroll-trigger";

document.addEventListener("DOMContentLoaded", function () {
	animeBlocks();
	blockHeight();
	colorSplash();
	darkMode();
	formSubmit();
	particles();
	scrollTrigger();
});
