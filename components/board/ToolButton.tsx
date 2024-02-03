"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Hint from "@/components/Hint";

interface Props {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
}

function ToolButton({ label, icon: Icon, onClick, isActive, isDisabled }: Props) {
  return (
    <Hint label={label} side="right" sideOffset={14}>
      <Button disabled={isDisabled} onClick={onClick} size="icon" variant={isActive ? "boardActive" : "board"}>
        <Icon />
      </Button>
    </Hint>
  );
}

export default ToolButton;
