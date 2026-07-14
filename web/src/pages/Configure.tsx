import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  VStack,
  useBoolean,
  useColorModeValue,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  HStack,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon, CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import * as React from "react";
import { useRecoilState, useRecoilValue } from "recoil";

import {
  connectionHost,
  connectionUser,
  connectionPassword,
  connectionDatabase,
  analystApiKey,
  analystEndpointUrl,
  connectionConfig,
} from "@/data/recoil";
import { schemaObjects, resetSchema } from "@/data/queries";

export const Configure: React.FC = () => {
  const [host, setHost] = useRecoilState(connectionHost);
  const [user, setUser] = useRecoilState(connectionUser);
  const [password, setPassword] = useRecoilState(connectionPassword);
  const [database, setDatabase] = useRecoilState(connectionDatabase);
  const [apiKey, setApiKey] = useRecoilState(analystApiKey);
  const [endpointUrl, setEndpointUrl] = useRecoilState(analystEndpointUrl);
  const config = useRecoilValue(connectionConfig);

  const [showPassword, setShowPassword] = useBoolean();
  const [showApiKey, setShowApiKey] = useBoolean();
  const [schemaStatus, setSchemaStatus] = React.useState<{ [key: string]: boolean } | null>(null);
  const [isCheckingSchema, setIsCheckingSchema] = React.useState(false);
  const [isResettingSchema, setIsResettingSchema] = React.useState(false);

  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const checkSchema = async () => {
    setIsCheckingSchema(true);
    try {
      const status = await schemaObjects(config);
      setSchemaStatus(status);
    } catch (error) {
      toast({
        title: "Error checking schema",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsCheckingSchema(false);
    }
  };

  const handleResetSchema = async () => {
    const hasMissingObjects = schemaStatus && Object.values(schemaStatus).some(exists => !exists);
    const hasExistingObjects = schemaStatus && Object.values(schemaStatus).some(exists => exists);

    let confirmMessage = "This will create the telco database with all tables, views, and stored procedures. Continue?";

    if (hasExistingObjects) {
      confirmMessage = "⚠️ This will DROP all existing tables, views, and procedures, then recreate everything from scratch. All data will be lost. Continue?";
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsResettingSchema(true);
    try {
      await resetSchema(config);
      toast({
        title: "Database setup successful",
        description: "Database has been created and populated with schema, seed data, and procedures",
        status: "success",
        duration: 5000,
      });
      await checkSchema();
    } catch (error) {
      toast({
        title: "Error setting up database",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsResettingSchema(false);
    }
  };

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Configuration</Heading>
          <Text color="gray.600">Configure database and Aura Analyst settings</Text>
        </Box>

        <Box
          bg={bgColor}
          border="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
        >
          <Heading size="md" mb={4}>Database Connection</Heading>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Host</FormLabel>
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="http://127.0.0.1"
              />
            </FormControl>

            <FormControl>
              <FormLabel>User</FormLabel>
              <Input
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="admin"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={setShowPassword.toggle}
                    size="sm"
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Database</FormLabel>
              <Input
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="telco"
              />
            </FormControl>
          </Stack>
        </Box>

        <Box
          bg={bgColor}
          border="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
        >
          <Heading size="md" mb={4}>Database Setup</Heading>
          <Text color="gray.600" mb={4}>
            Create and populate the telco database with schema and seed data.
          </Text>
          <Alert status="info" mb={4} fontSize="sm">
            <AlertIcon />
            <Box>
              <AlertTitle>Note:</AlertTitle>
              <AlertDescription>
                Stored procedures must be created manually. After setup, run in SQL Editor:<br/>
                <Text as="code" fontSize="xs">SOURCE procedures.sql;</Text>
              </AlertDescription>
            </Box>
          </Alert>

          <Stack spacing={4}>
            <HStack spacing={4}>
              <Button
                onClick={checkSchema}
                isLoading={isCheckingSchema}
                loadingText="Checking..."
                size="md"
                variant="outline"
              >
                Check Schema
              </Button>
              <Button
                onClick={handleResetSchema}
                isLoading={isResettingSchema}
                loadingText="Setting up..."
                size="md"
                colorScheme="blue"
              >
                Setup Database
              </Button>
            </HStack>

            {schemaStatus && Object.keys(schemaStatus).length > 0 && (
              <Box>
                <Text fontWeight="medium" mb={2}>Schema Status:</Text>
                {Object.values(schemaStatus).some(exists => !exists) && (
                  <Alert status="warning" mb={3} fontSize="sm">
                    <AlertIcon />
                    Some objects are missing. Click "Setup Database" to create them.
                    ⚠️ This will drop and recreate ALL objects.
                  </Alert>
                )}
                <Stack spacing={2}>
                  {Object.entries(schemaStatus).map(([name, exists]) => (
                    <HStack key={name}>
                      {exists ? (
                        <CheckCircleIcon color="green.500" />
                      ) : (
                        <WarningIcon color="orange.500" />
                      )}
                      <Text fontSize="sm">{name}</Text>
                      <Badge colorScheme={exists ? "green" : "orange"}>
                        {exists ? "exists" : "missing"}
                      </Badge>
                    </HStack>
                  ))}
                </Stack>
              </Box>
            )}

            {schemaStatus && Object.keys(schemaStatus).length === 0 && (
              <Alert status="warning">
                <AlertIcon />
                <AlertDescription>
                  Database not found. Click "Setup Database" to create it.
                </AlertDescription>
              </Alert>
            )}
          </Stack>
        </Box>

        <Box
          bg={bgColor}
          border="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
        >
          <Heading size="md" mb={4}>Aura Analyst</Heading>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>API Key</FormLabel>
              <InputGroup>
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter Aura Analyst API key"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                    icon={showApiKey ? <ViewOffIcon /> : <ViewIcon />}
                    onClick={setShowApiKey.toggle}
                    size="sm"
                    variant="ghost"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Endpoint URL</FormLabel>
              <Input
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://your-analyst-endpoint"
              />
            </FormControl>
          </Stack>
        </Box>

        <Flex justify="flex-end">
          <Button colorScheme="blue" size="lg">
            Save Configuration
          </Button>
        </Flex>
      </VStack>
    </Container>
  );
};
