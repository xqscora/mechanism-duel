# Mechanism Duel

**A question before an answer:** compare two mechanisms that fit the same observation, then find a measurement or perturbation that would make their predictions diverge.

This is a new GenHacks 2026 prototype started on 2026-11-12. It is separate from the Syn3A Cell Lab project. The first case is a synthetic first-order reaction: a direct `S → P` route and a staged `S → I → P` route are calibrated to match one product measurement. The user changes rates, the reference time and the assumed assay noise, then compares candidate experiments.

Model discrimination and optimal experiment design are established systems-biology topics, not a new claim of this project. This prototype focuses on making that reasoning inspectable in one interaction. See [Mélykúti et al. (2010)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2873315/) and the network modeling environment [Cell Collective](https://research.cellcollective.org/).

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

Open `http://127.0.0.1:8522/`. The app makes no network calls at runtime; the bundled ODE solver is attributed in `LICENSES.md`, with its license text in `ODE-LICENSE.txt`. System sans-serif and monospace fonts are used locally.

## Scientific scope

The plotted values are predictions of two idealized toy mechanisms, not observations from cells and not an estimate of any real biological system. The calibration makes both models agree at one chosen product readout; it does not validate either mechanism. The noise-normalized separation is a comparison aid, not a posterior probability, confidence level, or claim that an intervention is experimentally feasible. The second-step block is an idealized, model-specific perturbation with no off-target effects.

No AI model, external dataset, personal data, or medical recommendation is used. The project was built with AI coding assistance; that assistance will be disclosed in the final submission.

## Competition submission draft

- Project name: **Mechanism Duel**
- Elevator pitch: **Two mechanisms can fit the same observation. Build a test that makes them disagree.**
- Track: **Open**. The prototype is a general scientific-modeling education tool; it does not claim a demonstrated health or environmental outcome.
- Code: local project only; no public repository has been created.
- Demo: not recorded or uploaded.
- Submission: not submitted.

Before final submission, verify dependency notices, recheck the current rules and author disclosures, and record a truthful demo. The original project source currently has no reuse license; it is viewable in the repository, but no additional reuse permission is granted.
