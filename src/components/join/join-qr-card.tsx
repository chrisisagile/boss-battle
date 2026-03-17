import { QRCodeSVG } from "qrcode.react";

interface JoinQrCardProps {
  joinCode: string;
  joinUrl: string;
}

export function JoinQrCard({ joinCode, joinUrl }: JoinQrCardProps) {
  return (
    <div className="grid gap-6 border-4 border-amber-300/50 bg-black/20 p-5 md:grid-cols-[auto_1fr]">
      <div className="flex justify-center bg-stone-50 p-4">
        <QRCodeSVG size={208} value={joinUrl} />
      </div>
      <div className="space-y-4">
        <div>
          <p className="retro text-[10px] text-amber-200 uppercase tracking-[0.24em]">
            Join Code
          </p>
          <p className="mt-2 font-black text-4xl text-stone-50 tracking-[0.22em]">
            {joinCode}
          </p>
        </div>
        <p className="text-sm text-stone-200 leading-7">
          Scan the code with your phone or open the join screen and enter the
          code manually if the camera angle is rough.
        </p>
        <p className="text-stone-400 text-xs uppercase tracking-[0.18em]">
          Mobile path: {joinUrl}
        </p>
      </div>
    </div>
  );
}
