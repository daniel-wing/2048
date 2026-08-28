/**
 * Translating the engine's achievements.
 *
 * The engine owns the achievement list and ships English `label`/`description`
 * on each entry. Keys are built from its ids, which means the two can drift —
 * and they did: an earlier dictionary invented ids that never existed, so half
 * the Stats screen rendered `achv.tile-128.label` at the player.
 *
 * So this never trusts that a key is there. If one is missing, the engine's own
 * English wording is used, which is wrong-language but always real words.
 */

import type { Achievement } from '@2048/engine';

import { hasKey } from './strings';
import type { Translate } from './useT';

/** `tile-128`, `tile-2048`, ... — one parametric string covers the family. */
const TILE_ID = /^tile-(\d+)$/;

export function describeAchievement(
  achievement: Achievement,
  t: Translate,
): { label: string; description: string } {
  const tile = TILE_ID.exec(achievement.id);
  if (tile) {
    const value = tile[1];
    return {
      label: t('achv.tile.label', { value }),
      description: t('achv.tile.description', { value }),
    };
  }

  const labelKey = `achv.${achievement.id}.label`;
  const descriptionKey = `achv.${achievement.id}.description`;

  return {
    label: hasKey(labelKey) ? t(labelKey) : achievement.label,
    description: hasKey(descriptionKey) ? t(descriptionKey) : achievement.description,
  };
}
