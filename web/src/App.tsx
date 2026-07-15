import { CheckCircleIcon, CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Center,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import * as React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useRecoilState } from "recoil";

import { AnalystChat } from "@/components/AnalystChat";
import { Loader } from "@/components/customcomponents/loader/Loader";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/navBar/Nav";
import { ExecutiveDashboard } from "@/pages/ExecutiveDashboard";
import { Configure } from "@/pages/Configure";
import { HomePage } from "@/pages/HomePage";
import { useConnectionState } from "@/view/hooks/hooks";

import { showWelcomeMessage } from "./data/recoil";

const WelcomeMessageToast = () => {
  const [welcomeMessage, setwelcomeMessage] =
    useRecoilState(showWelcomeMessage);
  const toast = useToast();
  const { connected } = useConnectionState();
  const defaultFontTheme = useColorModeValue("white", "black");

  const ToastDescriptionComponent = () => {
    return (
      <Text style={{ fontWeight: 400, fontSize: "16px" }}>
        <Heading size="sm">Welcome!</Heading>
        Monitor real-time subscriber health, network performance, and churn risk across your communications network. You can:
        <ul style={{ listStylePosition: "inside", listStyleType: "initial" }}>
          <li>View market degradation and service quality metrics</li>
          <li>Identify at-risk high-value subscribers</li>
          <li>Ask Aura Analyst about network and subscriber data</li>
        </ul>
      </Text>
    );
  };

  const ToastBlock = () => (
    <Flex
      direction="row"
      justifyContent="center"
      position="relative"
      alignItems="center"
      gap="12px"
      padding="18px"
      color={defaultFontTheme}
      borderRadius="10px"
      background={useColorModeValue("#0C7BDC", "#2A9DF4")}
    >
      <CloseIcon
        fontSize="xx-small"
        position="absolute"
        top="23px"
        right="23px"
        cursor="pointer"
        onClick={() => toast.close("welcomeToast")}
      />
      <CheckCircleIcon color={defaultFontTheme} margin="15px" fontSize="lg" />
      <ToastDescriptionComponent />
    </Flex>
  );

  if (connected && welcomeMessage) {
    toast({
      id: "welcomeToast",
      duration: 9000,
      isClosable: true,
      position: "bottom",
      render: () => <ToastBlock />,
    });
  }
  setwelcomeMessage(false);

  return <></>;
};

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { connected, isValidatingConnection } = useConnectionState();

  if (!connected && !isValidatingConnection) {
    return <Navigate to="/" />;
  }

  return (
    <LayoutContainer>
      <WelcomeMessageToast />
      {children}
    </LayoutContainer>
  );
};

const LayoutContainer = ({ children }: { children: React.ReactNode }) => {
  const { connected, isValidatingConnection } = useConnectionState();
  let childComponent = <Loader size="large" centered />;

  if (connected || !isValidatingConnection) {
    childComponent = (
      <React.Suspense fallback={<Center h="100%"><Spinner size="xl" /></Center>}>
        {children}
      </React.Suspense>
    );
  }

  return (
    <>
      <Nav />
      <Box flex="1" paddingTop="3px">
        {childComponent}
      </Box>
      <Footer />
    </>
  );
};

const RoutesBlock = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <React.Suspense fallback={<Center h="100vh"><Spinner size="xl" /></Center>}>
              <ExecutiveDashboard />
            </React.Suspense>
          </PrivateRoute>
        }
      />
      <Route
        path="/configure"
        element={
          <LayoutContainer>
            <Configure />
          </LayoutContainer>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => {
  const { connected } = useConnectionState();
  const loadingFallback = (
    <Center height="100vh">
      <Loader size="large" centered />
    </Center>
  );

  return (
    <React.Suspense fallback={loadingFallback}>
      <Flex height="100vh" width="100vw" direction="column" overflowY="auto">
        <RoutesBlock />
      </Flex>
      {/* Render AnalystChat at top level so it never unmounts during navigation */}
      {connected && <AnalystChat />}
    </React.Suspense>
  );
};

export default App;
