"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useQuery } from "convex/react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useRenameModal } from "@/hooks/use-rename-modal";
import { Poppins } from "next/font/google";
import Hint from "@/components/Hint";
import Actions from "@/components/Actions";
const font = Poppins({ subsets: ["latin"], weight: ["600"] });

interface Props {
  boardId: string;
}

function TabSeparator() {
  return <div className="text-neutral-300 px-1.5">|</div>;
}

function Info({ boardId }: Props) {
  const { onOpen } = useRenameModal();

  const data = useQuery(api.Board.getById, {
    id: boardId as Id<"Board">
  });

  if (!data) return <Info.Skeleton />;

  return (
    <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md">
      <Hint label="Go to boards" side="bottom" sideOffset={10}>
        <Button asChild variant="board" className="px-2">
          <Link href="/">
            <Image src="/logo.svg" alt="Board logo" height={40} width={40} />
            <span className={cn("font-semibold text-xl ml-2 text-black", font.className)}>Miro</span>
          </Link>
        </Button>
      </Hint>

      <TabSeparator />

      <Hint label="Edit title" side="bottom" sideOffset={10}>
        <Button variant="board" className="text-base font-normal px-2" onClick={() => onOpen(data._id, data.title)}>
          {data.title}
        </Button>
      </Hint>

      <TabSeparator />

      <Actions id={data._id} title={data.title} side="bottom" sideOffset={10}>
        <div>
          <Hint label="Main menu" side="bottom" sideOffset={10}>
            <Button size="icon" variant="board">
              <Menu />
            </Button>
          </Hint>
        </div>
      </Actions>
    </div>
  );
}

Info.Skeleton = function InfoSkeleton() {
  return <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md w-[300px]" />;
};

export default Info;
