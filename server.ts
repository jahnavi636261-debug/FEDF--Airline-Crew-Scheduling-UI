import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client on the server side
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// ============================================
// MOCK DATABASE & SEED DATA
// ============================================
let crewList = [
  {
    id: "crew-1",
    name: "Capt. Sarah Rogers",
    role: "Pilot",
    rank: "Captain",
    flightHoursThisWeek: 32,
    maxWeeklyHours: 40,
    status: "Active",
    baseAirport: "SFO",
    email: "sarah.rogers@skyline.com",
    phone: "+1 (555) 782-9011",
    avatarColor: "bg-blue-600",
    username: "sarah",
    password: "password123",
  },
  {
    id: "crew-2",
    name: "Capt. Marcus Aurelius",
    role: "Pilot",
    rank: "Captain",
    flightHoursThisWeek: 12,
    maxWeeklyHours: 40,
    status: "Resting",
    baseAirport: "JFK",
    email: "marcus.a@skyline.com",
    phone: "+1 (555) 345-6789",
    avatarColor: "bg-indigo-600",
    username: "marcus",
    password: "password123",
  },
  {
    id: "crew-3",
    name: "FO Kenji Sato",
    role: "Pilot",
    rank: "First Officer",
    flightHoursThisWeek: 24,
    maxWeeklyHours: 40,
    status: "Standby",
    baseAirport: "LAX",
    email: "k.sato@skyline.com",
    phone: "+1 (555) 901-2345",
    avatarColor: "bg-cyan-600",
    username: "kenji",
    password: "password123",
  },
  {
    id: "crew-4",
    name: "FO Aisha Bilal",
    role: "Pilot",
    rank: "First Officer",
    flightHoursThisWeek: 37,
    maxWeeklyHours: 40,
    status: "Active",
    baseAirport: "ORD",
    email: "aisha.b@skyline.com",
    phone: "+1 (555) 890-1234",
    avatarColor: "bg-emerald-600",
    username: "aisha",
    password: "password123",
  },
  {
    id: "crew-5",
    name: "Purser Daniel Miller",
    role: "Cabin Crew",
    rank: "Lead Flight Attendant",
    flightHoursThisWeek: 28,
    maxWeeklyHours: 40,
    status: "Active",
    baseAirport: "JFK",
    email: "d.miller@skyline.com",
    phone: "+1 (555) 456-7890",
    avatarColor: "bg-purple-600",
    username: "daniel",
    password: "password123",
  },
  {
    id: "crew-6",
    name: "FA Chloe Bennett",
    role: "Cabin Crew",
    rank: "Flight Attendant",
    flightHoursThisWeek: 15,
    maxWeeklyHours: 40,
    status: "Resting",
    baseAirport: "LAX",
    email: "chloe.b@skyline.com",
    phone: "+1 (555) 567-8901",
    avatarColor: "bg-pink-600",
    username: "chloe",
    password: "password123",
  },
  {
    id: "crew-7",
    name: "FA Liam O'Connor",
    role: "Cabin Crew",
    rank: "Flight Attendant",
    flightHoursThisWeek: 8,
    maxWeeklyHours: 40,
    status: "Active",
    baseAirport: "LAX",
    email: "l.oconnor@skyline.com",
    phone: "+1 (555) 678-9012",
    avatarColor: "bg-amber-600",
    username: "liam",
    password: "password123",
  },
  {
    id: "crew-8",
    name: "FA Mei-Ling Chen",
    role: "Cabin Crew",
    rank: "Flight Attendant",
    flightHoursThisWeek: 35,
    maxWeeklyHours: 40,
    status: "Active",
    baseAirport: "SFO",
    email: "meiling.c@skyline.com",
    phone: "+1 (555) 789-0123",
    avatarColor: "bg-teal-600",
    username: "meiling",
    password: "password123",
  },
  {
    id: "crew-9",
    name: "FA Sofia Perez",
    role: "Cabin Crew",
    rank: "Flight Attendant",
    flightHoursThisWeek: 0,
    maxWeeklyHours: 40,
    status: "On Leave",
    baseAirport: "SFO",
    email: "sofia.perez@skyline.com",
    phone: "+1 (555) 234-5678",
    avatarColor: "bg-red-500",
    username: "sofia",
    password: "password123",
  }
];

let flights = [
  {
    id: "flight-100",
    flightNumber: "SL-100",
    origin: "JFK",
    destination: "LAX",
    departureTime: "2026-05-28T08:00:00Z",
    arrivalTime: "2026-05-28T14:30:00Z",
    requiredPilots: 2,
    requiredCabinCrew: 3,
    status: "On Time",
    aircraftType: "Boeing 737 Max",
    assignedCrewIds: ["crew-2", "crew-3", "crew-5", "crew-7"], // Missing 1 flight attendant
  },
  {
    id: "flight-204",
    flightNumber: "SL-204",
    origin: "LAX",
    destination: "SFO",
    departureTime: "2026-05-28T16:30:00Z",
    arrivalTime: "2026-05-28T18:00:00Z",
    requiredPilots: 1,
    requiredCabinCrew: 2,
    status: "On Time",
    aircraftType: "Airbus A320",
    assignedCrewIds: ["crew-3", "crew-6", "crew-7"], // FO Kenji Sato, Chloe Bennett, Liam O'Connor
  },
  {
    id: "flight-305",
    flightNumber: "SL-305",
    origin: "ORD",
    destination: "JFK",
    departureTime: "2026-05-28T10:00:00Z",
    arrivalTime: "2026-05-28T13:15:00Z",
    requiredPilots: 2,
    requiredCabinCrew: 2,
    status: "On Time",
    aircraftType: "Boeing 737",
    assignedCrewIds: ["crew-4"], // Missing crew!
  },
  {
    id: "flight-411",
    flightNumber: "SL-411",
    origin: "SFO",
    destination: "ORD",
    departureTime: "2026-05-28T22:00:00Z",
    arrivalTime: "2026-05-29T02:00:00Z",
    requiredPilots: 1,
    requiredCabinCrew: 2,
    status: "On Time",
    aircraftType: "Airbus A321",
    assignedCrewIds: ["crew-1", "crew-8"], // Active crew
  }
];

let leaveRequests = [
  {
    id: "leave-1",
    crewId: "crew-9",
    crewName: "FA Sofia Perez",
    crewRole: "Cabin Crew",
    type: "Personal",
    startDate: "2026-05-25",
    endDate: "2026-06-01",
    status: "Approved",
    reason: "Family engagement out of state.",
    submittedAt: "2026-05-20T10:00:00Z",
  },
  {
    id: "leave-2",
    crewId: "crew-6",
    crewName: "FA Chloe Bennett",
    crewRole: "Cabin Crew",
    type: "Medical",
    startDate: "2026-05-30",
    endDate: "2026-06-03",
    status: "Pending",
    reason: "Dental operation recovery time required.",
    submittedAt: "2026-05-26T14:30:00Z",
  }
];

let notifications = [
  {
    id: "notif-1",
    title: "Flight Crew Under-staffed",
    message: "Flight SL-100 (JFK -> LAX) is missing 1 required cabin crew member.",
    severity: "warning",
    timestamp: new Date().toISOString(),
    read: false,
    flightId: "flight-100",
  },
  {
    id: "notif-2",
    title: "Severe Staffing Deficit",
    message: "Flight SL-305 (ORD -> JFK) requires 1 more pilot and 2 cabin crew members.",
    severity: "error",
    timestamp: new Date().toISOString(),
    read: false,
    flightId: "flight-305",
  },
];

// ============================================
// CONFLICT & RULES DETECTION ALGORITHMS
// ============================================

interface ConflictResult {
  hasConflict: boolean;
  type?: "overlap" | "duty_limit" | "insufficient_rest" | "leave";
  message?: string;
}

function checkCrewConflict(crewId: string, flightId: string): ConflictResult {
  const crew = crewList.find((c) => c.id === crewId);
  const targetFlight = flights.find((f) => f.id === flightId);

  if (!crew || !targetFlight) {
    return { hasConflict: false };
  }

  // 1. Leave Check
  if (crew.status === "On Leave") {
    return {
      hasConflict: true,
      type: "leave",
      message: `${crew.name} is currently approved for leave.`,
    };
  }

  const targetDeparture = new Date(targetFlight.departureTime).getTime();
  const targetArrival = new Date(targetFlight.arrivalTime).getTime();
  const flightDurationHours =
    (targetArrival - targetDeparture) / (1000 * 60 * 60);

  // 2. Weekly Duty Hour limit check
  if (crew.flightHoursThisWeek + flightDurationHours > crew.maxWeeklyHours) {
    return {
      hasConflict: true,
      type: "duty_limit",
      message: `${crew.name} is scheduled for ${crew.flightHoursThisWeek}h. Assigning this flight (${flightDurationHours.toFixed(1)}h) exceeds the maximum weekly limit of ${crew.maxWeeklyHours}h.`,
    };
  }

  // 3. Check for exact scheduling overlaps or rest periods against other flights
  for (const flight of flights) {
    if (flight.id === targetFlight.id) continue;
    if (flight.assignedCrewIds.includes(crewId)) {
      const otherDep = new Date(flight.departureTime).getTime();
      const otherArr = new Date(flight.arrivalTime).getTime();

      // Check overlap: Overlap exists if target starts during other flight, or other starts during target
      const isOverlap =
        (targetDeparture >= otherDep && targetDeparture < otherArr) ||
        (targetArrival > otherDep && targetArrival <= otherArr) ||
        (targetDeparture <= otherDep && targetArrival >= otherArr);

      if (isOverlap) {
        return {
          hasConflict: true,
          type: "overlap",
          message: `${crew.name} has overlapping assignments. Already assigned to Flight ${flight.flightNumber} (${flight.origin} -> ${flight.destination}) at this exact period.`,
        };
      }

      // 4. Rest period safety rules (Minimum 10 hours of rest between consecutive flights)
      // If other flight ends before target flight starts: rest calculation is targetDeparture - otherArr
      // If target flight ends before other flight starts: rest calculation is otherDep - targetArrival
      const hoursToNextFlight = (targetDeparture - otherArr) / (1000 * 60 * 60);
      const hoursFromPrevFlight = (otherDep - targetArrival) / (1000 * 60 * 60);

      const MIN_REST_HOURS = 10;
      if (hoursToNextFlight > 0 && hoursToNextFlight < MIN_REST_HOURS) {
        return {
          hasConflict: true,
          type: "insufficient_rest",
          message: `Insufficient rest period! ${crew.name} has only ${hoursToNextFlight.toFixed(1)} hours of rest between landing of Flight ${flight.flightNumber} and takeoff of Flight ${targetFlight.flightNumber} (Minimum required: ${MIN_REST_HOURS} hours).`,
        };
      }

      if (hoursFromPrevFlight > 0 && hoursFromPrevFlight < MIN_REST_HOURS) {
        return {
          hasConflict: true,
          type: "insufficient_rest",
          message: `Insufficient rest period! ${crew.name} has only ${hoursFromPrevFlight.toFixed(1)} hours of rest between landing of Flight ${targetFlight.flightNumber} and departure of Flight ${flight.flightNumber} (Minimum required: ${MIN_REST_HOURS} hours).`,
        };
      }
    }
  }

  return { hasConflict: false };
}

// Global compliance checker for alerts
function reevaluateStaffingAndAlerts() {
  const newNotifications: typeof notifications = [];

  flights.forEach((flight) => {
    const assignedCrew = crewList.filter((c) =>
      flight.assignedCrewIds.includes(c.id)
    );

    const pilots = assignedCrew.filter((c) => c.role === "Pilot");
    const attendants = assignedCrew.filter((c) => c.role === "Cabin Crew");

    if (pilots.length < flight.requiredPilots) {
      newNotifications.push({
        id: `notif-auto-pilot-${flight.id}`,
        title: `Pilot Deficit: ${flight.flightNumber}`,
        message: `Flight ${flight.flightNumber} needs ${flight.requiredPilots} pilots, but only ${pilots.length} is/are assigned.`,
        severity: "error",
        timestamp: new Date().toISOString(),
        read: false,
        flightId: flight.id,
      });
    }

    if (attendants.length < flight.requiredCabinCrew) {
      newNotifications.push({
        id: `notif-auto-crew-${flight.id}`,
        title: `Cabin Crew Deficit: ${flight.flightNumber}`,
        message: `Flight ${flight.flightNumber} needs ${flight.requiredCabinCrew} cabin crew staff, but only ${attendants.length} is/are assigned.`,
        severity: "warning",
        timestamp: new Date().toISOString(),
        read: false,
        flightId: flight.id,
      });
    }

    // Over-limit checks
    assignedCrew.forEach((c) => {
      const conflict = checkCrewConflict(c.id, flight.id);
      // Skip if checking against itself, but check if there's external conflicts
      if (conflict.hasConflict && conflict.type === "duty_limit") {
        newNotifications.push({
          id: `notif-limit-${flight.id}-${c.id}`,
          title: `Duty Hour Limit Breach: ${c.name}`,
          message: conflict.message || "",
          severity: "error",
          timestamp: new Date().toISOString(),
          read: false,
          flightId: flight.id,
        });
      }
    });
  });

  // Keep manual notifications, add new ones (filtered to unique IDs)
  notifications = [
    ...notifications.filter((n) => !n.id.startsWith("notif-auto-") && !n.id.startsWith("notif-limit-")),
    ...newNotifications,
  ];
}

// ============================================
// REST API ENDPOINTS
// ============================================

// Messages database in memory
let crewMessages = [
  {
    id: "msg-1",
    senderId: "crew-5",
    senderName: "Purser Daniel Miller",
    receiverId: "crew-6",
    receiverName: "FA Chloe Bennett",
    content: "Hi Chloe, can you cover the reserve shift for flight SL-102 tomorrow morning?",
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: "msg-2",
    senderId: "crew-6",
    senderName: "FA Chloe Bennett",
    receiverId: "crew-5",
    receiverName: "Purser Daniel Miller",
    content: "Sure Daniel, I've cleared my mandatory rest period and can pick up that flight!",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "msg-3",
    senderId: "crew-1",
    senderName: "Capt. Sarah Rogers",
    receiverId: "crew-4",
    receiverName: "FO Aisha Bilal",
    content: "Aisha, please review the revised SFO route weather briefing for the flight tomorrow.",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  }
];

// 1. Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin") {
    return res.json({
      id: "user-admin",
      username: "admin",
      name: "M Sampath (Admin)",
      role: "Admin",
    });
  } else if (username === "crew" && password === "crew") {
    return res.json({
      id: "user-crew",
      username: "crew",
      name: "FA Chloe Bennett (Crew Member)",
      role: "Crew",
      crewId: "crew-6",
    });
  }

  // Find by stored custom credentials in the crewList
  const linkedCrew = crewList.find(
    (c: any) =>
      c.username?.toLowerCase() === username.toLowerCase() ||
      c.name.toLowerCase().includes(username.toLowerCase()) ||
      c.email.toLowerCase() === username.toLowerCase()
  );

  if (linkedCrew) {
    if (linkedCrew.password && linkedCrew.password !== password) {
      return res.status(401).json({ message: "Invalid credentials. Password did not match." });
    }
    return res.json({
      id: `user-${linkedCrew.id}`,
      username: linkedCrew.username || username,
      name: linkedCrew.name,
      role: "Crew",
      crewId: linkedCrew.id,
    });
  }

  return res.status(401).json({ message: "Invalid credentials. Try preset accounts: 'admin/admin' or 'crew/crew'." });
});

// Messages Endpoints
app.get("/api/messages", (req, res) => {
  res.json(crewMessages);
});

app.post("/api/messages", (req, res) => {
  const { senderId, senderName, receiverId, content } = req.body;
  if (!senderId || !receiverId || !content) {
    return res.status(400).json({ message: "Sender ID, receiver ID, and content are required." });
  }

  const receiver = crewList.find((c) => c.id === receiverId);
  const receiverName = receiver ? receiver.name : "Unknown Crew";

  const newMessage = {
    id: `msg-${Date.now()}`,
    senderId,
    senderName: senderName || "System",
    receiverId,
    receiverName,
    content,
    timestamp: new Date().toISOString()
  };

  crewMessages.push(newMessage);
  res.status(201).json(newMessage);
});

// 2. Crew Endpoints
app.get("/api/crew", (req, res) => {
  res.json(crewList);
});

app.post("/api/crew", (req, res) => {
  const { name, role, rank, baseAirport, email, phone, username, password } = req.body;

  if (!name || !role || !baseAirport) {
    return res.status(400).json({ message: "Missing required crew details (name, role, or airport)" });
  }

  // Create clean username and password if not supplied
  const generatedUsername = username || name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const generatedPassword = password || "password123";

  const newCrew = {
    id: `crew-${Date.now()}`,
    name,
    role,
    rank: rank || (role === "Pilot" ? "First Officer" : "Flight Attendant"),
    flightHoursThisWeek: 0,
    maxWeeklyHours: 40,
    status: "Active" as const,
    baseAirport,
    email: email || `${generatedUsername}@skyline.com`,
    phone: phone || "+1 (555) 005-0000",
    avatarColor: role === "Pilot" ? "bg-amber-600" : "bg-purple-600",
    username: generatedUsername,
    password: generatedPassword,
  };

  crewList.push(newCrew);
  reevaluateStaffingAndAlerts();
  res.status(201).json(newCrew);
});

app.put("/api/crew/:id", (req, res) => {
  const { id } = req.params;
  const index = crewList.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Crew member not found" });
  }

  crewList[index] = { ...crewList[index], ...req.body };
  reevaluateStaffingAndAlerts();
  res.json(crewList[index]);
});

app.delete("/api/crew/:id", (req, res) => {
  const { id } = req.params;
  crewList = crewList.filter((c) => c.id !== id);

  // Remove their assignments too
  flights = flights.map((f) => ({
    ...f,
    assignedCrewIds: f.assignedCrewIds.filter((cid) => cid !== id),
  }));

  reevaluateStaffingAndAlerts();
  res.json({ message: "Crew member successfully terminated/removed from systems." });
});

// 3. Flights Endpoints
app.get("/api/flights", (req, res) => {
  res.json(flights);
});

app.post("/api/flights", (req, res) => {
  const {
    flightNumber,
    origin,
    destination,
    departureTime,
    arrivalTime,
    requiredPilots,
    requiredCabinCrew,
    aircraftType,
  } = req.body;

  if (!flightNumber || !origin || !destination || !departureTime || !arrivalTime) {
    return res.status(400).json({ message: "Missing required flight parameters." });
  }

  const newFlight = {
    id: `flight-${Date.now()}`,
    flightNumber,
    origin,
    destination,
    departureTime,
    arrivalTime,
    requiredPilots: Number(requiredPilots) || 2,
    requiredCabinCrew: Number(requiredCabinCrew) || 3,
    status: "On Time" as const,
    aircraftType: aircraftType || "Boeing 737",
    assignedCrewIds: [],
  };

  flights.push(newFlight);
  reevaluateStaffingAndAlerts();
  res.status(201).json(newFlight);
});

app.put("/api/flights/:id", (req, res) => {
  const { id } = req.params;
  const index = flights.findIndex((f) => f.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Flight not found" });
  }

  flights[index] = { ...flights[index], ...req.body };
  reevaluateStaffingAndAlerts();
  res.json(flights[index]);
});

// 4. Crew assignment conflict validation & toggle trigger
app.post("/api/flights/:flightId/assign", (req, res) => {
  const { flightId } = req.params;
  const { crewId, override } = req.body;

  const flight = flights.find((f) => f.id === flightId);
  const crew = crewList.find((c) => c.id === crewId);

  if (!flight || !crew) {
    return res.status(404).json({ message: "Flight or Crew member not found." });
  }

  const isAssigned = flight.assignedCrewIds.includes(crewId);

  if (isAssigned) {
    // Unassigning is safe, remove and update flight hours
    flight.assignedCrewIds = flight.assignedCrewIds.filter((id) => id !== crewId);

    // Calculate flight duration and subtract from active flight hours
    const durationHours =
      (new Date(flight.arrivalTime).getTime() - new Date(flight.departureTime).getTime()) /
      (1000 * 60 * 60);
    crew.flightHoursThisWeek = Math.max(0, crew.flightHoursThisWeek - Math.round(durationHours));

    reevaluateStaffingAndAlerts();
    return res.json({
      flight,
      crew,
      message: `${crew.name} has been removed from Flight ${flight.flightNumber}.`,
    });
  } else {
    // Check conflicts before assigning
    const conflictResult = checkCrewConflict(crewId, flightId);

    if (conflictResult.hasConflict && !override) {
      return res.status(409).json({
        conflict: true,
        type: conflictResult.type,
        message: conflictResult.message,
      });
    }

    // Normal assignment
    flight.assignedCrewIds.push(crewId);

    // Add hours
    const durationHours =
      (new Date(flight.arrivalTime).getTime() - new Date(flight.departureTime).getTime()) /
      (1000 * 60 * 60);
    crew.flightHoursThisWeek += Math.round(durationHours);

    reevaluateStaffingAndAlerts();
    return res.json({
      flight,
      crew,
      message: `${crew.name} was successfully assigned to Flight ${flight.flightNumber}.`,
    });
  }
});

// 5. Leave Endpoints
app.get("/api/leaves", (req, res) => {
  res.json(leaveRequests);
});

app.post("/api/leaves", (req, res) => {
  const { crewId, type, startDate, endDate, reason } = req.body;
  const crew = crewList.find((c) => c.id === crewId);

  if (!crew || !type || !startDate || !endDate) {
    return res.status(400).json({ message: "Missing leave parameters." });
  }

  const newLeave = {
    id: `leave-${Date.now()}`,
    crewId,
    crewName: crew.name,
    crewRole: crew.role,
    type,
    startDate,
    endDate,
    status: "Pending" as const,
    reason: reason || "No description provided",
    submittedAt: new Date().toISOString(),
  };

  leaveRequests.push(newLeave);
  res.status(201).json(newLeave);
});

app.post("/api/leaves/:id/resolve", (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // "Approved" or "Rejected"

  const request = leaveRequests.find((r) => r.id === id);
  if (!request) {
    return res.status(404).json({ message: "Leave request not found." });
  }

  request.status = action === "Approved" ? "Approved" : "Rejected";

  if (action === "Approved") {
    const crew = crewList.find((c) => c.id === request.crewId);
    if (crew) {
      crew.status = "On Leave";
      // Unassign them from all flights to prevent safety breaks
      flights.forEach((f) => {
        if (f.assignedCrewIds.includes(crew.id)) {
          f.assignedCrewIds = f.assignedCrewIds.filter((cid) => cid !== crew.id);
          // Recalculate working hours down
          const dur = (new Date(f.arrivalTime).getTime() - new Date(f.departureTime).getTime()) / (1000 * 60 * 60);
          crew.flightHoursThisWeek = Math.max(0, crew.flightHoursThisWeek - Math.round(dur));
        }
      });
      reevaluateStaffingAndAlerts();
    }
  } else {
    // If rejected, ensure we reset state to active if they were 'On Leave'
    const crew = crewList.find((c) => c.id === request.crewId);
    if (crew && crew.status === "On Leave") {
      crew.status = "Active";
      reevaluateStaffingAndAlerts();
    }
  }

  res.json({ request, message: `Leave request has been ${action.toLowerCase()}.` });
});

// 6. Notifications Endpoints
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

app.post("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  const notif = notifications.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

// ============================================
// GEMINI SERVER-SIDE AIRLINE OPTIMIZER CO-PILOT
// ============================================
app.get("/api/ai/analyze", async (req, res) => {
  if (!ai) {
    return res.json({
      optimized: false,
      summary: "AI Co-Pilot is currently offline. Please configure your GEMINI_API_KEY environment variable in settings to activate real-time predictive scheduling analysis.",
      violations: [],
      recommendations: [
        { title: "Configure API Key", detail: "Set GEMINI_API_KEY in the Secrets panel." }
      ],
      marketInsights: "Aviation regulations enforce strict duty hours limit (14h single shift, max 40h on-duty week). Connect AI to auto-enforce these constraints."
    });
  }

  try {
    // Assemble the complete current state context
    const currentCrewStatus = crewList.map(c => ({
      name: c.name,
      role: c.role,
      rank: c.rank,
      base: c.baseAirport,
      weeklyHours: c.flightHoursThisWeek,
      limit: c.maxWeeklyHours,
      status: c.status
    }));

    const flightScheds = flights.map(f => {
      const crewOnFlight = crewList
        .filter(c => f.assignedCrewIds.includes(c.id))
        .map(c => `${c.name} (${c.role})`);
      return {
        number: f.flightNumber,
        route: `${f.origin} -> ${f.destination}`,
        times: `${f.departureTime} to ${f.arrivalTime}`,
        aircraft: f.aircraftType,
        required: `Pilots: ${f.requiredPilots}, Attendants: ${f.requiredCabinCrew}`,
        assigned: crewOnFlight
      };
    });

    const activeLeaves = leaveRequests.filter(l => l.status === "Approved");

    const prompt = `Analyze this airline's crew scheduling state and generate a JSON optimization report.

State Context:
- **Active Crew**: ${JSON.stringify(currentCrewStatus)}
- **Flights List**: ${JSON.stringify(flightScheds)}
- **Approved Leaves**: ${JSON.stringify(activeLeaves)}

Strict aviation compliance rules:
1. Max weekly duty hours is 40. Warn if any crew member approaches or reaches this.
2. Staffing requirements must be met for pilots and cabin crew on each flight.
3. Crew members cannot hold overlapping slots.
4. Give specific, step-by-step staffing reassignments for understaffed flights (e.g. SL-100 or SL-305) utilizing non-conflicting standby/resting crew like Capt. Marcus Aurelius or FA Chloe Bennett.

Generate the output in raw JSON matching the following schema structure:
{
  "summary": "String general health assessment of the schedule roster...",
  "violations": [
    {
      "flight": "Flight number if applicable or 'General'",
      "description": "Violation description",
      "severity": "high" | "medium" | "low"
    }
  ],
  "recommendations": [
    {
      "title": "Short title recommendation",
      "detail": "Clear instruction detailing which crew to assign/unassign to solve a conflict or staffing issue."
    }
  ],
  "metrics": {
    "totalStaff": number,
    "utilizationRatePercent": number,
    "fullyStaffedPercentage": number
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an expert AI Airline Dispatcher and Roster Optimization Engine. You identify scheduling bottlenecks and provide exact human-readable shift assignment recommendations.",
      }
    });

    const reportText = response.text || "{}";
    const reportData = JSON.parse(reportText.trim());

    res.json({
      optimized: true,
      ...reportData
    });
  } catch (error: any) {
    console.error("Gemini optimization error: ", error);
    res.status(500).json({
      optimized: false,
      summary: "Error querying Gemini API. Check console logs.",
      violations: [],
      recommendations: []
    });
  }
});

// Run initial staffing alert generation
reevaluateStaffingAndAlerts();

// ============================================
// VITE DEV SERVER / PRODUCTION SERVING
// ============================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://localhost:${PORT}`);
  });
}

startServer();
