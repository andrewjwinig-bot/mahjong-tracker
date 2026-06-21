import Tile from './Tile';
import type { TileAvatar } from '../lib/social';

/** Renders a member's tile avatar. */
export default function Avatar({ avatar, size = 40 }: { avatar: TileAvatar; size?: number }) {
  return <Tile face={avatar.face} char={avatar.char} color={avatar.color} size={size} />;
}
