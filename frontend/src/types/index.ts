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
