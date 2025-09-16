/**
 * AliasSampler – Vose's Alias Method
 * ----------------------------------
 * O(n) Preprocessing, O(1) Sampling.
 *
 * Verwendung:
 *   const sampler = AliasSampler.from(items, i => i.weight);
 *   const item = sampler.sample(); // RNG: Math.random (oder injizierbar)
 *
 * Testbarkeit:
 *   const sampler = AliasSampler.from(items, w, seededRng);
 *   sampler.sample(); // deterministisch
 */

export type RNG = () => number; // liefert [0, 1)

export class AliasSampler<T> {
	private readonly items: T[];
	private readonly prob: number[];
	private readonly alias: number[];
	private readonly rng: RNG;

	private constructor(items: T[], prob: number[], alias: number[], rng?: RNG) {
		this.items = items;
		this.prob = prob;
		this.alias = alias;
		this.rng = rng ?? Math.random;
	}

	static from<T>(items: T[], weightFn: (item: T) => number, rng?: RNG): AliasSampler<T> {
		if (!Array.isArray(items) || items.length === 0) {
			throw new Error("AliasSampler: items darf nicht leer sein.");
		}

		const n = items.length;
		const weights = items.map(weightFn).map((w) => (Number.isFinite(w) ? Math.max(0, w) : 0));
		const total = weights.reduce((s, w) => s + w, 0);

		if (total <= 0) {
			throw new Error("AliasSampler: Summe der Gewichte muss > 0 sein.");
		}

		// Skaliere Gewichte: p_i = w_i * n / sum(w)
		const scaled = weights.map((w) => (w * n) / total);

		const prob = new Array<number>(n);
		const alias = new Array<number>(n);

		const small: number[] = [];
		const large: number[] = [];

		for (let i = 0; i < n; i++) {
			if (scaled[i] < 1) small.push(i);
			else large.push(i);
		}

		while (small.length && large.length) {
			const s = small.pop() as number;
			const l = large.pop() as number;

			prob[s] = scaled[s]; // < 1
			alias[s] = l; // s "leiht" von l
			scaled[l] = scaled[l] + scaled[s] - 1;

			if (scaled[l] < 1) small.push(l);
			else large.push(l);
		}

		// Reste auf 1 setzen
		while (large.length) prob[large.pop() as number] = 1;
		while (small.length) prob[small.pop() as number] = 1;

		return new AliasSampler(items, prob, alias, rng);
	}

	sample(): T {
		const n = this.items.length;
		// Ziehe i in [0, n)
		const u = this.rng() * n;
		const i = Math.floor(u);
		// Restbruchteil entscheidet gegen Alias
		const frac = u - i;
		return frac <= this.prob[i] ? this.items[i] : this.items[this.alias[i]];
	}
}

/**
 * Kleine Helferfunktion: Liefert null statt zu werfen, wenn keine gültige Auswahl möglich ist.
 */
export function pickWeightedAlias<T>(items: T[], weightFn: (item: T) => number, rng?: RNG): T | null {
	try {
		const sampler = AliasSampler.from(items, weightFn, rng);
		return sampler.sample();
	} catch {
		return null;
	}
}

/**
 * Einfache, deterministische RNG-Implementierung (Mulberry32)
 * Ideal für Unit-Tests: const rng = mulberry32(1234)
 */
export function mulberry32(seed: number): RNG {
	let t = seed >>> 0;
	return function () {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}
