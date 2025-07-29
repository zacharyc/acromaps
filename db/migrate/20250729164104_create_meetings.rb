class CreateMeetings < ActiveRecord::Migration[8.0]
  
  def change
    create_table :meetings do |t|
      t.string :title
      t.text :description
      t.datetime :start_time
      t.datetime :end_time

      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6
      t.string :location

      t.timestamps
    end
  end
end
