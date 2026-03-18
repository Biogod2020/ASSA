# PATTERNS

- **documentation/package-integrity**: Always add a README to new packages. (from sig-1)
- **style/yaml-consistency**: Use 2 spaces for indentation in YAML files. (from sig-2)
- **typescript/type-visibility**: Export all public types from index.ts. (from sig-3)
- **style/naming-clarity**: Use descriptive variable names. (from sig-4)
- **testing/unit-coverage**: Implement unit tests for all new functions. (from sig-5)
- **release/versioning-standards**: Use semantic versioning for all releases. (from sig-6)

---

id: P-20260317-0001
category: Documentation
confidence: 10
status: Active
hit_count: 1

---

# README Consistency

**Rationale**: New packages often lack context, leading to discovery and onboarding barriers for other developers.
**Rule**: Every new package directory MUST contain a `README.md` file that explains its purpose and usage.

---

id: P-20260317-0002
category: Style
confidence: 10
status: Active
hit_count: 1

---

# YAML Styling Standards

**Rationale**: Mixed indentation in configuration files causes parsing errors and reduces overall project maintainability.
**Rule**: All `.yaml` and `.yml` files MUST use exactly 2-space indentation for all levels.

---

id: P-20260317-0003
category: TypeScript
confidence: 10
status: Active
hit_count: 1

---

# Public Type Export Strategy

**Rationale**: Scattered type definitions make it difficult for consumers to find and use public interfaces correctly.
**Rule**: All public TypeScript types and interfaces MUST be exported from the package's `index.ts` to provide a single point of entry.

---

id: P-20260317-0004
category: Style
confidence: 10
status: Active
hit_count: 1

---

# Descriptive Variable Naming

**Rationale**: Short or cryptic variable names increase cognitive load and obscure the underlying intent of the code.
**Rule**: Avoid single-letter variable names; use names that clearly describe the data or object they represent.

---

id: P-20260317-0005
category: Testing
confidence: 10
status: Active
hit_count: 1

---

# Mandatory Unit Testing

**Rationale**: Untested code is a significant technical liability. Immediate verification ensures long-term system reliability.
**Rule**: For every new function implemented, a corresponding unit test MUST be added to the appropriate test file.

---

id: P-20260317-0006
category: Release
confidence: 10
status: Active
hit_count: 1

---

# Semantic Versioning Integrity

**Rationale**: Arbitrary versioning masks breaking changes and prevents reliable dependency management for downstream users.
**Rule**: All releases MUST follow strict semantic versioning standards (MAJOR.MINOR.PATCH) to signal compatibility changes clearly.
