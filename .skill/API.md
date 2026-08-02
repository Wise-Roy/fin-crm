tenant [icon: user, color: yellow] {
  id uuid pk
  name varChar
  subdomain varChar unique
  created_at timestamp
  updated_at timestamp
}
tennat_config [icon: user, color: yellow] {
  id uuid pk
  tenant_id fk tenant
  config_key varChar
  config_value JSONB
  created_at timestamp
  updated_at timestamp
}


users [icon: user, color: blue] {
  id uuid pk
  name varChar
  role varChar
  phone varChar
  email varChar
  tenant_id fk tenant
  position varChar
  is_active boolean
  created_at timestamp
  updated_at timestamp
}

client [icon: user, color: blue]{
id uuid pk
tenant_id fk tenant
name varChar
email varChar
phone varChar
is_active boolean
created_at timestamp
updated_at timestamp
}
client_group [icon: user, color: blue]{
id uuid pk
tenant_id fk tenant
client_id fk client
group_name varChar
is_active boolean
created_at timestamp
  updated_at timestamp
}

categories [icon: stack-overflow , color: red] {
  id uuid pk
  tenant_id fk tenant
  name varChar
  is_predefined boolean
  created_at timestamp
  updated_at timestamp
}

sub_categories [icon: stack-overflow , color: red] {
  id uuid pk
  tenant_id fk tenant
  category_id fk categories
  name varChar
  created_at timestamp
  updated_at timestamp
}

task [icon: checklist , color: green] {
  id uuid pk
  tenant_id fk tenant
  title varChar
  description text
  category_id fk categories
  subcategory_id fk sub_categories
  assigned_to_employee_id fk users
  client_user_id fk client_user
  client_group_id fk client_group_id
  created_By uuid
  status varChar
  priority varChar
  due_date timestamp
  created_at timestamp
  updated_at timestamp
}

task_reimbursement [icon: money , color: grey]{
  id uuid pk
  tenant_id fk tenant
  task_id fk task
  amount number
  proof_file varChar
  description text
  status varChar
  created_at timestamp
  updated_at timestamp
}

task_payments [icon: money , color: grey]{
  id uuid pk
  tenant_id fk tenant
  task_id fk task
  payment_type varChar
  amount number
  payment_status varChar
  paid_at timestamp
  created_at timestamp
  updated_at timestamp
}

task_history [icon: history , color: orange]{
id uuid pk
tenant_id fk tenant
task_id fk task
changed_by_user_id fk users
action varChar
old_value varChar
new_value varChar
created_at timestamp
}

notifications [icon: history , color: orange]{
 id uuid pk
 tenant_id fk tenant
 user_id fk user
 task_id fk task
 title varChar
 message text 
 is_read boolean
 created_at timestamp
}

users.tenant_id <> tenant.id
tennat_config.tenant_id <> tenant.id
client_user.tenant_id <> tenant.id
client_group.tenant_id <> tenant.id
categories.tenant_id <> tenant.id
sub_categories.tenant_id <> tenant.id
task.tenant_id <> tenant.id
task_reimbursement.tenant_id <> tenant.id
task_payments.tenant_id <> tenant.id
task_history.id <> tenant.id
notifications.tenant_id <> tenant.id


client_group.user_id  > client_user.id

sub_categories.category_id > categories.id

task.assigned_to_employee_id - users.id
task.category_id - categories.id
task.client_group_id - client_group.id
task.client_user_id - client_user.id
task.subcategory_id - sub_categories.id


task_reimbursement.task_id > task.id
task_payments.task_id > task.id

task_history.changed_by_user_id - task.id
task_history.task_id - task.id
notifications.task_id - task.id
notifications.user_id - users.id


understand teh complete db setup
I have configured the supabase also with connections .
start by builiding modules from .skill folder