# GenHacks Project Page Draft

## Mechanism Duel

**Two mechanisms can fit the same observation. Build a test that makes them disagree.**

### Inspiration

In biology, seeing one outcome does not always identify the mechanism that produced it. Different pathways can explain the same measurement. Mechanism Duel makes that ambiguity visible and turns it into a practical next question: which variable, timepoint, or intervention would best separate the competing explanations?

### What it does

The prototype compares a direct reaction (`S → P`) with a two-step route (`S → I → P`). It calibrates the staged route so both models agree at a selected reference measurement. Users can change reaction rates, assay noise, and the reference time; the app simulates both trajectories, ranks four candidate tests by their predicted separation relative to the stated noise, and previews the selected measurement.

### How it was built

The browser interface uses HTML, CSS, and JavaScript. The reaction ODEs are integrated using `@tangent.to/ode` (MIT). No AI model or external data is used by the running app. The models and intervention are deliberately small and explicit so users can inspect the assumptions.

### Prior art and contribution

Optimal experimental design for model discrimination is established research, including biochemical-network methods described by [Mélykúti et al. (2010)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2873315/). Existing biological modeling environments such as [Cell Collective](https://research.cellcollective.org/) also support interactive network modeling. Mechanism Duel does not claim a new scientific algorithm; its prototype contribution is a focused interaction that keeps rival explanations, a shared observation, stated assay noise, and candidate tests visible together.

### Scope and limits

This is an educational synthetic example, not a validated cell model, real biological prediction, medical tool, or experimental protocol. The separation score is not the probability that either mechanism is correct. Real tests require validated mechanisms, feasible perturbations, measurement calibration, and controls for off-target effects.

### Track

Open. The prototype is a general scientific-modeling education tool and does not claim a demonstrated health or environmental outcome.

### AI-use disclosure

AI coding assistance was used to draft implementation and tests. The project author must review and understand the code, verify the model behavior and attribution, and approve the final public materials before submission.
