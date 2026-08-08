class AddUserAndStatusToTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :username, null: false
      t.string :password_digest, null: false
      t.string :token, null: false

      t.timestamps
    end

    add_index :users, :username, unique: true
    add_index :users, :token, unique: true

    add_reference :tasks, :user, foreign_key: true, null: true
    add_column :tasks, :status, :string, default: 'todo', null: false
  end
end
