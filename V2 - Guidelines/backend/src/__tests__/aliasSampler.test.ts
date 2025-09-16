import { AliasSampler, pickWeightedAlias, mulberry32 } from "../utils/aliasSampler";

const approxEqual = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance;

describe("AliasSampler (Vose) – unit tests", () => {
	test("liefert Verteilung ~ Gewichte (1:3:6)", () => {
		const items = ["A", "B", "C"];
		const weightMap: Record<string, number> = { A: 1, B: 3, C: 6 }; // Summe 10 → 0.1 / 0.3 / 0.6
		const rng = mulberry32(123456);
		const sampler = AliasSampler.from(items, (x) => weightMap[x], rng);

		const N = 20000; // stabil, aber schnell
		const counts = new Map(items.map((x) => [x, 0]));
		for (let i = 0; i < N; i++) {
			const v = sampler.sample();
			counts.set(v, counts.get(v)! + 1);
		}

		const pA = counts.get("A")! / N;
		const pB = counts.get("B")! / N;
		const pC = counts.get("C")! / N;

		// Toleranz ±2.5%
		expect(approxEqual(pA, 0.1, 0.025)).toBe(true);
		expect(approxEqual(pB, 0.3, 0.025)).toBe(true);
		expect(approxEqual(pC, 0.6, 0.025)).toBe(true);
	});

	test("einzig positives Gewicht → immer dieses Item", () => {
		const items = ["only", "z1", "z2", "z3"];
		const weightMap: Record<string, number> = { only: 5, z1: 0, z2: 0, z3: 0 };
		const sampler = AliasSampler.from(items, (x) => weightMap[x], mulberry32(42));

		for (let i = 0; i < 200; i++) {
			expect(sampler.sample()).toBe("only");
		}
	});

	test("alle Gewichte 0 → pickWeightedAlias gibt null zurück", () => {
		const items = ["a", "b"];
		const weightMap: Record<string, number> = { a: 0, b: 0 };

		const picked = pickWeightedAlias(items, (x) => weightMap[x], mulberry32(7));
		expect(picked).toBeNull();
	});

	test("leere Items-Liste → throws", () => {
		expect(() => AliasSampler.from([], () => 1)).toThrow();
	});

	test("negative Gewichte werden intern zu 0 geclampt", () => {
		const items = ["x", "y"];
		const weightMap: Record<string, number> = { x: -5, y: 10 }; // -5 wird zu 0 geclampt
		const sampler = AliasSampler.from(items, (x) => weightMap[x], mulberry32(99));

		for (let i = 0; i < 200; i++) {
			expect(sampler.sample()).toBe("y");
		}
	});

	test("Determinismus: gleicher Seed → gleiche Sequenz", () => {
		const items = ["A", "B", "C"];
		const weightMap: Record<string, number> = { A: 2, B: 5, C: 3 };

		const s1 = AliasSampler.from(items, (x) => weightMap[x], mulberry32(2025));
		const s2 = AliasSampler.from(items, (x) => weightMap[x], mulberry32(2025));

		const N = 1000;
		for (let i = 0; i < N; i++) {
			expect(s1.sample()).toBe(s2.sample());
		}
	});

	test("Determinismus: unterschiedlicher Seed → unterschiedliche Sequenz (hinreichend)", () => {
		const items = ["A", "B", "C"];
		const weightMap: Record<string, number> = { A: 2, B: 5, C: 3 };

		const s1 = AliasSampler.from(items, (x) => weightMap[x], mulberry32(1));
		const s2 = AliasSampler.from(items, (x) => weightMap[x], mulberry32(2));

		const N = 500;
		let equalCount = 0;
		for (let i = 0; i < N; i++) {
			if (s1.sample() === s2.sample()) equalCount++;
		}
		// sehr lax, wir wollen nur sicherstellen, dass nicht "fast alles" gleich ist
		expect(equalCount).toBeLessThan(400);
	});

	test("sample liefert nur gültige Elemente aus der Eingabeliste", () => {
		const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const sampler = AliasSampler.from(items, () => 1, mulberry32(777));

		const N = 1000;
		for (let i = 0; i < N; i++) {
			const v = sampler.sample();
			expect(items.includes(v)).toBe(true);
		}
	});
});
