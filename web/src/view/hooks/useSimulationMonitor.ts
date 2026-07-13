import * as React from "react";
import { useRecoilValue } from "recoil";

import { connectionConfig } from "@/data/recoil";
import { useConnectionState, useTick } from "@/view/hooks/hooks";
import { useSession } from "@/view/hooks/useSession";

const TICK_INTERVAL_MONITOR = 10 * 1000;

export const useSimulationMonitor = (enabled: boolean) => {
  const config = useRecoilValue(connectionConfig);
  const { initialized } = useConnectionState();
  const { session } = useSession();

  const monitorTick = React.useCallback(
    (ctx: AbortController) => {
      // Telco demo uses direct database inserts, no pipeline monitoring needed
      return Promise.resolve();
    },
    [config]
  );

  useTick(monitorTick, {
    name: "SimulatorMonitor",
    enabled: initialized && enabled && session.isController,
    intervalMS: TICK_INTERVAL_MONITOR,
  });
};
