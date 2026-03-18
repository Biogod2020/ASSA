# Evolution Patterns

## Patterns

```yaml
- pattern_id: TS_TEMPLATE_LITERAL_TYPES
  category: Typescript
  rule: Use Template Literal Types for string union manipulation in TS.
  rca: String union manipulations were previously manual or error-prone, leading to type safety gaps. Template literal types enable programmatic and precise string manipulation within the type system.
  tags:
    - ts
    - types
  status: PROCESSED

- pattern_id: SEC_FS_PATH_SANITIZATION
  category: Security
  rule: Always sanitize user-provided file paths to prevent directory traversal.
  rca: Unsanitized file paths are a primary vector for directory traversal attacks, allowing unauthorized access to sensitive system files. Normalization and validation ensure operations stay within intended boundaries.
  tags:
    - security
    - fs
  status: PROCESSED

- pattern_id: ARCH_FUNCTIONAL_COMPOSITION
  category: Architecture
  rule: Prefer functional composition over deep class inheritance.
  rca: Deep inheritance hierarchies create brittle systems where changes in base classes have unpredictable side effects. Functional composition promotes decoupling, reusability, and easier testing.
  tags:
    - architecture
    - fp
  status: PROCESSED
```
