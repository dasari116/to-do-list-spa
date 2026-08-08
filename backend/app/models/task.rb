class Task < ApplicationRecord
  belongs_to :user

  validates :title, presence: true
  validates :priority, presence: true, inclusion: { in: %w[Low Medium High], message: "%{value} is not a valid priority" }
  validates :category, presence: true
  validates :status, presence: true, inclusion: { in: %w[todo in_progress completed], message: "%{value} is not a valid status" }

  scope :completed, -> { where(completed: true) }
  scope :pending, -> { where(completed: [false, nil]) }
  scope :high_priority, -> { where(priority: 'High') }
  scope :sorted, -> { order(due_date: :asc, created_at: :desc) }

  before_validation :sync_status_and_completed
  before_validation :set_defaults, on: :create

  private

  def sync_status_and_completed
    self.status = 'todo' if status.blank?

    if completed_changed?
      if completed
        self.status = 'completed'
      else
        self.status = 'todo' if status == 'completed'
      end
    elsif status_changed?
      if status == 'completed'
        self.completed = true
      else
        self.completed = false
      end
    end
  end

  def set_defaults
    self.completed = false if completed.nil?
    self.priority = 'Medium' if priority.blank?
    self.category = 'General' if category.blank?
  end
end
