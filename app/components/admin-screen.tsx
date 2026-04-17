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
  Select,
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
  SearchInput,
  StructuredList,
  StructuredListCell,
  StructuredListItem,
} from "@saas-ui/react";
import {
  createEventAction,
  lockScoreDraft,
  validateScoreDraft,
} from "@/app/actions";
import type {
  AdminApplication,
  AdminEventOverview,
  DashboardStat,
  ScoreValidationItem,
} from "@/lib/db";

type AdminScreenProps = {
  data: {
    stats: DashboardStat[];
    events: AdminEventOverview[];
    applications: AdminApplication[];
    validationQueue: ScoreValidationItem[];
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
      "event-created": "The new event has been added.",
      "score-validated": "The selected score was reviewed successfully.",
      "score-locked": "The selected score is now locked.",
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
      "invalid-event": "Event name, description, and summary are required.",
      "invalid-schedule": "Choose a valid start time and end time.",
      "invalid-draft": "The selected score could not be processed.",
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

export function AdminScreen({ data, error, message }: AdminScreenProps) {
  return (
    <AppShell
      minH="100vh"
      bg="transparent"
      navbar={
        <Navbar borderBottomWidth="1px" borderColor="blackAlpha.100" bg="whiteAlpha.900">
          <NavbarBrand>
            <HStack spacing="3">
              <Image src="/globe.svg" alt="EMS" boxSize="28px" />
              <Heading size="md">EMS Admin</Heading>
            </HStack>
          </NavbarBrand>
          <NavbarContent justifyContent="end" spacing="4">
            <NavbarItem>
              <Box display={{ base: "none", lg: "block" }} w="260px">
                <SearchInput placeholder="Search events or entries" size="sm" />
              </Box>
            </NavbarItem>
            <NavbarItem>
              <Button as={NextLink} href="/" size="sm" variant="outline">
                Student portal
              </Button>
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      }
    >
      <Container maxW="7xl" py={{ base: 6, md: 10 }}>
        <Stack spacing="8">
          <Card borderRadius="2xl" boxShadow="xl" bg="whiteAlpha.950">
            <CardBody>
              <Flex
                align={{ base: "start", lg: "center" }}
                direction={{ base: "column", lg: "row" }}
                gap="5"
                justify="space-between"
              >
                <Box>
                  <Badge
                    colorScheme="teal"
                    px="3"
                    py="1"
                    borderRadius="full"
                    textTransform="uppercase"
                    letterSpacing="widest"
                  >
                    Admin Console
                  </Badge>
                  <Heading size="2xl" mt="4">
                    Manage events, entries, and score reviews.
                  </Heading>
                  <Text mt="3" color="gray.600" maxW="2xl">
                    Create new events, monitor applications, and keep event activity
                    organized from one dashboard.
                  </Text>
                </Box>
                <Button as={NextLink} href="/" variant="outline">
                  Open student portal
                </Button>
              </Flex>
            </CardBody>
          </Card>

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

          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="6" id="event-config">
            <Card borderRadius="2xl" boxShadow="lg">
              <CardHeader>
                <Heading size="md">Create event</Heading>
                <Text mt="2" color="gray.500">
                  Add a new event to the schedule.
                </Text>
              </CardHeader>
              <CardBody pt="0">
                <form action={createEventAction}>
                  <Stack spacing="4">
                    <FormControl isRequired>
                      <FormLabel>Event name</FormLabel>
                      <Input name="name" placeholder="Campus Pitch Duel" />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        name="description"
                        rows={4}
                        placeholder="Short event description"
                      />
                    </FormControl>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing="4">
                      <FormControl>
                        <FormLabel>Event type</FormLabel>
                        <Select name="eventType" defaultValue="individual">
                          <option value="individual">Individual</option>
                          <option value="team">Team</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Team size</FormLabel>
                        <Input name="teamSize" type="number" min="1" defaultValue="1" />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Capacity</FormLabel>
                        <Input
                          name="maxParticipants"
                          type="number"
                          min="1"
                          defaultValue="30"
                        />
                      </FormControl>
                    </SimpleGrid>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing="4">
                      <FormControl isRequired>
                        <FormLabel>Start time</FormLabel>
                        <Input name="startAt" type="datetime-local" />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>End time</FormLabel>
                        <Input name="endAt" type="datetime-local" />
                      </FormControl>
                    </SimpleGrid>
                    <FormControl isRequired>
                      <FormLabel>Summary</FormLabel>
                      <Textarea
                        name="ruleSummary"
                        rows={4}
                        placeholder="Short event summary"
                      />
                    </FormControl>
                    <Button type="submit" colorScheme="teal">
                      Create event
                    </Button>
                  </Stack>
                </form>
              </CardBody>
            </Card>

            <Card borderRadius="2xl" boxShadow="lg">
              <CardHeader>
                <Heading size="md">Current events</Heading>
                <Text mt="2" color="gray.500">
                  Schedules, team settings, and assigned judges.
                </Text>
              </CardHeader>
              <CardBody pt="0">
                <Stack spacing="4">
                  {data.events.map((event) => (
                    <Card key={event.id} variant="outline" borderRadius="xl">
                      <CardBody>
                        <Stack spacing="3">
                          <Flex align="start" justify="space-between" gap="3">
                            <Box>
                              <Heading size="sm">{event.name}</Heading>
                              <Text mt="1" color="gray.500" fontSize="sm">
                                {formatDate(event.startAt)}
                              </Text>
                            </Box>
                            <Badge colorScheme={statusColor(event.status)}>
                              {event.status}
                            </Badge>
                          </Flex>
                          <HStack spacing="2" flexWrap="wrap">
                            <Badge variant="subtle" colorScheme="purple">
                              {event.eventType === "team" ? "Team" : "Individual"}
                            </Badge>
                            <Badge variant="subtle" colorScheme="cyan">
                              Team size {event.teamSize}
                            </Badge>
                            <Badge variant="subtle" colorScheme="gray">
                              Capacity {event.maxParticipants}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            Judges: {event.judges.join(", ")}
                          </Text>
                        </Stack>
                      </CardBody>
                    </Card>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="6">
            <Card borderRadius="2xl" boxShadow="lg">
              <CardHeader>
                <Heading size="md">Applications</Heading>
                <Text mt="2" color="gray.500">
                  Recent student registrations.
                </Text>
              </CardHeader>
              <CardBody pt="0">
                <StructuredList>
                  {data.applications.map((application) => (
                    <StructuredListItem key={application.id}>
                      <StructuredListCell>
                        <Box>
                          <Text fontWeight="semibold">{application.studentName}</Text>
                          <Text color="gray.500" fontSize="sm">
                            {application.eventName}
                          </Text>
                        </Box>
                      </StructuredListCell>
                      <StructuredListCell flex="0">
                        <Stack spacing="1" align="end">
                          <Badge colorScheme={statusColor(application.status)}>
                            {formatStatus(application.status)}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(application.appliedAt)}
                          </Text>
                        </Stack>
                      </StructuredListCell>
                    </StructuredListItem>
                  ))}
                </StructuredList>
              </CardBody>
            </Card>

            <Card borderRadius="2xl" boxShadow="lg" id="score-queue">
              <CardHeader>
                <Heading size="md">Score review</Heading>
                <Text mt="2" color="gray.500">
                  Review submissions and update their status.
                </Text>
              </CardHeader>
              <CardBody pt="0">
                <Stack spacing="4">
                  {data.validationQueue.map((item) => (
                    <Card key={item.id} variant="outline" borderRadius="xl">
                      <CardBody>
                        <Stack spacing="4">
                          <Flex align="start" justify="space-between" gap="3">
                            <Box>
                              <Heading size="sm">{item.eventName}</Heading>
                              <Text mt="1" color="gray.500" fontSize="sm">
                                {item.roundName} / {item.participantName}
                              </Text>
                            </Box>
                            <Badge colorScheme={statusColor(item.status)}>
                              {formatStatus(item.status)}
                            </Badge>
                          </Flex>
                          <HStack justify="space-between" align="start">
                            <Text color="gray.600" fontSize="sm">
                              Reviewed by {item.judgeName}
                            </Text>
                            <Text fontWeight="semibold">
                              {item.weightedTotal.toFixed(1)}
                            </Text>
                          </HStack>
                          <HStack spacing="3" flexWrap="wrap">
                            {item.status === "draft" ? (
                              <form action={validateScoreDraft}>
                                <input type="hidden" name="draftId" value={item.id} />
                                <Button type="submit" size="sm" colorScheme="teal">
                                  Validate
                                </Button>
                              </form>
                            ) : null}
                            {item.status === "draft" || item.status === "validated" ? (
                              <form action={lockScoreDraft}>
                                <input type="hidden" name="draftId" value={item.id} />
                                <Button type="submit" size="sm" variant="outline">
                                  Lock
                                </Button>
                              </form>
                            ) : null}
                          </HStack>
                        </Stack>
                      </CardBody>
                    </Card>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Stack>
      </Container>
    </AppShell>
  );
}
