"use client";

import { Loader } from "lucide-react";
import Toolbar from "./Toolbar";
import Participants from "./Participants";
import Info from "./Info";

function BoardLoading() {
  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none flex items-center justify-center">
      <Loader className="h-6 w-6 text-muted-foreground animate-spin" />
      <Info.Skeleton />
      <Participants.Skeleton />
      <Toolbar.Skeleton />
    </main>
  );
}

export default BoardLoading;
