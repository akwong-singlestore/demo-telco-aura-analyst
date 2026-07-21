import { Box, SimpleGrid, Stack, Tooltip, useToast } from "@chakra-ui/react";
import * as React from "react";
import { useRecoilState } from "recoil";

import { ConfigInput } from "@/components/ConfigInput";
import { connectToDB } from "@/data/queries";
import {
  connectionDatabase,
  connectionHost,
  connectionPassword,
  connectionUser,
} from "@/data/recoil";

import { InvertedPrimaryButton } from "../customcomponents/Button";
import { Loader } from "../customcomponents/loader/Loader";

type Props = {
  showDatabase?: boolean;
  showScaleFactor?: boolean;
};

export const DatabaseConfigFormManual = ({
  showDatabase,
  showScaleFactor,
}: Props) => {
  const toast = useToast();
  const [loading, setLoading] = React.useState(false);
  const [host, setHost] = useRecoilState(connectionHost);
  const [user, setUser] = useRecoilState(connectionUser);
  const [password, setPassword] = useRecoilState(connectionPassword);
  const [database, setDatabase] = useRecoilState(connectionDatabase);

  const [localHost, setLocalHost] = React.useState(host);
  const [localUser, setLocalUser] = React.useState(user);
  const [localPassword, setLocalPassword] = React.useState(password);
  const [localDatabase, setLocalDatabase] = React.useState(database);

  const connect = () => {
    setLoading(true);
    let database = "telco";
    if (localDatabase) {
      database = localDatabase;
    }
    const config = {
      host: localHost,
      password: localPassword,
      user: localUser,
      database,
    };
    connectToDB(config).then((connected) => {
      setLoading(false);
      if (connected === true) {
        setHost(localHost);
        setUser(localUser);
        setPassword(localPassword);
        setDatabase(database);
      } else {
        toast({
          title: "An error occured",
          description: `Connection failed`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    });
  };

  const connectDisabled =
    localHost === "" || localUser === "" || localPassword === "" || loading;

  let databaseInput;
  if (showDatabase) {
    databaseInput = (
      <ConfigInput
        label="Telco Database Name"
        placeholder="telco"
        required
        value={localDatabase}
        setValue={setLocalDatabase}
      />
    );
  }

  // ScaleFactor not used in telco demo

  let connectButtonContainer = <>Connect</>;
  if (loading) {
    connectButtonContainer = (
      <Box display="flex">
        <Loader size="small" />
        &nbsp;Connecting...
      </Box>
    );
  }

  const handleEnterKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key.toLowerCase() === "enter") {
      connect();
    }
  };

  return (
    <Stack spacing={4} onKeyDown={handleEnterKeyPress}>
      <ConfigInput
        label="Workspace Host"
        placeholder="http://127.0.0.1"
        value={localHost}
        required
        setValue={setLocalHost}
        helpText="Your workspace hostname."
      />
      <SimpleGrid columns={2} gap={2}>
        <ConfigInput
          label="Workspace Group Username"
          required
          helpText="Fill in the Security credentials of your workspace group."
          placeholder="admin"
          value={localUser}
          setValue={setLocalUser}
        />
        <ConfigInput
          label="Workspace Group Password"
          required
          placeholder=""
          value={localPassword}
          setValue={setLocalPassword}
          type="password"
        />
      </SimpleGrid>
      {databaseInput}

      <Tooltip
        shouldWrapChildren
        isDisabled={!connectDisabled}
        hasArrow
        label="Fill in the required details to connect"
      >
        <InvertedPrimaryButton
          width="100%"
          alignItems="center"
          isDisabled={connectDisabled}
          onClick={connect}
        >
          {connectButtonContainer}
        </InvertedPrimaryButton>
      </Tooltip>
    </Stack>
  );
};
