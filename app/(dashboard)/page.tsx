"use client";

import { useOrganization } from "@clerk/nextjs";
import EmptyOrg from "@/components/empty/EmptyOrg";
import BoardList from "@/components/dashboard/BoardList";

interface Props {
  searchParams: { search?: string; favorites?: string };
}

function Page({ searchParams }: Props) {
  const { organization } = useOrganization();

  return (
    <div className="flex-1 h-[calc(100%-80px)] p-6">
      {!organization && <EmptyOrg />}
      {organization && <BoardList orgId={organization.id} query={searchParams} />}
    </div>
  );
}

export default Page;
