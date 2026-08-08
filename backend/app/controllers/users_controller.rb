class UsersController < ApplicationController
  def create
    user = User.new(user_params)
    if user.save
      render json: { token: user.token, username: user.username }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:username, :password)
  end
end
