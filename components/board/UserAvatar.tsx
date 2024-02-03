import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Hint from "@/components/Hint";

interface Props {
  src?: string;
  name?: string;
  fallback?: string;
  borderColor?: string;
}

function UserAvatar({ src, name, fallback, borderColor }: Props) {
  return (
    <Hint label={name || "Teammate"} side="bottom" sideOffset={18}>
      <Avatar className="h-8 w-8 border-2" style={{ borderColor }}>
        <AvatarImage src={src} />
        <AvatarFallback className="text-xs font-semibold">{fallback}</AvatarFallback>
      </Avatar>
    </Hint>
  );
}

export default UserAvatar;
