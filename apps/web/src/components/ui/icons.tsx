import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  Home,
  Image as ImageLucide,
  List,
  LocateFixed,
  Map as MapLucide,
  MapPin,
  Minus,
  Mountain,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Tent,
  User,
  X,
  CircleAlert,
  Handshake,
  PackageSearch,
  Send,
  LockKeyhole,
  Backpack,
  type LucideProps,
} from 'lucide-react';

// The one line-icon set (Lucide). Decorative: the control that holds an icon carries the accessible
// name. Stroke weight is set once in base.css (.lucide).
type IconProps = Omit<LucideProps, 'ref'>;
function wrap(Component: typeof Home) {
  return function LineIcon(p: IconProps) {
    return <Component aria-hidden="true" focusable="false" {...p} />;
  };
}

export const HomeIcon = wrap(Home);
export const MapIcon = wrap(MapLucide);
export const PlusIcon = wrap(Plus);
export const MinusIcon = wrap(Minus);
export const CalendarIcon = wrap(Calendar);
export const UserIcon = wrap(User);
export const SearchIcon = wrap(Search);
export const FilterIcon = wrap(SlidersHorizontal);
export const ListIcon = wrap(List);
export const CloseIcon = wrap(X);
export const CheckIcon = wrap(Check);
export const ChevronLeftIcon = wrap(ChevronLeft);
export const ChevronRightIcon = wrap(ChevronRight);
export const ChevronUpIcon = wrap(ChevronUp);
export const ChevronDownIcon = wrap(ChevronDown);
export const LocateIcon = wrap(LocateFixed);
export const PinIcon = wrap(MapPin);
export const StarIcon = (p: IconProps) => (
  <Star aria-hidden="true" focusable="false" fill="currentColor" strokeWidth={1.5} {...p} />
);
export const MountainIcon = wrap(Mountain);
export const TentIcon = wrap(Tent);
export const ImageIcon = wrap(ImageLucide);
export const ShieldCheckIcon = wrap(ShieldCheck);
export const CompassIcon = wrap(Compass);
export const AlertIcon = wrap(CircleAlert);
export const HandshakeIcon = wrap(Handshake);
export const FindIcon = wrap(PackageSearch);
export const SendIcon = wrap(Send);
export const LockIcon = wrap(LockKeyhole);
export const BackpackIcon = wrap(Backpack);
