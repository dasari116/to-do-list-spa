class ApplicationController < ActionController::API
  def current_user
    @current_user ||= authenticate_token
  end

  def logged_in?
    current_user.present?
  end

  def require_login!
    unless logged_in?
      render json: { error: 'Unauthorized access. Please log in.' }, status: :unauthorized
    end
  end

  private

  def authenticate_token
    header = request.headers['Authorization']
    return nil if header.blank?

    token = header.split(' ').last
    User.find_by(token: token)
  end
end
