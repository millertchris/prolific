import '../scss/main.scss';

import animeBlocks from './components/anime-blocks';
import colorSplash from './components/color-splash';
import darkMode from './components/dark-mode';
import formSubmit from './components/form-submit';
import particles from './components/particles';

document.addEventListener('DOMContentLoaded', function () {
	animeBlocks();
	colorSplash();
	darkMode();
	formSubmit();
	particles();
});
