import Canvas from "@/components/board/Canvas";

function Page({ params }: { params: { boardId: string } }) {
  return (
    // <Room roomId={params.boardId} fallback={<Loading />}>
    //   <Canvas boardId={params.boardId} />
    // </Room>
    <Canvas boardId={params.boardId} /> //sil
  );
}

export default Page;
