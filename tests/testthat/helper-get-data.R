source(test_path("..", "..", "get_data.R"))

fixture <- function(name) test_path("..", "fixtures", name)

read_raw_fixture <- function(name) {
  df <- utils::read.csv(fixture(name), colClasses = c("Date", "numeric"))
  df
}
