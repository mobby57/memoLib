// MDX module declarations for TypeScript
// Allows importing MDX files as React components

declare module '*.mdx' {
  import type { ComponentType } from 'react';

  export const frontmatter: Record<string, unknown>;

  const MDXComponent: ComponentType<{
    components?: Record<string, ComponentType>;
  }>;

  export default MDXComponent;
}
