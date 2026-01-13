// Employee entity matching PennPOS CamelCase schema
export interface Employee {
  Id: string
  FirstName: string
  MiddleName: string | null
  LastName: string
  Phone: string | null
  Address: string | null
  City: string | null
  State: string | null
  Zip: string | null
  EmergencyPhone: string | null
  Login: string // 4-digit PIN
  RoleId: string
  Position: PositionType
  PayRate: number | null
  PayType: PayType | null
  MaritalStatus: MaritalStatus | null
  NumberExemptions: number | null
  PayrollId: string | null
  HireDate: string | null
  TerminateDate: string | null
  TerminateReason: string | null
  PayEffectiveDate: string | null
  BirthDate: string | null
  SocialSecurityNumber: string | null
  ShowInSchedule: number | null // Boolean (0/1)
  CreatedDate: string
  ModifiedDate: string
  CreatedBy: string | null
  ModifiedBy: string | null
  CreatorId: number | null
}

// Role entity matching PennPOS CamelCase schema
export interface Role {
  Id: string
  Name: string
  Rights: string // Comma-separated permissions
  CreatedDate: string
  ModifiedDate: string
  CreatedBy: string | null
  ModifiedBy: string | null
  CreatorId: number | null
}

// Enums matching PennPOS
export enum PositionType {
  Owner = 0,
  ManagingOwner = 1,
  GeneralManager = 2,
  AssistantManager = 3,
  Hourly = 4,
  CrewLeader = 5,
}

export enum PayType {
  Hourly = 0,
  Salary = 1,
  AsstManHourly = 2,
  GMHourly = 3,
}

export enum MaritalStatus {
  Single = 0,
  Married = 1,
}

// Auth state types
export interface AuthState {
  currentUser: Employee | null
  userRoles: string[]
  isAuthenticated: boolean
}

export interface LoginCredentials {
  pin: string
}
