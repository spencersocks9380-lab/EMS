"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import {
  AppShell,
  Banner,
  BannerDescription,
  BannerIcon,
  BannerTitle,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Persona,
  Property,
  PropertyList,
  SearchInput,
  StructuredList,
  StructuredListCell,
  StructuredListItem,
} from "@saas-ui/react";

const stats = [
  { label: "Active employees", value: "248", help: "+12 this month" },
  { label: "Open requests", value: "18", help: "6 need review" },
  { label: "Payroll ready", value: "96%", help: "Next run Friday" },
];

const requests = [
  { name: "Aarav Sharma", type: "Leave request", status: "Pending" },
  { name: "Maya Chen", type: "Onboarding", status: "In progress" },
  { name: "Noah Patel", type: "Equipment", status: "Approved" },
];

export default function Home() {
  return (
    <AppShell
      minH="100vh"
      bg="gray.50"
      navbar={
        <Navbar borderBottomWidth="1px" bg="white">
          <NavbarBrand>
            <HStack spacing="3">
              <Image src="/globe.svg" alt="EMS" boxSize="28px" />
              <Heading size="md">EMS</Heading>
            </HStack>
          </NavbarBrand>
          <NavbarContent justifyContent="end" spacing="4">
            <NavbarItem>
              <Box display={{ base: "none", md: "block" }} w="240px">
                <SearchInput placeholder="Search employees" size="sm" />
              </Box>
            </NavbarItem>
            <NavbarItem>
              <Persona
                name="Ritesh Uprety"
                secondaryLabel="People Ops"
                presence="online"
                size="sm"
              />
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      }
    >
      <Container maxW="6xl" py={{ base: 6, md: 10 }}>
        <Stack spacing="8">
          <Flex
            align={{ base: "start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap="4"
            justify="space-between"
          >
            <Box>
              <Text color="gray.500" fontWeight="medium">
                Employee management
              </Text>
              <Heading size="xl">Team operations dashboard</Heading>
            </Box>
            <Button colorScheme="cyan">Add employee</Button>
          </Flex>

          <Banner status="success" borderRadius="md">
            <BannerIcon />
            <Box>
              <BannerTitle>April payroll is on track</BannerTitle>
              <BannerDescription>
                Review the remaining approvals before the Friday run.
              </BannerDescription>
            </Box>
          </Banner>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing="5">
            {stats.map((item) => (
              <Card key={item.label} borderRadius="md">
                <CardBody>
                  <Stat>
                    <StatLabel>{item.label}</StatLabel>
                    <StatNumber>{item.value}</StatNumber>
                    <StatHelpText mb="0">{item.help}</StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="5">
            <Card borderRadius="md">
              <CardHeader>
                <Heading size="md">Recent requests</Heading>
              </CardHeader>
              <CardBody pt="0">
                <StructuredList>
                  {requests.map((request) => (
                    <StructuredListItem key={request.name}>
                      <StructuredListCell>
                        <HStack spacing="3">
                          <Avatar name={request.name} size="sm" />
                          <Box>
                            <Text fontWeight="semibold">{request.name}</Text>
                            <Text color="gray.500" fontSize="sm">
                              {request.type}
                            </Text>
                          </Box>
                        </HStack>
                      </StructuredListCell>
                      <StructuredListCell flex="0">
                        <Badge colorScheme="cyan">{request.status}</Badge>
                      </StructuredListCell>
                    </StructuredListItem>
                  ))}
                </StructuredList>
              </CardBody>
            </Card>

            <Card borderRadius="md">
              <CardHeader>
                <Heading size="md">Employee profile</Heading>
              </CardHeader>
              <CardBody pt="0">
                <PropertyList>
                  <Property label="Name" value="Maya Chen" />
                  <Property label="Department" value="Engineering" />
                  <Property label="Manager" value="Aarav Sharma" />
                  <Property label="Status" value={<Badge>Onboarding</Badge>} />
                </PropertyList>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Stack>
      </Container>
    </AppShell>
  );
}
