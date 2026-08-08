class CreateTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :tasks do |t|
      t.string :title
      t.text :description
      t.boolean :completed
      t.date :due_date
      t.string :priority
      t.string :category

      t.timestamps
    end
  end
end
