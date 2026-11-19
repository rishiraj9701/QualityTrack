export interface DemoUser {
  id: string;
  name: string;
  email: string;
  password?: string; // stored hashed or masked for demo
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: string;
  updatedAt: string;
}

const INITIAL_USERS: DemoUser[] = [
  {
    id: 'usr_101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    role: 'Product Manager',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'usr_102',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    role: 'Software Architect',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'usr_103',
    name: 'Rishi Kumar',
    email: 'rishi.qa@example.com',
    role: 'QA Automation Engineer',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'usr_104',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    role: 'Security Analyst',
    status: 'INACTIVE',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

class UserStore {
  private users: DemoUser[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    // Deep clone initial seed users
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
  }

  public getAll(): DemoUser[] {
    return [...this.users];
  }

  public findById(id: string): DemoUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  public findByEmail(email: string): DemoUser | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public add(user: DemoUser): DemoUser {
    this.users.unshift(user);
    return user;
  }

  public update(id: string, updates: Partial<DemoUser>): DemoUser | null {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.users[idx] = {
      ...this.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.users[idx];
  }

  public delete(id: string): boolean {
    const initialLen = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    return this.users.length < initialLen;
  }
}

export const userStore = new UserStore();
