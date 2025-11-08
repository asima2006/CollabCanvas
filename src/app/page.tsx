import ClientOnly from "@/components/client-only";
import CollabCanvas from "@/components/collab-canvas";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-background font-sans">
      <ClientOnly>
        <CollabCanvas />
      </ClientOnly>
    </main>
  );
}
