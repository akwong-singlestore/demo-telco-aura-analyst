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
import { mutate } from "swr";

import SingleStoreLogoLight from "@/assets/singlestore-logo-light.svg";
import SingleStoreLogoDark from "@/assets/singlestore-logo-dark-new.svg";

export const Nav: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const [selectedTimeWindow, setSelectedTimeWindow] = useRecoilState(timeWindow);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Revalidate all SWR caches to fetch fresh data
      await mutate(() => true, undefined, { revalidate: true });
      console.log('[Refresh] Cache invalidated, revalidating all queries');
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

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
            aria-label="Refresh data"
            icon={<RepeatIcon />}
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            _hover={{ transform: "rotate(180deg)", transition: "transform 0.3s" }}
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
        </HStack>
      </Flex>
    </Box>
  );
};
