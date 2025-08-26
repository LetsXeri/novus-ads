function simple() {
	return true;
}

function complex(a, b) {
	if (a > 0 && b < 5) {
		for (let i = 0; i < b; i++) {
			if (i % 2 === 0 || i === 3) {
				console.log(i);
			}
		}
	} else if (b === 0) {
		console.log("b is zero");
	} else {
		console.log("default");
	}
}
