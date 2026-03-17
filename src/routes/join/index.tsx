import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ManualJoinForm } from "@/components/join/manual-join-form";
import { ChapterIntro } from "@/components/ui/8bit/chapter-intro";

export const Route = createFileRoute("/join/")({
  component: JoinCodeRouteComponent,
});

export function JoinCodeEntryPage() {
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <ChapterIntro
        kicker="Phone Join"
        title="Enter the code from the projector."
        description="If the QR code is hard to scan from your seat, type the six-character code here and jump straight into the lobby."
      />
      <ManualJoinForm
        onSubmit={(joinCode) => {
          void navigate({ to: "/join/$joinCode", params: { joinCode } });
        }}
      />
    </main>
  );
}

function JoinCodeRouteComponent() {
  return <JoinCodeEntryPage />;
}
