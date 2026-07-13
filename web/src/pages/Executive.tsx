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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  useColorModeValue,
  Flex,
  Spinner,
  Button,
} from "@chakra-ui/react";
import * as React from "react";
import { useSetRecoilState } from "recoil";

import {
  useExecutiveKPIs,
  useMarketHealth,
  useAtRiskSubscribers,
  useInterventionPerformance,
} from "@/data/queries";
import { analystPendingQuestion } from "@/data/recoil";

export const Executive: React.FC = () => {
  const { data: kpis, error: kpisError, isLoading: kpisLoading } = useExecutiveKPIs();
  const { data: markets, error: marketsError, isLoading: marketsLoading } = useMarketHealth();
  const { data: atRisk, error: atRiskError, isLoading: atRiskLoading } = useAtRiskSubscribers();
  const { data: interventions, error: interventionsError, isLoading: interventionsLoading } = useInterventionPerformance();

  const setPendingQuestion = useSetRecoilState(analystPendingQuestion);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const statBgColor = useColorModeValue("blue.50", "blue.900");

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return "—";
    return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  const formatPercent = (num: number | undefined) => {
    if (num === undefined) return "—";
    return `${num.toFixed(1)}%`;
  };

  const formatRevenue = (num: number | undefined) => {
    if (num === undefined) return "—";
    return `$${num.toFixed(2)}`;
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "critical": return "red";
      case "high": return "orange";
      case "medium": return "yellow";
      default: return "green";
    }
  };

  const askAura = (question: string) => {
    setPendingQuestion(question);
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Subscriber Experience Command Center</Heading>
        <Text color="gray.500" fontSize="sm">Real-time operational analytics</Text>
      </Flex>

      {/* KPI Cards */}
      <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={6}>
        <GridItem>
          <Stat bg={statBgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel>Total Subscribers</StatLabel>
            <StatNumber>
              {kpisLoading ? <Spinner size="sm" /> : formatNumber(kpis?.total_subscribers)}
            </StatNumber>
          </Stat>
        </GridItem>
        <GridItem>
          <Stat bg={statBgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel>High Risk Subscribers</StatLabel>
            <StatNumber color="orange.500">
              {kpisLoading ? <Spinner size="sm" /> : formatNumber(kpis?.high_risk_subscribers)}
            </StatNumber>
            <StatHelpText>
              {formatNumber(kpis?.critical_risk_subscribers)} critical
            </StatHelpText>
          </Stat>
        </GridItem>
        <GridItem>
          <Stat bg={statBgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel>Avg Experience Score</StatLabel>
            <StatNumber>
              {kpisLoading ? <Spinner size="sm" /> : kpis?.avg_experience_score?.toFixed(1) || "—"}
            </StatNumber>
            <StatHelpText>0-100 scale</StatHelpText>
          </Stat>
        </GridItem>
        <GridItem>
          <Stat bg={statBgColor} p={4} borderRadius="lg" border="1px" borderColor={borderColor}>
            <StatLabel>Open Care Cases</StatLabel>
            <StatNumber>
              {kpisLoading ? <Spinner size="sm" /> : formatNumber(kpis?.open_care_cases)}
            </StatNumber>
            <StatHelpText>
              {formatNumber(kpis?.care_cases_24h)} last 24h
            </StatHelpText>
          </Stat>
        </GridItem>
      </Grid>

      {/* Market Health Table */}
      <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="lg" p={4} mb={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Market Degradation Summary</Heading>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={() => askAura("Which markets have the highest degradation today?")}
          >
            Ask Aura
          </Button>
        </Flex>
        {marketsLoading ? (
          <Flex justify="center" p={8}><Spinner /></Flex>
        ) : marketsError ? (
          <Text color="red.500">Error loading market data</Text>
        ) : (
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Market</Th>
                <Th>Region</Th>
                <Th isNumeric>Degradation Index</Th>
                <Th isNumeric>Severe Events (24h)</Th>
                <Th isNumeric>Impacted Subscribers</Th>
                <Th isNumeric>Care Cases (24h)</Th>
              </Tr>
            </Thead>
            <Tbody>
              {markets?.slice(0, 10).map((market) => (
                <Tr key={market.market_id}>
                  <Td fontWeight="medium">{market.market_name}</Td>
                  <Td>{market.region_name}</Td>
                  <Td isNumeric>
                    <Badge colorScheme={market.degradation_index > 50 ? "red" : market.degradation_index > 25 ? "orange" : "green"}>
                      {market.degradation_index.toFixed(0)}
                    </Badge>
                  </Td>
                  <Td isNumeric>{formatNumber(market.severe_events_24h)}</Td>
                  <Td isNumeric>{formatNumber(market.impacted_subscribers_24h)}</Td>
                  <Td isNumeric>{formatNumber(market.care_cases_24h)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      {/* At-Risk Subscribers */}
      <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="lg" p={4} mb={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">At-Risk High-Value Subscribers (No Interventions)</Heading>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={() => askAura("Show me high-value subscribers with poor experience who need intervention")}
          >
            Ask Aura
          </Button>
        </Flex>
        {atRiskLoading ? (
          <Flex justify="center" p={8}><Spinner /></Flex>
        ) : atRiskError ? (
          <Text color="red.500">Error loading at-risk subscribers</Text>
        ) : (
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Subscriber ID</Th>
                <Th>Market</Th>
                <Th>Line Type</Th>
                <Th isNumeric>Monthly Revenue</Th>
                <Th>Risk Band</Th>
                <Th isNumeric>Experience Score</Th>
                <Th isNumeric>Care Cases (30d)</Th>
              </Tr>
            </Thead>
            <Tbody>
              {atRisk?.slice(0, 15).map((sub) => (
                <Tr key={sub.subscriber_id}>
                  <Td>{sub.subscriber_id}</Td>
                  <Td>{sub.market_name}</Td>
                  <Td>
                    <Badge colorScheme={sub.line_type === "enterprise" ? "purple" : sub.line_type === "postpaid" ? "blue" : "gray"}>
                      {sub.line_type}
                    </Badge>
                  </Td>
                  <Td isNumeric>{formatRevenue(sub.monthly_revenue)}</Td>
                  <Td>
                    <Badge colorScheme={getRiskBadgeColor(sub.churn_risk_band)}>
                      {sub.churn_risk_band}
                    </Badge>
                  </Td>
                  <Td isNumeric>{sub.experience_score.toFixed(1)}</Td>
                  <Td isNumeric>{sub.care_cases_30d}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      {/* Intervention Performance */}
      <Box bg={bgColor} border="1px" borderColor={borderColor} borderRadius="lg" p={4}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Retention Intervention Performance</Heading>
          <Button
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={() => askAura("What's the best performing retention action type for prepaid users?")}
          >
            Ask Aura
          </Button>
        </Flex>
        {interventionsLoading ? (
          <Flex justify="center" p={8}><Spinner /></Flex>
        ) : interventionsError ? (
          <Text color="red.500">Error loading intervention data</Text>
        ) : (
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Action Type</Th>
                <Th>Channel</Th>
                <Th>Line Type</Th>
                <Th isNumeric>Total Actions</Th>
                <Th isNumeric>Acceptance Rate</Th>
                <Th isNumeric>Conversion Rate</Th>
                <Th isNumeric>Revenue Impact</Th>
              </Tr>
            </Thead>
            <Tbody>
              {interventions?.slice(0, 10).map((int, idx) => (
                <Tr key={idx}>
                  <Td>{int.action_type}</Td>
                  <Td>{int.channel}</Td>
                  <Td>
                    <Badge>{int.line_type}</Badge>
                  </Td>
                  <Td isNumeric>{formatNumber(int.total_actions)}</Td>
                  <Td isNumeric>{formatPercent(int.acceptance_rate)}</Td>
                  <Td isNumeric>
                    <Badge colorScheme={int.conversion_rate > 30 ? "green" : int.conversion_rate > 15 ? "yellow" : "red"}>
                      {formatPercent(int.conversion_rate)}
                    </Badge>
                  </Td>
                  <Td isNumeric color={int.avg_revenue_impact > 0 ? "green.500" : "red.500"}>
                    {formatRevenue(int.avg_revenue_impact)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Container>
  );
};
