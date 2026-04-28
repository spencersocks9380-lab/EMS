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
  Textarea,
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
import {
  applyToEvent,
  enterSubEvent,
  loginParticipant,
  logoutSession,
} from "@/app/actions";
import type {
  DashboardStat,
  EventCard,
  LeaderboardEntry,
  ParticipantSubEvent,
  StudentApplication,
  StudentProfile,
  StudentScore,
  TeamMember,
} from "@/lib/db";

type HomeScreenProps = {
  data: {
    stats: DashboardStat[];
    student: StudentProfile | null;
    events: EventCard[];
    leaderboard: LeaderboardEntry[];
    studentApplications: StudentApplication[];
    studentScores: StudentScore[];
    subEvents: ParticipantSubEvent[];
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

function formatTeamMembers(members: TeamMember[]) {
  return members
    .map((member) =>
      member.isCaptain ? `${member.name} (Captain)` : member.name,
    )
    .join(", ");
}

function renderBanner(message: string | undefined, error: string | undefined) {
  if (message) {
    const labels: Record<string, string> = {
      welcome: "Welcome back. Your participant panel is ready.",
      applied: "Your registration has been submitted.",
      waitlisted: "This event is full right now, so your registration was waitlisted.",
      "signed-out": "You have been signed out.",
      "sub-event-entered":
        "Your team has been entered into the selected sub-event.",
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
      "participant-access-required":
        "Sign in as a participant before using participant features.",
      "already-applied": "You already have an active registration for this event.",
      "schedule-conflict": "This event overlaps with one of your current registrations.",
      "registration-failed": "The registration could not be completed.",
      "missing-record": "The selected record could not be found.",
      "team-size-exceeded":
        "Your team roster is larger than the team size configured for this event.",
      "sub-event-not-available":
        "This sub-event is only available to approved team entries.",
      "already-entered-sub-event":
        "Your team has already entered this sub-event.",
      "sub-event-full": "This sub-event has already reached its team capacity.",
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
              <Heading size="md">EMS Participant</Heading>
            </HStack>
          </NavbarBrand>
          <NavbarContent justifyContent="end" spacing="4">
            <NavbarItem>
              <Box display={{ base: "none", lg: "block" }} w="260px">
                <SearchInput placeholder="Search events" size="sm" />
              </Box>
            </NavbarItem>
            <NavbarItem>
              <Button as={NextLink} href="/judge" size="sm" variant="outline">
                Judge panel
              </Button>
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
                    Participant Panel
                  </Badge>
                  <Box>
                    <Heading size="2xl">Register teams, track scores, and enter sub-events.</Heading>
                    <Text mt="4" color="gray.600" maxW="2xl">
                      Participants can manage event registrations, keep team rosters
                      visible, and confirm which team members are entering each sub-event.
                    </Text>
                  </Box>
                  <HStack spacing="3" flexWrap="wrap">
                    <Button as="a" href="#events" colorScheme="teal">
                      Browse events
                    </Button>
                    <Button as="a" href="#sub-events" variant="outline">
                      View sub-events
                    </Button>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>

            <Card borderRadius="2xl" boxShadow="xl" bg="whiteAlpha.950" id="participant-panel">
              <CardHeader>
                <Heading size="md">
                  {data.student ? "Participant account" : "Participant login"}
                </Heading>
                <Text mt="2" color="gray.500">
                  {data.student
                    ? "Your current profile and panel access are shown below."
                    : "Sign in with your registration number and password to manage registrations."}
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
                    <form action={logoutSession}>
                      <Button type="submit" variant="outline" w="full">
                        Sign out
                      </Button>
                    </form>
                  </Stack>
                ) : (
                  <form action={loginParticipant} id="participant-login">
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
                  Recent standings from validated and locked scoring.
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
                  {data.student ? "Your activity" : "Participant access"}
                </Heading>
                <Text mt="2" color="gray.500">
                  {data.student
                    ? "Your registrations, rosters, and latest scores."
                    : "Sign in to view your applications, roster details, and results."}
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
                                {application.teamName ? (
                                  <Text color="gray.500" fontSize="sm">
                                    {application.teamName}: {formatTeamMembers(application.teamMembers)}
                                  </Text>
                                ) : null}
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
                                  {score.roundName} by {score.judgeName}
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
                    Sign in to manage registrations, confirm team rosters, and view scores.
                  </Text>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>

          <Card borderRadius="2xl" boxShadow="xl" id="sub-events">
            <CardHeader>
              <Flex
                align={{ base: "start", lg: "center" }}
                direction={{ base: "column", lg: "row" }}
                gap="3"
                justify="space-between"
              >
                <Box>
                  <Heading size="lg">Sub-event entries</Heading>
                  <Text mt="2" color="gray.500">
                    Approved team registrations can enter sub-events with full roster visibility.
                  </Text>
                </Box>
              </Flex>
            </CardHeader>
            <CardBody pt="0">
              {data.student ? (
                data.subEvents.length > 0 ? (
                  <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="5">
                    {data.subEvents.map((subEvent) => (
                      <Card key={subEvent.id} borderRadius="xl" variant="outline">
                        <CardBody>
                          <Stack spacing="4">
                            <Flex align="start" justify="space-between" gap="3">
                              <Box>
                                <Heading size="sm">{subEvent.name}</Heading>
                                <Text mt="1" color="gray.500" fontSize="sm">
                                  {subEvent.parentEventName}
                                </Text>
                              </Box>
                              <Badge colorScheme={statusColor(subEvent.status)}>
                                {subEvent.status}
                              </Badge>
                            </Flex>
                            <PropertyList>
                              <Property label="Starts" value={formatDate(subEvent.startAt)} />
                              <Property label="Ends" value={formatDate(subEvent.endAt)} />
                              <Property
                                label="Capacity"
                                value={`${subEvent.currentTeams}/${subEvent.maxTeams} teams`}
                              />
                              <Property label="Team" value={subEvent.teamName} />
                              <Property
                                label="Participants"
                                value={formatTeamMembers(subEvent.teamMembers)}
                              />
                            </PropertyList>
                            {subEvent.hasEntered ? (
                              <Badge alignSelf="flex-start" colorScheme="green">
                                Entered
                              </Badge>
                            ) : (
                              <form action={enterSubEvent}>
                                <input type="hidden" name="subEventId" value={subEvent.id} />
                                <Button type="submit" colorScheme="teal">
                                  Enter sub-event
                                </Button>
                              </form>
                            )}
                          </Stack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text color="gray.600">
                    No approved team applications are ready for sub-event entry yet.
                  </Text>
                )
              ) : (
                <Text color="gray.600">
                  Sign in to enter your team into available sub-events.
                </Text>
              )}
            </CardBody>
          </Card>

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
                    Choose an event and register as an individual or a team.
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
                          <Property label="Judges" value={event.judges.join(", ")} />
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
                                  <>
                                    <Input
                                      name="teamName"
                                      placeholder="Team name"
                                    />
                                    <Textarea
                                      name="teamMembers"
                                      rows={4}
                                      placeholder="List teammate names, one per line or comma-separated"
                                    />
                                  </>
                                ) : null}
                                <Button type="submit" colorScheme="teal">
                                  Register
                                </Button>
                              </Stack>
                            </form>
                          )
                        ) : (
                          <Button as="a" href="#participant-login" variant="outline">
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
