import { HostMainMenu } from "@/components/ui/8bit/host-main-menu";
import bossBattleTitleImage from "../../../specs/001-qr-game-join/contracts/bossbattletitle.jpg";

interface HostSessionLauncherProps {
  activeJoinCode?: string;
  onCreateSession: () => void;
  onResumeSession?: () => void;
  pending?: boolean;
}

export function HostSessionLauncher({
  activeJoinCode,
  onCreateSession,
  onResumeSession,
  pending = false,
}: HostSessionLauncherProps) {
  return (
    <HostMainMenu
      eyebrow="Boss Battle Lobby"
      heroImageAlt="Boss Battle title art"
      heroImageSrc={bossBattleTitleImage}
      title="Start a Boss Battle session."
      description={
        activeJoinCode
          ? `A session is already live with join code ${activeJoinCode}. Create a fresh lobby for a new room, or resume the live session from the main screen.`
          : "Create a lobby, show the QR code, and bring players into the fight from their phones."
      }
      primaryActionLabel="Create Session"
      onPrimaryAction={onCreateSession}
      secondaryActionLabel={
        activeJoinCode && onResumeSession ? "Resume Session" : undefined
      }
      onSecondaryAction={activeJoinCode ? onResumeSession : undefined}
      pending={pending}
    />
  );
}
