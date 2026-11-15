# Mechanism Duel

**A question before an answer:** compare two mechanisms that fit the same observation, then find a measurement or perturbation that would make their predictions diverge.

This is a new GenHacks 2026 prototype started on 2026-11-12. It is separate from the Syn3A Cell Lab project. Mechanism Duel asks how to distinguish explanations that fit the same observation. Case 01 is a synthetic first-order reaction: a direct `S → P` route and a staged `S → I → P` route are calibrated to match one product measurement. Case 02 is a reduced, deterministic *E. coli* lac-regulation exploration model linking lactose uptake, allolactose, LacI-mediated expression, and growth-coupled dilution. Its experiment timeline lets users schedule multiple lactose/glucose medium changes and follow state variables continuously across each intervention. A history challenge compares a steady condition with a brief lactose pulse. A parameter-identifiability challenge calibrates a second parameter set to match the same 6 h enzyme proxy, then applies the same pulse and compares resulting predictions. These are two parameterisations of one reduced model, not two established biological mechanisms. The biological case has its own page at `cell-case.html`.

Model discrimination and optimal experiment design are established systems-biology topics, not a new claim of this project. This prototype focuses on making parameter ambiguity and candidate follow-up measurements inspectable in one interaction. See [Mélykúti et al. (2010)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2873315/) and the network modeling environment [Cell Collective](https://research.cellcollective.org/).

## Run

Requirements: Node.js 22 or newer and npm. This project keeps install caches, dependencies, test bundles and other generated runtime files in `_tmp/`.

```powershell
$project = 'competitions/hackathon/GenHacks_2026/mechanism-duel'
$env:npm_config_cache = Join-Path $project '_tmp/npm-cache'
npm install --prefix (Join-Path $project '_tmp/runtime') --no-save --package-lock=false '@tangent.to/ode@0.1.3' 'esbuild@0.28.2'
node (Join-Path $project 'scripts/build.mjs')
node (Join-Path $project 'scripts/test.mjs')
node (Join-Path $project 'server.mjs')
```

Open `http://127.0.0.1:8522/`. The cell case is linked from the top bar and can also be opened at `http://127.0.0.1:8522/cell-case.html`. The app makes no network calls at runtime; the bundled ODE solver is attributed in `LICENSES.md`, with its license text in `ODE-LICENSE.txt`. System sans-serif and monospace fonts are used locally.

## Scientific scope

Case 01 values are predictions of two idealized toy mechanisms, not observations from cells. Its calibration makes both models agree at one chosen product readout; it does not validate either mechanism. Case 02 is an explicitly dimensionless reduction informed by Zander et al. (2017), not a reproduction of their fitted model or dataset. Its timeline supports only lactose (0–2 mM in the interface) and a normalized glucose-context parameter (0–2); it is not a general-purpose arbitrary-chemical editor. It omits stochastic single-cell variation, DNA-loop operator states, detailed metabolism, and division. The noise-normalized separation is a comparison aid, not a posterior probability, confidence level, or claim that an intervention is experimentally feasible. The second-step block is an idealized, model-specific perturbation with no off-target effects.

No AI model, external dataset, personal data, or medical recommendation is used. The project was built with AI coding assistance; that assistance will be disclosed in the final submission.

## Competition submission state

- Project name: **Mechanism Duel**
- Elevator pitch: **Two mechanisms can fit the same observation. Build a test that makes them disagree.**
- Biological case: **Can a positive-feedback loop still produce less enzyme when growth dilutes the cell's internal state?** Interactive, normalized *E. coli* lac-regulation model; source basis and limitations are visible in the app.
- Experiment protocol: **Schedule multiple changes in medium composition**, carry the modeled cell state across each time boundary, and inspect intracellular lactose, allolactose, enzyme, and growth-rate proxies over time.
- Track: **Open**. The prototype is a general scientific-modeling education tool; it does not claim a demonstrated health or environmental outcome.
- Code repository: https://github.com/xqscora/mechanism-duel
- Live demo: https://xqscora.github.io/mechanism-duel/
- A fresh screenshot and demo video still need to be captured for the experiment-timeline version; earlier preview assets are not used as submission evidence.
- Devpost: no project draft or submission yet. The project-creation controls were blocked by reCAPTCHA.

Before final submission, verify dependency notices, recheck the current rules and author disclosures, and upload the demo to an allowed video host. The original project source currently has no reuse license; it is viewable in the repository, but no additional reuse permission is granted.
