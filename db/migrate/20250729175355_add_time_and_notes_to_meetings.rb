class AddTimeAndNotesToMeetings < ActiveRecord::Migration[8.0]
  def change
    add_column :meetings, :meetingTime, :string
    add_column :meetings, :notes, :string
  end
end
