"use client";

import NextLink from "next/link";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
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
  SearchInput,
  StructuredList,
  StructuredListCell,
  StructuredListItem,
} from "@saas-ui/react";
import { loginJudge, logoutSession, submitJudgeScore } from "@/app/actions";
import type {
  DashboardStat,
  JudgeAssignedEvent,
  JudgeProfile,
  JudgeScoringItem,
  JudgeSubEventEntry,
  TeamMember,
} from "@/lib/db";

type JudgeScreenProps = {
  data: {
    judge: JudgeProfile | null;
    stats: DashboardStat[];
    assignments: JudgeAssignedEvent[];
    scoringQueue: JudgeScoringItem[];
    subEventEntries: JudgeSubEventEntry[];
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
      "welcome-judge": "Welcome back. Your judge panel is ready.",
      "score-submitted": "The score draft was saved for admin review.",
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
      "invalid-judge-login": "The judge username or access code was incorrect.",
      "judge-access-required": "Sign in as a judge before using judge tools.",
      "invalid-score-target": "The selected participant is not available for scoring.",
      "invalid-round": "Provide a round name before saving a score draft.",
      "invalid-metrics": "Every rubric score must be between 0 and 10.",
      "score-locked": "This score is already locked and can no longer be edited.",
      "score-submit-failed": "The score draft could not be saved.",
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

export function JudgeScreen({ data, error, message }: JudgeScreenProps) {
  return (
    <AppShell
      minH="100vh"
      bg="transparent"
      navbar={
        <Navbar borderBottomWidth="1px" borderColor="blackAlpha.100" bg="whiteAlpha.900">
          <NavbarBrand>
            <HStack spacing="3">
              <Image src="/globe.svg" alt="EMS" boxSize="28px" />
              <Heading size="md">EMS Judge</Heading>
            </HStack>
          </NavbarBrand>
          <NavbarContent justifyContent="end" spacing="4">
            <NavbarItem>
              <Box display={{ base: "none", lg: "block" }} w="260px">
                <SearchInput placeholder="Search assignments" size="sm" />
              </Box>
            </NavbarItem>
            <NavbarItem>
              <Button as={NextLink} href="/" size="sm" variant="outline">
                Participant panel
              </Button>
            </NavbarItem>
            <NavbarItem>
              <Button as={NextLink} href="/admin" size="sm" variant="outline">
                Admin
              </Button>
            </NavbarItem>
            {data.judge ? (
              <NavbarItem>
                <Persona
                  name={data.judge.name}
                  secondaryLabel={data.judge.expertise}
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
                    Judge Panel
                  </Badge>
                  <Box>
                    <Heading size="2xl">Review assigned teams and submit draft scores.</Heading>
                    <Text mt="4" color="gray.600" maxW="2xl">
                      Judges can only see their mapped events, the approved participants
                      in those events, and the team rosters entering sub-events.
                    </Text>
                  </Box>
                  <HStack spacing="3" flexWrap="wrap">
                    <Button as="a" href="#scoring-queue" colorScheme="teal">
                      Open scoring queue
                    </Button>
                    <Button as="a" href="#sub-event-roster" variant="outline">
                      View sub-event teams
                    </Button>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>

            <Card borderRadius="2xl" boxShadow="xl" bg="whiteAlpha.950" id="judge-panel">
              <CardHeader>
                <Heading size="md">
                  {data.judge ? "Judge account" : "Judge login"}
                </Heading>
                <Text mt="2" color="gray.500">
                  {data.judge
                    ? "Your assignment scope and access are shown below."
                    : "Sign in with your judge username and access code."}
                </Text>
              </CardHeader>
              <CardBody pt="0">
                {data.judge ? (
                  <Stack spacing="5">
                    <Text color="gray.600">
                      {data.judge.name} is currently signed in with expertise in {data.judge.expertise}.
                    </Text>
                    <form action={logoutSession}>
                      <Button type="submit" variant="outline" w="full">
                        Sign out
                      </Button>
                    </form>
                  </Stack>
                ) : (
                  <form action={loginJudge} id="judge-login">
                    <Stack spacing="4">
                      <FormControl isRequired>
                        <FormLabel>Judge username</FormLabel>
                        <Input name="username" placeholder="e.g. sandeep.judge" />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Access code</FormLabel>
                        <Input
                          name="accessCode"
                          type="password"
                          placeholder="Enter access code"
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

          {data.judge ? (
            <>
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
                    <Heading size="md">Assigned events</Heading>
                    <Text mt="2" color="gray.500">
                      Only events assigned to this judge are visible for scoring.
                    </Text>
                  </CardHeader>
                  <CardBody pt="0">
                    <Stack spacing="4">
                      {data.assignments.map((assignment) => (
                        <Card key={assignment.id} variant="outline" borderRadius="xl">
                          <CardBody>
                            <Stack spacing="3">
                              <Flex align="start" justify="space-between" gap="3">
                                <Box>
                                  <Heading size="sm">{assignment.name}</Heading>
                                  <Text mt="1" color="gray.500" fontSize="sm">
                                    {formatDate(assignment.startAt)}
                                  </Text>
                                </Box>
                                <Badge colorScheme="teal">
                                  {assignment.eventType === "team" ? "Team" : "Individual"}
                                </Badge>
                              </Flex>
                              <HStack spacing="2" flexWrap="wrap">
                                <Badge variant="subtle" colorScheme="orange">
                                  Drafts {assignment.pendingDraftCount}
                                </Badge>
                                <Badge variant="subtle" colorScheme="cyan">
                                  Approved {assignment.approvedParticipantCount}
                                </Badge>
                                <Badge variant="subtle" colorScheme="purple">
                                  Sub-events {assignment.subEventCount}
                                </Badge>
                              </HStack>
                              <Text color="gray.600" fontSize="sm">
                                Rubric:{" "}
                                {assignment.rubricMetrics
                                  .map((metric) => `${metric.name} (${metric.weight}%)`)
                                  .join(", ")}
                              </Text>
                            </Stack>
                          </CardBody>
                        </Card>
                      ))}
                    </Stack>
                  </CardBody>
                </Card>

                <Card borderRadius="2xl" boxShadow="lg" id="sub-event-roster">
                  <CardHeader>
                    <Heading size="md">Sub-event roster visibility</Heading>
                    <Text mt="2" color="gray.500">
                      Teams entering sub-events are listed with their participant names.
                    </Text>
                  </CardHeader>
                  <CardBody pt="0">
                    <StructuredList>
                      {data.subEventEntries.map((entry) => (
                        <StructuredListItem key={entry.id}>
                          <StructuredListCell>
                            <Box>
                              <Text fontWeight="semibold">
                                {entry.subEventName} / {entry.teamName}
                              </Text>
                              <Text color="gray.500" fontSize="sm">
                                {entry.eventName}
                              </Text>
                              <Text color="gray.500" fontSize="sm">
                                {formatTeamMembers(entry.teamMembers)}
                              </Text>
                            </Box>
                          </StructuredListCell>
                          <StructuredListCell flex="0">
                            <Text fontSize="xs" color="gray.500">
                              {formatDate(entry.enteredAt)}
                            </Text>
                          </StructuredListCell>
                        </StructuredListItem>
                      ))}
                    </StructuredList>
                  </CardBody>
                </Card>
              </SimpleGrid>

              <Card borderRadius="2xl" boxShadow="xl" id="scoring-queue">
                <CardHeader>
                  <Heading size="lg">Scoring queue</Heading>
                  <Text mt="2" color="gray.500">
                    Save draft scores for approved participants. Admin still validates and locks them.
                  </Text>
                </CardHeader>
                <CardBody pt="0">
                  <Stack spacing="5">
                    {data.scoringQueue.map((item) => (
                      <Card key={item.applicationId} borderRadius="xl" variant="outline">
                        <CardBody>
                          <Stack spacing="4">
                            <Flex align="start" justify="space-between" gap="3">
                              <Box>
                                <Heading size="sm">{item.eventName}</Heading>
                                <Text mt="1" color="gray.500" fontSize="sm">
                                  {item.teamName
                                    ? `${item.teamName} / ${item.participantName}`
                                    : item.participantName}
                                </Text>
                                {item.teamMembers.length > 0 ? (
                                  <Text color="gray.500" fontSize="sm">
                                    {formatTeamMembers(item.teamMembers)}
                                  </Text>
                                ) : null}
                              </Box>
                              <Badge colorScheme={statusColor(item.status ?? "draft")}>
                                {item.status ? formatStatus(item.status) : "Not started"}
                              </Badge>
                            </Flex>
                            <Text fontSize="sm" color="gray.600">
                              Registration: {item.registrationNumber}
                              {item.weightedTotal !== null
                                ? ` | Latest total ${item.weightedTotal.toFixed(1)}`
                                : ""}
                            </Text>
                            <form action={submitJudgeScore}>
                              <Stack spacing="4">
                                <input
                                  type="hidden"
                                  name="applicationId"
                                  value={item.applicationId}
                                />
                                <FormControl isRequired>
                                  <FormLabel>Round</FormLabel>
                                  <Input name="roundName" defaultValue={item.roundName} />
                                </FormControl>
                                <SimpleGrid columns={{ base: 1, md: 5 }} spacing="3">
                                  {item.rubricMetrics.map((metric, index) => (
                                    <FormControl key={`${item.applicationId}-${metric.name}`} isRequired>
                                      <FormLabel>
                                        {metric.name} ({metric.weight}%)
                                      </FormLabel>
                                      <Input
                                        name={`metric${index + 1}`}
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="1"
                                        defaultValue={item.metricValues[index]}
                                      />
                                    </FormControl>
                                  ))}
                                </SimpleGrid>
                                <FormControl>
                                  <FormLabel>Judge note</FormLabel>
                                  <Textarea
                                    name="adminNotes"
                                    rows={3}
                                    defaultValue={item.adminNotes}
                                    placeholder="Optional note for admin review"
                                  />
                                </FormControl>
                                <Button type="submit" colorScheme="teal" alignSelf="start">
                                  Save draft score
                                </Button>
                              </Stack>
                            </form>
                          </Stack>
                        </CardBody>
                      </Card>
                    ))}
                  </Stack>
                </CardBody>
              </Card>
            </>
          ) : (
            <>
              {renderBanner(message, error)}
              <Card borderRadius="2xl" boxShadow="lg">
                <CardBody>
                  <Text color="gray.600">
                    Seeded judge usernames are available in the local data set, and the
                    judge panel only unlocks assigned event data after a successful login.
                  </Text>
                </CardBody>
              </Card>
            </>
          )}
        </Stack>
      </Container>
    </AppShell>
  );
}
