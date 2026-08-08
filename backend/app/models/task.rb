class Task < ApplicationRecord
  validates :title, presence: true
  validates :priority, presence: true, inclusion: { in: %w[Low Medium High], message: "%{value} is not a valid priority" }
  validates :category, presence: true

  scope :completed, -> { where(completed: true) }
  scope :pending, -> { where(completed: [false, nil]) }
  scope :high_priority, -> { where(priority: 'High') }
  scope :sorted, -> { order(due_date: :asc, created_at: :desc) }

  before_validation :set_defaults, on: :create

  private

  def set_defaults
    self.completed = false if completed.nil?
    self.priority = 'Medium' if priority.blank?
    self.category = 'General' if category.blank?
  end
end
