import { gsap, ScrollTrigger } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);

export default function scrollTrigger() {
	// gsap.timeline({
	// 	scrollTrigger: {
	// 		trigger: ".hold",
	// 		start: "center center",
	// 		end: () => innerHeight * 4,
	// 		scrub: true,
	// 		pin: ".hold",
	// 		anticipatePin: 1,
	// 	},
	// })
	// 	// .set(".hold", { autoAlpha: 0 })
	// 	.to(".hold", { duration: 0.1, autoAlpha: 1 }, 0.001);

	const fadeUp = gsap.utils.toArray(".fade-up");

	fadeUp.forEach((item) => {
		gsap.from(item, {
			autoAlpha: 0,
			y: 200,
			scrollTrigger: {
				trigger: item,
				pin: false,
				start: "top bottom",
				end: "+=100",
				markers: false,
				scrub: 1,
			},
		});
	});

	const fadeIn = gsap.utils.toArray(".fade-in");

	fadeIn.forEach((item) => {
		gsap.from(item, {
			autoAlpha: 0,
			scrollTrigger: {
				trigger: item,
				pin: false,
				start: "bottom bottom",
				end: "+=500",
				markers: false,
				scrub: 1,
			},
		});
	});
}
