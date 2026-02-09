export interface Activity {
  id: string;
  title: string;
  description?: string;
  points?: number;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Schedule {
  id: string;
  title: string;
  date?: string;
  description?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
}

// ==================== ADMIN TYPES ====================

export interface AdminUser {
  _id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  isAdmin: boolean;
  active: boolean;
  totalPoints: number;
  createdAt: string;
}

export interface AdminActivity {
  _id: string;
  name: string;
  description: string;
  color: string;
  stickerId?: { _id: string; name: string; imageUrl?: string };
  subActivities: AdminSubActivity[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSubActivity {
  _id: string;
  name: string;
  description: string;
  color: string;
  stickerId?: { _id: string; name: string; imageUrl?: string };
  active: boolean;
  order: number;
}

export interface AdminSchedule {
  _id: string;
  activityId: {
    _id: string;
    name: string;
    description?: string;
    color?: string;
  };
  groupId?: { _id: string; name: string; shift?: string };
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  subActivitySchedules: {
    subActivityId: string;
    name: string;
    startTime: string;
    endTime: string;
    order: number;
  }[];
  order: number;
  active: boolean;
}

export interface AdminChallenge {
  _id: string;
  title: string;
  description: string;
  slug: string;
  difficulty: string;
  points: number;
  instructions: string;
  successCriteria?: string;
  tags: string[];
  completionCount: number;
  isActive: boolean;
}

export interface AdminSticker {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
  active: boolean;
}

export interface AdminGroup {
  _id: string;
  name: string;
  description?: string;
  capacityMax: number;
  shift: string;
  scheduleId?: any;
  active: boolean;
  memberCount: number;
}

export interface AdminAward {
  _id: string;
  stickerId: { _id: string; name: string; imageUrl?: string };
  activityId: { _id: string; name: string };
  subActivityId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
  active: boolean;
}

export interface AdminGroupMember {
  _id: string;
  userId: {
    _id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  groupId: string;
  assignedAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalActivities: number;
  totalSchedules: number;
  totalGroups: number;
  totalStickers: number;
  totalChallenges: number;
  totalAwards: number;
}
