class SessionsController < ApplicationController
  def create
    user = User.find_by("LOWER(username) = ?", params[:username].to_s.strip.downcase)
    if user&.authenticate(params[:password])
      render json: { token: user.token, username: user.username }, status: :ok
    else
      render json: { error: 'Invalid username or password' }, status: :unauthorized
    end
  end
end
