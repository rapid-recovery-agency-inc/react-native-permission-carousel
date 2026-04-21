# Copilot Instructions

This file contains instructions for GitHub Copilot on how to generate code that adheres to the project's coding standards and conventions. Please follow these guidelines when generating code.

- This is an internal library for React Native applications.
- The codebase uses TypeScript and follows strict typing conventions.

# File and folder structure

- Module folders must be in kebab-case
- Component files must be in PascalCase
- Each component could have `hooks.ts`, `utils.ts`, `types.ts` files as needed
- Components under `src/components` and hooks under `src/hooks` are exported via the central barrel file `src/index.ts`; when adding a new component or hook, ensure it is exported from `src/index.ts` following the existing pattern

# Component documentation and tests

- Each component should have a corresponding test file in `src/components/[ComponentName].test.tsx`
- If adding new functionality, ensure to tests covering the new behavior

# Style conventions

- We use an internal UI library `@rapid-recovery-agency-inc/sloth-ui-mobile` for components and styles

# Contributing guidelines

- Follow the existing code style and conventions
- Don't add new non-optional props to existing components
- If a component needs new functionality, create a new component version (e.g., `ComponentV2.tsx`) and deprecate the old one
- If you need to make aesthetic changes of an existing component, make sure to control it through a prop rather than hardcoding values
