// Emit JSON Schema for the .repospec/ artifacts from the zod schemas that are
// the source of truth (ADR-0005). Run `pnpm schema` after `pnpm build`. CI
// regenerates and fails on drift, so the published schema always matches code.
import { writeFileSync, mkdirSync } from 'node:fs';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  ProjectSchema,
  AgentSchema,
  RuleSchema,
  PROTOCOL_VERSION,
} from '@repospec/protocol';

const BASE = 'https://raw.githubusercontent.com/npxchaos/repospec/main/schemas';
const dir = `schemas/${PROTOCOL_VERSION}`;
mkdirSync(dir, { recursive: true });

const artifacts = [
  ['project', ProjectSchema, 'Repospec project.yaml'],
  ['agent', AgentSchema, 'Repospec agent frontmatter'],
  ['rule', RuleSchema, 'Repospec rule frontmatter'],
];

for (const [name, schema, title] of artifacts) {
  const json = zodToJsonSchema(schema, {
    target: 'jsonSchema7',
    $refStrategy: 'none',
  });
  const out = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `${BASE}/${PROTOCOL_VERSION}/${name}.schema.json`,
    title,
    ...json,
  };
  writeFileSync(
    `${dir}/${name}.schema.json`,
    JSON.stringify(out, null, 2) + '\n',
  );
  console.log(`wrote ${dir}/${name}.schema.json`);
}
