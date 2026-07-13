import * as React from "react";
import { useRecoilValue } from "recoil";

import { connectionConfig } from "@/data/recoil";
import { useConnectionState, useTick } from "@/view/hooks/hooks";

const TICK_INTERVAL_MONITOR = 10 * 1000;

export const useSimulationMonitor = (enabled: boolean) => {
  const config = useRecoilValue(connectionConfig);
  const { initialized } = useConnectionState();

  const monitorTick = React.useCallback(
    (ctx: AbortController) => {
      // Telco demo uses direct database inserts, no pipeline monitoring needed
      return Promise.resolve();
    },
    [config]
  );

  useTick(monitorTick, {
    name: "SimulatorMonitor",
    enabled: initialized && enabled,
    intervalMS: TICK_INTERVAL_MONITOR,
  });
};
