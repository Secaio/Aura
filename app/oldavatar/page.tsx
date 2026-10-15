"use client";

import { useState, useEffect } from "react";
import Avatar from "@/components/Avatar";
import { AvatarController } from "@/lib/avatarController";
import { LipSyncController } from "@/lib/lipsync";
import "../globals.css";
import Topbar from "@/components/Topbar";

export default function Page() {

  const [avatarCtrl, setAvatarCtrl] = useState<AvatarController | null>(null);
  const [lipSyncCtrl, setLipSyncCtrl] = useState<LipSyncController | null>(null);

  useEffect(() => {
    if (avatarCtrl) {
      (window as any).avatar = avatarCtrl;
      console.log("[MAIN] AvatarController disponível em window.avatar");
    }

    if (lipSyncCtrl) {
      (window as any).lipSync = lipSyncCtrl;
      console.log("[MAIN] LipSyncController disponível em window.lipSync");
    }
  }, [avatarCtrl, lipSyncCtrl]);

  return (
    <div className="main">
      <Avatar
        onReady={setAvatarCtrl}
        onLipSyncReady={setLipSyncCtrl}
      />
    </div>
  );
}
