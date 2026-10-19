# StudyX — Phase 1: Foundation, Dashboard, Subject Tracker

Stack-agnostic. One shared data layer feeds every tab.

## Core data model

| Entity | Fields |
| --- | --- |
| StudySession | id, date, startTime, durationMin, subjectId, chapterId (optional), source (timer / manual) |
| Todo | id, text, done, createdAt, subjectId / chapterId (optional) |
| Subject | id, name (Physics / Chemistry / Maths) |
| Chapter | id, subjectId, name, group (Physical / Inorganic / Organic, chemistry only), order |
| ChapterProgress | chapterId, percentDone (0-100), pyq {2022, 2023, 2024, 2025, 2026: bool}, notes (text), completed (derived) |

**Derived values** (never stored, always computed):

- `completed` = percentDone >= 90 and at least one PYQ year ticked
- `dailyMinutes[date]` = sum of StudySession.durationMin for that date
- `todayTotal` = dailyMinutes for today
- `streak` = consecutive days ending today (or yesterday, if today has no session yet) with dailyMinutes > 60

**Interconnection rules:**

1. The focus timer writes a StudySession. The dashboard total, streak, heatmap and study logs graph all read from it.
2. A session tagged with a chapter lets the subject tracker show hours per chapter.
3. A to-do tagged with a chapter can link to that chapter. Completing the chapter can auto-tick linked to-dos.

---

## Step 1. Data layer

- Create the entities above with CRUD, plus a single `useStudyData` store (or equivalent) exposing the derived values.
- Seed Subject and Chapter with the full list below. Keep `order` as given.

### Physics — 24 chapters

1. Units & Dimension
2. Kinematics
3. Laws of Motion & Friction
4. Circular Motion
5. Work, Energy & Power
6. Centre of Mass
7. Rotational Motion
8. Simple Harmonic Motion
9. Sound Waves
10. Properties of Matter & Fluid Mechanics
11. Thermal Physics
12. KTG and Thermodynamics
13. Electrostatics
14. Gravitation
15. Current Electricity
16. Capacitance
17. Magnetic Effect of Current & Magnetism
18. Electromagnetic Induction
19. Alternating Current & EM Waves
20. Modern Physics
21. Ray Optics
22. Wave Nature of Light & Wave Optics
23. Error & Measurement
24. Semiconductor

### Mathematics — 33 chapters

1. Logarithm
2. Trigonometric Ratios & Identities
3. Trigonometric Functions
4. Quadratic Equation
5. Sequence and Series
6. Permutation & Combination
7. Binomial Theorem
8. Complex Number
9. Determinant
10. Matrices
11. Straight Line
12. Circle
13. Parabola
14. Ellipse
15. Hyperbola
16. Function
17. ITF
18. Limit
19. Continuity
20. Differentiability
21. Methods of Differentiation
22. Monotonicity
23. Maxima-Minima
24. Tangent & Normal
25. Indefinite Integration
26. Definite Integration
27. Differential Equation
28. Area Under the Curve
29. Vector
30. 3D-Coordinate Geometry
31. Probability
32. Statistics
33. Sets & Relations

### Chemistry — 42 chapters

**Physical Chemistry — 14**

1. Mole Concept
2. Thermodynamics
3. Thermochemistry
4. Chemical Equilibrium
5. Ionic Equilibrium
6. Redox
7. Electrochemistry
8. Chemical Kinetics
9. Radioactivity
10. Liquid Solution
11. Solid State
12. Gaseous State
13. Atomic Structure
14. Surface Chemistry

**Inorganic Chemistry — 11**

1. Periodic Properties
2. Chemical Bonding
3. s-Block Elements
4. p-Block Elements
5. Coordination Chemistry
6. d-Block
7. Metallurgy
8. Salt Analysis
9. Environment Chemistry
10. Hydrogen & Its Compound
11. f-Block

**Organic Chemistry — 17**

1. IUPAC Nomenclature
2. GOC
3. Isomerism
4. Practical Organic Chemistry
5. Reduction & Oxidation
6. Hydrocarbons
7. Halogen derivatives
8. Grignard Reagents
9. Alcohol & Ether
10. Carboxylic Acid & derivatives
11. Aromatic Compounds
12. Carbonyl Compounds
13. Amines
14. Organic Reagents
15. Biomolecules
16. Polymers
17. Chemistry in Everyday Life

---

## Step 2. Dashboard

- Delete the average score, mindset and productivity components, plus their state and routes.
- Top row: **Today's Study Hours** on the left, with a small fire-emoji streak pill (🔥 + streak count) beside it. The pill is display only for now.
- Add a To-Do card with an add input, checkbox toggle, delete, and an optional chapter tag. Sort incomplete first, then newest.

## Step 3. Subject Tracker

- Three subject tabs. Chemistry is grouped under Physical / Inorganic / Organic headers.
- Each chapter row shows its name, a progress bar, a completed badge, and the PYQ count (x/5).
- The chapter detail (expand or modal) has:
  - A slider or input for % done (0-100)
  - Five PYQ checkboxes: 2022, 2023, 2024, 2025, 2026
  - A short notes textarea, autosaved with debounce
- Completion is computed live from the rule. A chapter at 95% with zero PYQs is not completed, and the unmet condition shows inline ("Needs at least 1 PYQ year").
- Header per subject: chapters completed / total, plus average % done.

---

## Phase 1 done when

- The dashboard reflects the changes and the to-do list works.
- All 99 chapters load (24 + 33 + 42).
- Completion logic is correct.
- Streak and today's hours render from StudySession data (create sessions manually for testing).
