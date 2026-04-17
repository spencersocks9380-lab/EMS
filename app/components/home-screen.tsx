"use client";

import NextLink from "next/link";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Image,
  Input,
  SimpleGrid,
  Stack,
  Stat,
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
import { applyToEvent, loginStudent, logoutStudent } from "@/app/actions";
import type {
  DashboardStat,
  EventCard,
  LeaderboardEntry,
  StudentApplication,
  StudentProfile,
  StudentScore,
} from "@/lib/db";

type HomeScreenProps = {
  data: {
    stats: DashboardStat[];
    student: StudentProfile | null;
    events: EventCard[];
    leaderboard: LeaderboardEntry[];
    studentApplications: StudentApplication[];
    studentScores: StudentScore[];
  };
  error?: string;
  message?: string;
};

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
}

function formatStatus(status: string) {
  return status.replace("-", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusColor(status: string) {
  switch (status) {
    case "approved":
    case "validated":
    case "Open":
      return "green";
    case "pending":
    case "draft":
    case "waitlisted":
      return "orange";
    case "locked":
      return "blue";
    case "disqualified":
    case "rejected":
      return "red";
    default:
      return "gray";
  }
}

function renderBanner(message: string | undefined, error: string | undefined) {
  if (message) {
    const labels: Record<string, string> = {
      welcome: "Welcome back. Your portal is ready.",
      applied: "Your registration has been submitted.",
      waitlisted: "This event is full right now, so your registration was waitlisted.",
      "signed-out": "You have been signed out.",
    };

    if (labels[message]) {
      return (
        <Banner status="success" borderRadius="xl">
          <BannerIcon />
          <Box>
            <BannerTitle>Update</BannerTitle>
            <BannerDescription>{labels[message]}</BannerDescription>
          </Box>
        </Banner>
      );
    }
  }

  if (error) {
    const labels: Record<string, string> = {
      "invalid-login": "The registration number or password was incorrect.",
      "login-required": "Sign in before registering for an event.",
      "already-applied": "You already have an active registration for this event.",
      "schedule-conflict": "This event overlaps with one of your current registrations.",
      "registration-failed": "The registration could not be completed.",
      "missing-record": "The selected record could not be found.",
    };

    return (
      <Banner status="error" borderRadius="xl">
        <BannerIcon />
        <Box>
          <BannerTitle>Action needed</BannerTitle>
          <BannerDescription>
            {labels[error] ?? "The requested action could not be completed."}
          </BannerDescription>
        </Box>
      </Banner>
    );
  }

  return null;
}

export function HomeScreen({ data, error, message }: HomeScreenProps) {
  return (
    <AppShell
      minH="100vh"
      bg="transparent"
      navbar={
        <Navbar borderBottomWidth="1px" borderColor="blackAlpha.100" bg="whiteAlpha.900">
          <NavbarBrand>
            <HStack spacing="3">
              <Image src="/globe.svg" alt="EMS" boxSize="28px" />
              <Heading size="md">EMS</Heading>
            </HStack>
          </NavbarBrand>
          <NavbarContent justifyContent="end" spacing="4">
            <NavbarItem>
              <Box display={{ base: "none", lg: "block" }} w="260px">
                <SearchInput placeholder="Search events" size="sm" />
              </Box>
            </NavbarItem>
            <NavbarItem>
              <Button as={NextLink} href="/admin" size="sm" variant="outline">
                Admin
              </Button>
            </NavbarItem>
            {data.student ? (
              <NavbarItem>
                <Persona
                  name={data.student.name}
                  secondaryLabel={data.student.registrationNumber}
                  presence="online"
                  size="sm"
                />
              </NavbarItem>
            ) : null}
          </NavbarContent>
        </Navbar>
      }
    >
      <Container maxW="7xl" py={{ base: 6, md: 10 }}>
        <Stack spacing="8">
          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="6">
            <Card borderRadius="2xl" boxShadow="xl" bg="whiteAlpha.900">
              <CardBody>
                <Stack spacing="6">
                  <Badge
                    alignSelf="flex-start"
                    colorScheme="teal"
                    px="3"
                    py="1"
                    borderRadius="full"
                    textTransform="uppercase"
                    letterSpacing="widest"
                  >
                    Event Portal
                  </Badge>
                  <Box>
                    <Heading size="2xl">Discover and register for campus events.</Heading>
                    <Text mt="4" color="gray.600" maxW="2xl">
                      Browse upcoming events, sign up as an individual or team, and
                      check your latest results from one place.
                    </Text>
                  </Box>
                  <HStack spacing="3" flexWrap="wrap">
                    <Button as="a" href="#events" colorScheme="teal">
                      Browse events
                    </Button>
                    <Button as={NextLink} href="/admin" variant="outline">
                      Open admin console
                    </Button>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>

            <Card borderRadius="2xl" boxShadow="xl" bg="whiteAlpha.950" id="portal">
              <CardHeader>
                <Heading size="md">
                  {data.student ? "Student account" : "Student login"}
                </Heading>
                <Text mt="2" color="gray.500">
                  {data.student
                    ? "Your current profile and access are shown below."
                    : "Sign in with your registration number and password to register for events."}
                </Text>
              </CardHeader>
              <CardBody pt="0">
                {data.student ? (
                  <Stack spacing="5">
                    <PropertyList>
                      <Property label="Name" value={data.student.name} />
                      <Property
                        label="Registration"
                        value={data.student.registrationNumber}
                      />
                      <Property label="Semester" value={data.student.semester} />
                      <Property label="Email" value={data.student.email} />
                    </PropertyList>
                    <form action={logoutStudent}>
                      <Button type="submit" variant="outline" w="full">
                        Sign out
                      </Button>
                    </form>
                  </Stack>
                ) : (
                  <form action={loginStudent} id="login">
                    <Stack spacing="4">
                      <FormControl isRequired>
                        <FormLabel>Registration number</FormLabel>
                        <Input
                          name="registrationNumber"
                          placeholder="Enter registration number"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          name="phoneNumber"
                          type="password"
                          placeholder="Enter password"
                        />
                      </FormControl>
                      <Button type="submit" colorScheme="teal">
                        Sign in
                      </Button>
                    </Stack>
                  </form>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing="5">
            {data.stats.map((stat) => (
              <Card key={stat.label} borderRadius="2xl" boxShadow="lg">
                <CardBody>
                  <Stat>
                    <StatLabel>{stat.label}</StatLabel>
                    <StatNumber>{stat.value}</StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {renderBanner(message, error)}

          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="6">
            <Card borderRadius="2xl" boxShadow="lg">
              <CardHeader>
                <Heading size="md">Leaderboard</Heading>
                <Text mt="2" color="gray.500">
                  Recent standings from completed scoring.
                </Text>
              </CardHeader>
              <CardBody pt="0">
                <StructuredList>
                  {data.leaderboard.map((entry, index) => (
                    <StructuredListItem key={`${entry.eventName}-${entry.registrationNumber}`}>
                      <StructuredListCell>
                        <HStack spacing="3">
                          <Avatar name={entry.participantName} size="sm" />
                          <Box>
                            <Text fontWeight="semibold">
                              #{index + 1} {entry.participantName}
                            </Text>
                            <Text color="gray.500" fontSize="sm">
                              {entry.eventName}
                            </Text>
                          </Box>
                        </HStack>
                      </StructuredListCell>
                      <StructuredListCell flex="0">
                        <Stack spacing="1" align="end">
                          <Badge colorScheme="teal">{entry.score.toFixed(1)}</Badge>
                          <Text fontSize="xs" color="gray.500">
                            {entry.latestRound}
                          </Text>
                        </Stack>
                      </StructuredListCell>
                    </StructuredListItem>
                  ))}
                </StructuredList>
              </CardBody>
            </Card>

            <Card borderRadius="2xl" boxShadow="lg">
              <CardHeader>
                <Heading size="md">
                  {data.student ? "Your activity" : "Student portal"}
                </Heading>
                <Text mt="2" color="gray.500">
                  {data.student
                    ? "Your latest registrations and results."
                    : "Sign in to view your registrations and scores."}
                </Text>
              </CardHeader>
              <CardBody pt="0">
                {data.student ? (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing="5">
                    <Box>
                      <Text fontWeight="semibold" mb="3">
                        Applications
                      </Text>
                      <StructuredList>
                        {data.studentApplications.map((application) => (
                          <StructuredListItem key={application.id}>
                            <StructuredListCell>
                              <Box>
                                <Text fontWeight="semibold">
                                  {application.eventName}
                                </Text>
                                <Text color="gray.500" fontSize="sm">
                                  {formatDate(application.appliedAt)}
                                </Text>
                              </Box>
                            </StructuredListCell>
                            <StructuredListCell flex="0">
                              <Badge colorScheme={statusColor(application.status)}>
                                {formatStatus(application.status)}
                              </Badge>
                            </StructuredListCell>
                          </StructuredListItem>
                        ))}
                      </StructuredList>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" mb="3">
                        Scores
                      </Text>
                      <StructuredList>
                        {data.studentScores.map((score) => (
                          <StructuredListItem key={score.id}>
                            <StructuredListCell>
                              <Box>
                                <Text fontWeight="semibold">{score.eventName}</Text>
                                <Text color="gray.500" fontSize="sm">
                                  {score.roundName}
                                </Text>
                              </Box>
                            </StructuredListCell>
                            <StructuredListCell flex="0">
                              <Stack spacing="1" align="end">
                                <Badge colorScheme={statusColor(score.status)}>
                                  {formatStatus(score.status)}
                                </Badge>
                                <Text fontSize="xs" color="gray.500">
                                  {score.weightedTotal.toFixed(1)}
                                </Text>
                              </Stack>
                            </StructuredListCell>
                          </StructuredListItem>
                        ))}
                      </StructuredList>
                    </Box>
                  </SimpleGrid>
                ) : (
                  <Text color="gray.600">
                    Sign in to manage your event registrations and view your scores.
                  </Text>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>

          <Card borderRadius="2xl" boxShadow="xl" id="events">
            <CardHeader>
              <Flex
                align={{ base: "start", lg: "center" }}
                direction={{ base: "column", lg: "row" }}
                gap="3"
                justify="space-between"
              >
                <Box>
                  <Heading size="lg">Open events</Heading>
                  <Text mt="2" color="gray.500">
                    Choose an event and register when spots are available.
                  </Text>
                </Box>
              </Flex>
            </CardHeader>
            <CardBody pt="0">
              <SimpleGrid columns={{ base: 1, xl: 3 }} spacing="5">
                {data.events.map((event) => (
                  <Card key={event.id} borderRadius="xl" variant="outline">
                    <CardHeader>
                      <Flex align="start" justify="space-between" gap="3">
                        <Box>
                          <Heading size="md">{event.name}</Heading>
                          <Text mt="2" color="gray.500" fontSize="sm">
                            {event.description}
                          </Text>
                        </Box>
                        <Badge colorScheme={statusColor(event.status)}>{event.status}</Badge>
                      </Flex>
                    </CardHeader>
                    <CardBody pt="0">
                      <Stack spacing="4">
                        <HStack spacing="2" flexWrap="wrap">
                          <Badge variant="subtle" colorScheme="purple">
                            {event.eventType === "team" ? "Team" : "Individual"}
                          </Badge>
                          <Badge variant="subtle" colorScheme="cyan">
                            Team size {event.teamSize}
                          </Badge>
                          <Badge variant="subtle" colorScheme="gray">
                            {event.applicationCount}/{event.maxParticipants}
                          </Badge>
                        </HStack>

                        <PropertyList>
                          <Property label="Starts" value={formatDate(event.startAt)} />
                          <Property label="Ends" value={formatDate(event.endAt)} />
                          <Property
                            label="Judges"
                            value={event.judges.join(", ")}
                          />
                        </PropertyList>

                        <Divider />

                        {data.student ? (
                          event.userApplicationStatus ? (
                            <Badge
                              alignSelf="flex-start"
                              colorScheme={statusColor(event.userApplicationStatus)}
                            >
                              {formatStatus(event.userApplicationStatus)}
                            </Badge>
                          ) : (
                            <form action={applyToEvent}>
                              <Stack spacing="3">
                                <input type="hidden" name="eventId" value={event.id} />
                                {event.eventType === "team" ? (
                                  <Input
                                    name="teamName"
                                    placeholder="Team name"
                                  />
                                ) : null}
                                <Button type="submit" colorScheme="teal">
                                  Register
                                </Button>
                              </Stack>
                            </form>
                          )
                        ) : (
                          <Button as="a" href="#login" variant="outline">
                            Sign in to register
                          </Button>
                        )}
                      </Stack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        </Stack>
      </Container>
    </AppShell>
  );
}
