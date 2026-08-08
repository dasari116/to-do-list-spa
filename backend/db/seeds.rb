# Clear existing database
Task.destroy_all
User.destroy_all

# Create default demo user
user = User.create!(
  username: 'demouser',
  password: 'password123',
  password_confirmation: 'password123'
)

puts "Created demo user: #{user.username} with token: #{user.token}"

# Categories and Priorities helper arrays
categories = ['Work', 'Personal', 'Shopping', 'Finance', 'Health', 'General']

# Seed 15 Completed Tasks
15.times do |i|
  Task.create!(
    user: user,
    title: "Completed Task ##{i + 1}",
    description: "This is a completed task description for task ##{i + 1}.",
    status: 'completed',
    priority: ['Low', 'Medium', 'High'].sample,
    category: categories.sample,
    due_date: Date.today - (i % 5)
  )
end

# Seed 7 Pending Tasks (Not Overdue)
# We can make some 'todo' and some 'in_progress', with due dates today or in the future
7.times do |i|
  due_offset = i % 3 # 0, 1, 2
  due_date = due_offset == 0 ? Date.today : Date.today + due_offset
  status = i.even? ? 'todo' : 'in_progress'
  priority = ['Low', 'Medium', 'High'][i % 3]
  category = categories[i % categories.length]

  Task.create!(
    user: user,
    title: "Pending Task ##{i + 1}",
    description: "This is a pending task description for task ##{i + 1}.",
    status: status,
    priority: priority,
    category: category,
    due_date: due_date
  )
end

# Seed 3 Overdue Tasks
# Status 'todo' or 'in_progress' with due date in the past
3.times do |i|
  due_date = Date.today - (i + 1) # yesterday, day before, etc.
  status = i.even? ? 'todo' : 'in_progress'
  priority = ['Medium', 'High'][i % 2]
  category = categories[(i + 3) % categories.length]

  Task.create!(
    user: user,
    title: "Overdue Task ##{i + 1}",
    description: "This task was due in the past and is overdue ##{i + 1}.",
    status: status,
    priority: priority,
    category: category,
    due_date: due_date
  )
end

puts "Database successfully seeded!"
puts "Total tasks: #{user.tasks.count}"
puts "Completed tasks: #{user.tasks.completed.count}"
puts "Pending tasks: #{user.tasks.pending.count}"
puts "Overdue tasks: #{user.tasks.pending.where('due_date < ?', Date.today).count}"
