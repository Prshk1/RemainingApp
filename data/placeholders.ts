// Placeholder data — replace with real data source later

export interface AttendanceEntry {
  id: string;
  day: string;
  date: string;
  timeIn: string;
  timeOut: string;
  hours: number;
  isManual?: boolean;
}

export interface BonusEntry {
  id: string;
  title: string;
  date: string;
  status: "Approved" | "Pending";
  hours: number;
  iconName: string; // Ionicons name
}

export interface DashboardStats {
  remainingHours: number;
  totalRequired: number;
  completedHours: number;
  completedPercent: number;
  daysLogged: number;
  estimatedCompletion: string;
  timerHours: number;
  timerMins: number;
  timerSecs: number;
  timerStartedAt: string;
}

export const dashboardStats: DashboardStats = {
  remainingHours: 120,
  totalRequired: 400,
  completedHours: 280,
  completedPercent: 70,
  daysLogged: 24,
  estimatedCompletion: "May 15, 2024",
  timerHours: 2,
  timerMins: 45,
  timerSecs: 10,
  timerStartedAt: "08:00 AM",
};

export const attendanceEntries: AttendanceEntry[] = [
  {
    id: "1",
    day: "Monday",
    date: "Oct 16",
    timeIn: "08:00 AM",
    timeOut: "04:00 PM",
    hours: 8,
    isManual: true,
  },
  {
    id: "2",
    day: "Friday",
    date: "Oct 13",
    timeIn: "09:00 AM",
    timeOut: "05:00 PM",
    hours: 8,
    isManual: false,
  },
  {
    id: "3",
    day: "Thursday",
    date: "Oct 12",
    timeIn: "08:30 AM",
    timeOut: "04:30 PM",
    hours: 8,
    isManual: true,
  },
  {
    id: "4",
    day: "Wednesday",
    date: "Oct 11",
    timeIn: "08:00 AM",
    timeOut: "01:00 PM",
    hours: 5,
    isManual: false,
  },
];

export const bonusEntries: BonusEntry[] = [
  {
    id: "1",
    title: "Leadership Seminar",
    date: "Oct 15, 2023",
    status: "Approved",
    hours: 4.0,
    iconName: "school",
  },
  {
    id: "2",
    title: "Weekend Volunteering",
    date: "Oct 10, 2023",
    status: "Approved",
    hours: 6.5,
    iconName: "heart",
  },
  {
    id: "3",
    title: "Extra Project Research",
    date: "Oct 05, 2023",
    status: "Pending",
    hours: 2.0,
    iconName: "document-text",
  },
  {
    id: "4",
    title: "Workshop Facilitation",
    date: "Sep 28, 2023",
    status: "Approved",
    hours: 8.0,
    iconName: "color-palette",
  },
  {
    id: "5",
    title: "Hackathon Participation",
    date: "Sep 15, 2023",
    status: "Approved",
    hours: 12.0,
    iconName: "construct",
  },
];

export const attendanceDetail = {
  date: "November 15, 2023",
  timeIn: "09:00 AM",
  timeOut: "05:30 PM",
  totalHours: 8.5,
  entryType: "Automatic",
  journalPreview:
    '"Worked on UI designs for the attendance tracking module. Completed wireframes and reviewed with the team. Ready for the next sprint."',
};
