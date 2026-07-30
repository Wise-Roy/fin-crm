create type user_role as enum (
    'OWNER',
    'ADMIN',
    'MANAGER',
    'EMPLOYEE'
);

create type task_status as enum (
    'TODO',
    'IN_PROGRESS',
    'WAITING_CLIENT',
    'REVIEW',
    'COMPLETED',
    'CANCELLED'
);

create type reimbursement_status as enum (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PAID'
);

create type payment_status as enum (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'REFUNDED'
);