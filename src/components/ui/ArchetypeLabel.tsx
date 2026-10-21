/**
 * An archetype's glyph and name, drawn the same everywhere it's named (match setup,
 * the pre-match screen, the opponent preview, the key moment header), so a player has
 * seen the mark several times before a key moment asks them to act on it.
 */

import React from 'react';
import { ARCHETYPE_DATA, type ArchetypeType } from '../../data/archetypes';
import { PixelIcon } from './PixelIcon';

function isArchetype(type: string): type is ArchetypeType {
  return type in ARCHETYPE_DATA;
}

export function ArchetypeLabel({ archetype }: { archetype: string }): React.JSX.Element {
  if (!isArchetype(archetype)) return <span>Unknown</span>;
  const data = ARCHETYPE_DATA[archetype];
  return (
    <span className="inline-flex items-center gap-1.5">
      <PixelIcon grid={data.glyph} scale={1} />
      {data.label}
    </span>
  );
}
