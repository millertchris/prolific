import * as confetti from "canvas-confetti";

export default function formSubmit() {
	var email = document.querySelector('input[type="email"]');

	// Play Lottie
	function playAnimation() {
		const player = document.querySelector(".rocket");
		player.play();
	}

	// Confetti
	var canvas = document.getElementById("confetti");
	canvas.confetti =
		canvas.confetti || confetti.create(canvas, { resize: true });

	function makeItFly() {
		var end = Date.now() + 15 * 1000;
		var colors = ["#00FFC0", "#F9FF00", "#FF0000", "#FFF", "#FF0000"];
		(function frame() {
			canvas.confetti({
				particleCount: 2,
				angle: 60,
				spread: 55,
				origin: { x: 0 },
				colors: colors,
				resize: true,
				useWorker: true,
			});
			canvas.confetti({
				particleCount: 2,
				angle: 120,
				spread: 55,
				origin: { x: 1 },
				colors: colors,
				resize: true,
				useWorker: true,
			});

			if (Date.now() < end) {
				requestAnimationFrame(frame);
			}
		})();
	}

	function validateEmail(email) {
		const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}

	function validate() {
		const result = document.getElementById("result");
		var email = document.querySelector('input[type="email"]').value;
		result.innerHTML = "";

		if (validateEmail(email)) {
			var element = document.getElementById("party");
			element.classList.add("success");

			makeItFly();

			result.innerHTML =
				"<h2>Yea!!! Now we're talkin!</h2><p>We will review your message and be in touch soon.</p>";

			return true;
		} else if (email == "") {
			result.innerHTML = "<p>Look like you forgot your email!</p>";
		} else {
			result.innerHTML =
				'<p>Hmm...something is off. Try checking "' +
				email +
				'" and try again.</p>';
		}
		return false;
	}

	const tada = document.getElementById("tada");
	tada.addEventListener("click", validate);
}
