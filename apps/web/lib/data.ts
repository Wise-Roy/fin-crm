import type {
  Reimbursement,
  Notification,
} from "./types";

// Reimbursements — no backend endpoint yet, keep as demo
export const INIT_REIMB: Reimbursement[] = [
  { id: "r1", tenant_id: "demo", task_id: "t1", amount: 450, description: "Notary charges for document attestation", status: "APPROVED", created_at: "2024-07-28T00:00:00Z", updated_at: "2024-07-28T00:00:00Z" },
  { id: "r2", tenant_id: "demo", task_id: "t2", amount: 1200, description: "ROC filing government fee", status: "PENDING", created_at: "2024-08-01T00:00:00Z", updated_at: "2024-08-01T00:00:00Z" },
  { id: "r3", tenant_id: "demo", task_id: "t3", amount: 280, description: "Courier charges for document dispatch", status: "PENDING", created_at: "2024-08-03T00:00:00Z", updated_at: "2024-08-03T00:00:00Z" },
  { id: "r4", tenant_id: "demo", task_id: "t4", amount: 2000, description: "MCA portal fee for DIR-12 filing", status: "PENDING", created_at: "2024-08-04T00:00:00Z", updated_at: "2024-08-04T00:00:00Z" },
  { id: "r5", tenant_id: "demo", task_id: "t5", amount: 800, description: "Stamp duty and postage charges", status: "APPROVED", created_at: "2024-07-30T00:00:00Z", updated_at: "2024-07-30T00:00:00Z" },
];

// Notifications — no backend endpoint yet, keep as demo
export const INIT_NOTIFS: Notification[] = [
  { id: "n1", title: "Task Due", message: "FLA Return for Bajaj Finserv is due tomorrow", is_read: false, created_at: "2024-08-05T10:00:00Z" },
  { id: "n2", title: "Reimbursement", message: "Priya Sharma submitted reimbursement ₹450 for Infosys", is_read: false, created_at: "2024-08-05T08:00:00Z" },
  { id: "n3", title: "Approvals", message: "2 new members are awaiting approval", is_read: false, created_at: "2024-08-05T06:00:00Z" },
  { id: "n4", title: "Task Update", message: "Board Meeting Minutes moved to Review by Ankit Kumar", is_read: true, created_at: "2024-08-05T04:00:00Z" },
  { id: "n5", title: "Task Completed", message: "DIN Update for Bajaj Finserv marked completed", is_read: true, created_at: "2024-08-04T10:00:00Z" },
];
