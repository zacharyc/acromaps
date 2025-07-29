require "test_helper"

class MettingsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get mettings_index_url
    assert_response :success
  end

  test "should get show" do
    get mettings_show_url
    assert_response :success
  end

  test "should get new" do
    get mettings_new_url
    assert_response :success
  end

  test "should get create" do
    get mettings_create_url
    assert_response :success
  end

  test "should get edit" do
    get mettings_edit_url
    assert_response :success
  end

  test "should get update" do
    get mettings_update_url
    assert_response :success
  end

  test "should get destroy" do
    get mettings_destroy_url
    assert_response :success
  end
end
