class User < ApplicationRecord
  has_secure_password

  has_many :tasks, dependent: :destroy

  validates :username, presence: true, uniqueness: { case_sensitive: false }
  validates :password, presence: true, length: { minimum: 6 }, on: :create

  before_create :generate_token

  private

  def generate_token
    loop do
      self.token = SecureRandom.hex(24)
      break unless User.exists?(token: token)
    end
  end
end
