import BoardLoading from "@/components/board/BoardLoading";
import Canvas from "@/components/board/Canvas";
import Room from "@/components/board/Room";

function Page({ params }: { params: { boardId: string } }) {
  return (
    <Room roomId={params.boardId} fallback={<BoardLoading />}>
      <Canvas boardId={params.boardId} />
    </Room>
  );
}

export default Page;
