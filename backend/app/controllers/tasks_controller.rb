class TasksController < ApplicationController
  before_action :set_task, only: %i[ show update destroy toggle ]

  # GET /tasks
  def index
    @tasks = Task.sorted

    if params[:search].present?
      @tasks = @tasks.where("title LIKE :q OR description LIKE :q", q: "%#{params[:search]}%")
    end

    case params[:status]
    when "pending"
      @tasks = @tasks.pending
    when "completed"
      @tasks = @tasks.completed
    end

    if params[:priority].present?
      @tasks = @tasks.where(priority: params[:priority])
    end

    if params[:category].present?
      @tasks = @tasks.where(category: params[:category])
    end

    render json: @tasks
  end

  # GET /tasks/1
  def show
    render json: @task
  end

  # POST /tasks
  def create
    @task = Task.new(task_params)

    if @task.save
      render json: @task, status: :created
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /tasks/1
  def update
    if @task.update(task_params)
      render json: @task, status: :ok
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /tasks/1
  def destroy
    @task.destroy!
    head :no_content
  end

  # PATCH /tasks/1/toggle
  def toggle
    if @task.update(completed: !@task.completed)
      render json: @task, status: :ok
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /tasks/metrics
  def metrics
    @tasks = Task.all
    total = @tasks.count
    completed = @tasks.completed.count
    pending = @tasks.pending.count
    progress = total > 0 ? ((completed.to_f / total) * 100).round : 0
    high_pending = @tasks.pending.high_priority.count

    render json: {
      total: total,
      completed: completed,
      pending: pending,
      progress: progress,
      high_pending: high_pending
    }
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_task
      @task = Task.find(params[:id])
    end

    # Only allow a list of trusted parameters through.
    def task_params
      params.require(:task).permit(:title, :description, :completed, :due_date, :priority, :category)
    end
end
