import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  useColorMode,
  useColorModeValue,
  Badge,
  Avatar,
  Select,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  MoonIcon,
  SunIcon,
  SettingsIcon,
  RepeatIcon,
} from "@chakra-ui/icons";
import { MdAccessTime } from "react-icons/md";
import * as React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useRecoilState } from "recoil";
import { timeWindow } from "@/data/recoil";

import SingleStoreLogoLight from "@/assets/singlestore-logo-light.svg";
import SingleStoreLogoDark from "@/assets/singlestore-logo-dark-new.svg";

export const Nav: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const [selectedTimeWindow, setSelectedTimeWindow] = useRecoilState(timeWindow);

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box
      as="nav"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={6}
      py={3}
    >
      <Flex justify="space-between" align="center">
        {/* Left side - Logo and Title */}
        <HStack spacing={6}>
          <RouterLink to="/">
            <Image
              src={useColorModeValue(SingleStoreLogoDark, SingleStoreLogoLight)}
              alt="SingleStore"
              height="28px"
              objectFit="contain"
            />
          </RouterLink>

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
              fontWeight="semibold"
              fontSize="lg"
            >
              Subscriber Experience Command Center
            </MenuButton>
            <MenuList>
              <MenuItem as={RouterLink} to="/dashboard">
                Dashboard
              </MenuItem>
              <MenuItem as={RouterLink} to="/configure">
                Configure
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>

        {/* Right side - Time selector and controls */}
        <HStack spacing={4}>
          {/* Time Window Selector */}
          <HStack spacing={2}>
            <MdAccessTime />
            <Select
              size="sm"
              variant="outline"
              value={selectedTimeWindow}
              onChange={(e) => setSelectedTimeWindow(e.target.value)}
              width="140px"
              icon={<ChevronDownIcon />}
            >
              <option value="1h">Last 1 hour</option>
              <option value="2h">Last 2 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </Select>
          </HStack>

          {/* Refresh button */}
          <IconButton
            aria-label="Refresh"
            icon={<RepeatIcon />}
            variant="ghost"
            size="sm"
          />

          {/* Settings button */}
          <IconButton
            aria-label="Settings"
            icon={<SettingsIcon />}
            variant="ghost"
            size="sm"
            as={RouterLink}
            to="/configure"
          />

          {/* Dark mode toggle */}
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="sm"
          />

          {/* User profile menu */}
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              size="sm"
              px={3}
              bg={useColorModeValue("gray.100", "gray.700")}
              _hover={{ bg: useColorModeValue("gray.200", "gray.600") }}
              _active={{ bg: useColorModeValue("gray.200", "gray.600") }}
            >
              <HStack spacing={2}>
                <Avatar size="xs" name="Admin" bg="blue.500">
                  <Badge
                    position="absolute"
                    bottom="-2px"
                    right="-2px"
                    boxSize="10px"
                    bg="green.400"
                    borderRadius="full"
                    border="2px solid"
                    borderColor={bgColor}
                  />
                </Avatar>
                <Text fontSize="sm" fontWeight="medium">
                  AD
                </Text>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<SettingsIcon />} as={RouterLink} to="/configure">
                Configure Database & Aura
              </MenuItem>
              <MenuItem
                icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
              >
                {colorMode === "light" ? "Dark" : "Light"} Mode
              </MenuItem>
              <MenuItem isDisabled fontSize="xs" color="gray.500">
                Version 1.0.0 (Beta)
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};
