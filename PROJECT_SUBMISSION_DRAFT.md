# GenHacks Project Page Draft

## Mechanism Duel

**Two mechanisms can fit the same observation. Build a test that makes them disagree.**

### Inspiration

In biology, seeing one outcome does not always identify the mechanism that produced it. Different pathways can explain the same measurement. Mechanism Duel makes that ambiguity visible and turns it into a practical next question: which variable, timepoint, or intervention would best separate the competing explanations?

### What it does

The prototype starts with a synthetic mechanism-discrimination case and adds an interactive reduced model of *E. coli* lactose regulation. In Case 01, it compares a direct reaction (`S → P`) with a two-step route (`S → I → P`) and ranks candidate measurements. In Case 02, users can schedule multiple changes to external lactose and glucose context, then observe intracellular lactose, allolactose, enzyme-expression, and growth-rate proxies evolve continuously across the intervention times. LacI repression and growth coupling can also be varied. This is a bounded experiment composer over two modeled medium variables, not an arbitrary-chemical or whole-cell simulator.

### How it was built

The browser interface uses HTML, CSS, and JavaScript. The reaction ODEs are integrated using `@tangent.to/ode` (MIT). No AI model or external data is used by the running app. The models and intervention are deliberately small and explicit so users can inspect the assumptions.

### Prior art and contribution

Optimal experimental design for model discrimination is established research, including biochemical-network methods described by [Mélykúti et al. (2010)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2873315/). Existing biological modeling environments such as [Cell Collective](https://research.cellcollective.org/) also support interactive network modeling. The lac case is informed by [Zander et al. (2017)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5425413/), which studied graded versus bistable induction and growth-dependent dilution in the natural lactose system. Mechanism Duel does not claim a new scientific algorithm or reproduce that paper's fitted model; its contribution is an inspectable, approachable experiment-design interaction that exposes the assumptions behind each prediction.

### Scope and limits

The lac case is a reduced, deterministic, dimensionless model. The experiment timeline permits repeated changes only to lactose and a normalized glucose-context input; an unmodeled chemical cannot be added and assigned invented effects. It omits stochastic single-cell variation, detailed DNA-loop operator states, full metabolism, and cell division. It is not a validated whole-cell simulation, a reproduction of experimental data, a medical tool, or an experimental protocol. The separation score is not the probability that either mechanism is correct. Real tests require validated mechanisms, feasible perturbations, measurement calibration, and controls for off-target effects.

### Track

Open. The prototype is a general scientific-modeling education tool and does not claim a demonstrated health or environmental outcome.

### Links and status

- Source code: https://github.com/xqscora/mechanism-duel
- Live interactive demo: https://xqscora.github.io/mechanism-duel/
- A fresh screenshot and demo video still need to be captured for the experiment-timeline version; earlier preview assets are not used as submission evidence.
- Devpost project: not created; the signed-in project-creation page is currently blocked by reCAPTCHA.

### AI-use disclosure

AI coding assistance was used to draft implementation and tests. The project author must review and understand the code, verify the model behavior and attribution, and approve the final public materials before submission.
