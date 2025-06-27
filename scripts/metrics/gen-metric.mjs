import path from "path";

import { calculateReusability } from "./calculateReusability.mjs";
import { calculateModularity } from "./calculateModularity.mjs";
import { calculateAnalyzability } from "./calculateAnalyzability.mjs";
import { calculateModifiability } from "./calculateModifiability.mjs";
import { calculateTestability } from "./calculateTestability.mjs";

const frontend = path.resolve("../../frontend/src");
const backend = path.resolve("../../backend/src");

console.log(`📁 Projekt: ${frontend}`);
await calculateReusability(frontend);
await calculateModularity(frontend);
await calculateAnalyzability(frontend);
await calculateModifiability(frontend);
await calculateTestability(frontend);

console.log(`📁 Projekt: ${backend}`);
await calculateReusability(backend);
await calculateModularity(backend);
await calculateAnalyzability(backend);
await calculateModifiability(backend);
await calculateTestability(backend);
