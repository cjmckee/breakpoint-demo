/**
 * A court surface as its pixel icon in the surface's colour. A match with no
 * surface yet (an unscheduled team match) shows a tennis ball.
 */

import React from 'react';
import type { CourtSurface } from '../../types';
import { BALL_ICON, ICON_PALETTE, SURFACE_COLOURS, SURFACE_ICONS } from '../../data/pixelIcons';
import { PixelIcon } from './PixelIcon';

interface SurfaceIconProps {
  surface: CourtSurface | undefined;
  /** Screen pixels per grid pixel: 1 beside text, 2 or 3 as a card's lead icon. */
  scale?: number;
  className?: string;
}

export function SurfaceIcon({
  surface,
  scale = 1,
  className,
}: SurfaceIconProps): React.JSX.Element {
  return surface ? (
    <PixelIcon
      grid={SURFACE_ICONS[surface]}
      color={SURFACE_COLOURS[surface]}
      scale={scale}
      className={className}
    />
  ) : (
    <PixelIcon grid={BALL_ICON} color={ICON_PALETTE.y} scale={scale} className={className} />
  );
}
