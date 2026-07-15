import {
  Box,
  Container,
  Grid,
  GridItem,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  IconButton,
  Collapse,
} from "@chakra-ui/react";
import { MdPeople, MdWarning, MdHeadset, MdTrendingUp, MdFilterList, MdClose, MdChat } from "react-icons/md";
import * as React from "react";
import { useSetRecoilState, useRecoilState } from "recoil";
import Plotly from "plotly.js-dist-min";
import createPlotlyComponent from "react-plotly.js/factory";
import {
  useExecutiveKPIs,
  useMarketHealth,
  useAtRiskSubscribers,
  useInterventionPerformance,
  useChurnRiskTrend
} from "@/data/queries";
import { analystPendingQuestion, analystChatOpen, timeWindow } from "@/data/recoil";

const Plot = createPlotlyComponent(Plotly);

const KPICard: React.FC<{
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: any;
  iconColor: string;
}> = ({ label, value, change, isPositive, icon, iconColor }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Stat
      bg={bgColor}
      p={6}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      position="relative"
    >
      <Flex justify="space-between" align="start">
        <Box>
          <StatLabel fontSize="sm" color="gray.500" mb={2}>
            {label}
          </StatLabel>
          <StatNumber fontSize="3xl" fontWeight="bold">
            {value}
          </StatNumber>
          <StatHelpText mb={0} mt={2}>
            <StatArrow type={isPositive ? "increase" : "decrease"} />
            {change}
          </StatHelpText>
          <Text fontSize="xs" color="gray.400">
            vs prior 2 hours
          </Text>
        </Box>
        <Icon as={icon} boxSize={10} color={iconColor} opacity={0.2} />
      </Flex>
    </Stat>
  );
};

export const ExecutiveDashboard: React.FC = () => {
  const [showFilters, setShowFilters] = React.useState(false);
  const [showAura, setShowAura] = React.useState(false);
  const [marketSortBy, setMarketSortBy] = React.useState<'degraded' | 'care' | 'churn'>('degraded');
  const setPendingQuestion = useSetRecoilState(analystPendingQuestion);
  const setChatOpen = useSetRecoilState(analystChatOpen);
  const [selectedTimeWindow, setSelectedTimeWindow] = useRecoilState(timeWindow);

  const kpisRes = useExecutiveKPIs();
  const marketsRes = useMarketHealth();
  const atRiskRes = useAtRiskSubscribers();
  const interventionsRes = useInterventionPerformance();
  const churnTrendRes = useChurnRiskTrend();

  const kpis = kpisRes.data;
  const markets = marketsRes.data;
  const atRisk = atRiskRes.data;
  const interventions = interventionsRes.data;
  const churnTrend = churnTrendRes.data;

  const kpisLoading = !kpisRes.data && !kpisRes.error;
  const marketsLoading = !marketsRes.data && !marketsRes.error;
  const atRiskLoading = !atRiskRes.data && !atRiskRes.error;
  const interventionsLoading = !interventionsRes.data && !interventionsRes.error;
  const trendLoading = !churnTrendRes.data && !churnTrendRes.error;

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const chartBgColor = useColorModeValue("white", "gray.700");
  const chartIsDark = useColorModeValue(false, true);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "—";
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatPercent = (num: number | undefined) => {
    if (num === undefined) return "—%";
    return `${num.toFixed(1)}%`;
  };

  return (
    <Flex h="calc(100vh - 60px)" bg={bgColor} position="relative">
      {/* Floating Filter Toggle Button */}
      {!showFilters && (
        <IconButton
          aria-label="Show filters"
          icon={<MdFilterList />}
          position="absolute"
          left={4}
          top={4}
          zIndex={10}
          size="sm"
          colorScheme="blue"
          onClick={() => setShowFilters(true)}
        />
      )}

      {/* Floating Aura Toggle Button */}
      {!showAura && (
        <IconButton
          aria-label="Show Aura Analyst"
          icon={<MdChat />}
          position="absolute"
          right={4}
          top={4}
          zIndex={10}
          size="sm"
          colorScheme="blue"
          onClick={() => setShowAura(true)}
        />
      )}

      {/* Left Sidebar - Filters */}
      <Collapse in={showFilters} animateOpacity>
        <VStack
          w="220px"
          h="100%"
          bg={cardBg}
          borderRight="1px"
          borderColor={borderColor}
          p={4}
          spacing={4}
          align="stretch"
        >
          <Flex justify="space-between" align="center">
            <Heading size="sm">Filters</Heading>
            <HStack spacing={1}>
              <Button size="xs" variant="ghost" colorScheme="blue">
                Reset
              </Button>
              <IconButton
                aria-label="Close filters"
                icon={<MdClose />}
                size="xs"
                variant="ghost"
                onClick={() => setShowFilters(false)}
              />
            </HStack>
          </Flex>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Region</Text>
            <Select size="sm" placeholder="All Regions" />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Market</Text>
            <Select size="sm" placeholder="All Markets" />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Line Type</Text>
            <Select size="sm" placeholder="Postpaid, Prepaid" />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Technology</Text>
            <Select size="sm" placeholder="5G, 4G LTE" />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Time Window</Text>
            <Select
              size="sm"
              value={selectedTimeWindow}
              onChange={(e) => setSelectedTimeWindow(e.target.value)}
            >
              <option value="1h">Last 1 hour</option>
              <option value="2h">Last 2 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </Select>
          </Box>
        </VStack>
      </Collapse>

      {/* Main Content */}
      <Flex flex={1} direction="column" overflow="auto">
        <Container maxW="100%" py={6} px={8}>
          {/* KPI Cards */}
          <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={6}>
            <KPICard
              label="Impacted Subscribers"
              value={formatNumber(kpis?.high_risk_subscribers)}
              change="18.6%"
              isPositive={false}
              icon={MdPeople}
              iconColor="blue.500"
            />
            <KPICard
              label="Churn Risk"
              value={formatPercent(kpis?.high_risk_subscribers ? (kpis.high_risk_subscribers / kpis.total_subscribers) * 100 : 0)}
              change="0.6 pp"
              isPositive={false}
              icon={MdWarning}
              iconColor="orange.500"
            />
            <KPICard
              label="Care Volume"
              value={formatNumber(kpis?.care_cases_24h)}
              change="12.3%"
              isPositive={false}
              icon={MdHeadset}
              iconColor="purple.500"
            />
            <KPICard
              label="SLA Risk"
              value="2.3%"
              change="0.4 pp"
              isPositive={false}
              icon={MdWarning}
              iconColor="red.500"
            />
          </Grid>

          {/* Market Degradation Table */}
          <Box
            bg={cardBg}
            border="1px"
            borderColor={borderColor}
            borderRadius="lg"
            p={6}
            mb={6}
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Market Degradation Summary</Heading>
              <HStack>
                <Select
                  size="sm"
                  w="auto"
                  value={marketSortBy}
                  onChange={(e) => setMarketSortBy(e.target.value as 'degraded' | 'care' | 'churn')}
                >
                  <option value="degraded">Degraded Experience</option>
                  <option value="care">Care Volume</option>
                  <option value="churn">Churn Risk</option>
                </Select>
              </HStack>
            </Flex>
            {marketsLoading ? (
              <Flex justify="center" p={8}><Spinner /></Flex>
            ) : (
              <Table size="sm" variant="simple">
                <Thead>
                  <Tr>
                    <Th>Market</Th>
                    <Th>Region</Th>
                    <Th isNumeric fontWeight={marketSortBy === 'degraded' ? 'bold' : 'normal'}>Degradation Index</Th>
                    <Th isNumeric>Severe Events (24h)</Th>
                    <Th isNumeric fontWeight={marketSortBy === 'churn' ? 'bold' : 'normal'}>Impacted Subs</Th>
                    <Th isNumeric fontWeight={marketSortBy === 'care' ? 'bold' : 'normal'}>Care Cases</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {markets?.sort((a, b) => {
                    if (marketSortBy === 'care') {
                      return (b.care_cases_24h || 0) - (a.care_cases_24h || 0);
                    } else if (marketSortBy === 'churn') {
                      return (b.impacted_subscribers_24h || 0) - (a.impacted_subscribers_24h || 0);
                    } else {
                      return (b.degradation_index || 0) - (a.degradation_index || 0);
                    }
                  }).slice(0, 10).map((m) => {
                    const degIndex = Number(m.degradation_index) || 0;
                    return (
                      <Tr key={m.market_id}>
                        <Td fontWeight="medium">{m.market_name}</Td>
                        <Td>{m.region_name}</Td>
                        <Td isNumeric>
                          <Badge colorScheme={degIndex > 50 ? "red" : degIndex > 25 ? "orange" : "green"}>
                            {degIndex.toFixed(0)}
                          </Badge>
                        </Td>
                        <Td isNumeric>{m.severe_events_24h || 0}</Td>
                        <Td isNumeric>{m.impacted_subscribers_24h || 0}</Td>
                        <Td isNumeric>{m.care_cases_24h || 0}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </Box>

          {/* Bottom Charts */}
          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            {/* Experience Trend */}
            <Box bg={cardBg} border="1px" borderColor={borderColor} borderRadius="lg" p={4}>
              <Heading size="sm" mb={4}>Churn Risk Trend (7 Days)</Heading>
              {trendLoading ? (
                <Flex justify="center" p={8}><Spinner size="sm" /></Flex>
              ) : churnTrend && churnTrend.length > 0 ? (
                <Plot
                  data={[
                    {
                      x: churnTrend.map((d) => d.date).reverse(),
                      y: churnTrend.map((d) => Number(d.high_count) + Number(d.critical_count)).reverse(),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'High+Critical Risk',
                      line: { color: '#F56565', width: 2 },
                      marker: { size: 6 },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    height: 200,
                    margin: { l: 40, r: 20, b: 60, t: 10 },
                    paper_bgcolor: chartIsDark ? "#2D3748" : "white",
                    plot_bgcolor: chartIsDark ? "#2D3748" : "#EDF2F7",
                    font: { color: chartIsDark ? "white" : "#2a3f5f", size: 10 },
                    xaxis: {
                      showgrid: false,
                      tickangle: -45,
                      automargin: true,
                    },
                    yaxis: {
                      title: 'Subscribers',
                      showgrid: true,
                      gridcolor: chartIsDark ? "#4A5568" : "#E2E8F0",
                    },
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  style={{ width: "100%", height: "200px" }}
                />
              ) : (
                <Flex h="200px" align="center" justify="center" color="gray.500" fontSize="sm">
                  No trend data available
                </Flex>
              )}
            </Box>

            {/* Retention Performance */}
            <Box bg={cardBg} border="1px" borderColor={borderColor} borderRadius="lg" p={4}>
              <Heading size="sm" mb={4}>Retention Action Performance</Heading>
              {interventionsLoading ? (
                <Flex justify="center" p={8}><Spinner size="sm" /></Flex>
              ) : (
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th fontSize="xs">Action</Th>
                      <Th isNumeric fontSize="xs">Conv %</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {interventions?.slice(0, 5).map((i, idx) => {
                      const convRate = Number(i.conversion_rate) || 0;
                      return (
                        <Tr key={idx}>
                          <Td fontSize="xs">{i.action_type}</Td>
                          <Td isNumeric fontSize="xs">
                            <Badge colorScheme={convRate > 30 ? "green" : "yellow"}>
                              {convRate.toFixed(0)}%
                            </Badge>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </Box>

            {/* At-Risk Segments */}
            <Box bg={cardBg} border="1px" borderColor={borderColor} borderRadius="lg" p={4}>
              <Heading size="sm" mb={4}>Top At-Risk Segments</Heading>
              {atRiskLoading ? (
                <Flex justify="center" p={8}><Spinner size="sm" /></Flex>
              ) : (
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th fontSize="xs">Market</Th>
                      <Th fontSize="xs">Risk</Th>
                      <Th isNumeric fontSize="xs">Revenue</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {atRisk?.slice(0, 5).map((sub) => {
                      const revenue = Number(sub.monthly_revenue) || 0;
                      return (
                        <Tr key={sub.subscriber_id}>
                          <Td fontSize="xs">{sub.market_name}</Td>
                          <Td fontSize="xs">
                            <Badge size="sm" colorScheme={sub.churn_risk_band === "critical" ? "red" : "orange"}>
                              {sub.churn_risk_band}
                            </Badge>
                          </Td>
                          <Td isNumeric fontSize="xs">${revenue.toFixed(0)}</Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </Box>
          </Grid>
        </Container>
      </Flex>

      {/* Right Sidebar - Aura */}
      <Collapse in={showAura} animateOpacity>
        <VStack
          w="320px"
          h="100%"
          bg={cardBg}
          borderLeft="1px"
          borderColor={borderColor}
          p={4}
          spacing={4}
          align="stretch"
        >
          <Flex justify="space-between" align="center">
            <Flex align="center" gap={2}>
              <Icon as={MdTrendingUp} color="blue.500" />
              <Heading size="sm">Aura Analyst</Heading>
              <Text fontSize="xs" color="blue.500" fontWeight="bold">
                BETA
              </Text>
            </Flex>
            <IconButton
              aria-label="Close Aura Analyst"
              icon={<MdClose />}
              size="xs"
              variant="ghost"
              onClick={() => setShowAura(false)}
            />
          </Flex>

          <Text fontSize="sm" fontWeight="medium">
            Ask about this view
          </Text>

          <VStack spacing={2} align="stretch">
            {["What's driving the spike in impacted subscribers?",
              "Which markets have the highest churn risk right now?",
              "How is care volume trending vs. last week?"].map((q, idx) => (
              <Button
                key={idx}
                size="sm"
                variant="outline"
                textAlign="left"
                justifyContent="flex-start"
                whiteSpace="normal"
                height="auto"
                py={3}
                onClick={() => {
                  setPendingQuestion(q);
                  setChatOpen(true);
                }}
              >
                {q}
              </Button>
            ))}
          </VStack>
        </VStack>
      </Collapse>
    </Flex>
  );
};
