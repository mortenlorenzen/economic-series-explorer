test_that("read_registry reads the ten columns", {
  reg <- read_registry(fixture("registry.csv"))
  expect_equal(names(reg), registry_columns)
  expect_equal(nrow(reg), 1)
  expect_type(reg$max_stale_days, "double")
  expect_equal(reg$description, "Test description, with a comma.")
})

test_that("read_registry stops on missing or extra columns", {
  path <- withr::local_tempfile(fileext = ".csv")
  writeLines(c("id,name", "sp500,S&P 500"), path)
  expect_error(read_registry(path), "must have columns")
  writeLines(c(paste(c(registry_columns, "extra"), collapse = ","),
               "a,b,c,yahoo,d,level,none,u,7,desc,x"), path)
  expect_error(read_registry(path), "must have columns")
})

test_that("the real series.csv is a valid registry", {
  reg <- read_registry(test_path("..", "..", "series.csv"))
  expect_true("sp500" %in% reg$id)
})

test_that("validate_registry reports every problem with its row", {
  err <- tryCatch(read_registry(fixture("registry_invalid.csv")), error = conditionMessage)
  expected <- c(
    "row 2 (good): duplicate id",
    "row 3 (Bad Id): id must be lowercase",
    "row 4 (src): unknown source 'bloomberg'",
    "row 5 (knd): unknown kind 'ratio'",
    "row 6 (trf): unknown transform 'cube'",
    "row 7 (stl): max_stale_days must be a number above 0",
    "row 8 (zer): max_stale_days must be a number above 0",
    "row 9 (nam): name is empty"
  )
  for (e in expected) expect_match(err, e, fixed = TRUE)
  expect_false(grepl("row 1 ", err, fixed = TRUE))
})

test_that("clean_series drops NA and duplicate dates and sorts", {
  df <- clean_series(read_raw_fixture("sp500_raw.csv"), "sp500")
  expect_equal(format(df$date), c("1927-12-30", "1928-01-03", "1928-01-04", "1928-01-06"))
  expect_equal(df$value, c(17.66, 17.76, 17.72, 17.66))
})

test_that("clean_series stops when nothing is left", {
  df <- data.frame(date = as.Date(c("2020-01-01", "2020-01-02")), value = NA_real_)
  expect_error(clean_series(df, "empty"), "empty: no observations")
})

test_that("unsupported source and transform stop with the series id", {
  row <- read_registry(fixture("registry.csv"))[1, ]
  row$source <- "fred"
  expect_error(fetch_series(row), "sp500: unsupported source 'fred'")
  row <- read_registry(fixture("registry.csv"))[1, ]
  row$transform <- "yoy"
  expect_error(apply_transform(data.frame(), row), "sp500: unknown transform 'yoy'")
})

test_that("write_data writes the per-series file and the index", {
  row <- read_registry(fixture("registry.csv"))[1, ]
  df <- clean_series(read_raw_fixture("sp500_raw.csv"), "sp500")
  dir <- withr::local_tempdir()
  write_data(list(series_json(row, df)), dir)

  s <- jsonlite::read_json(file.path(dir, "sp500.json"), simplifyVector = TRUE)
  expect_equal(names(s), c(
    "id", "name", "category", "source", "symbol", "kind", "unit",
    "description", "first_date", "last_date", "n", "dates", "values"
  ))
  expect_equal(s$first_date, "1927-12-30")
  expect_equal(s$last_date, "1928-01-06")
  expect_equal(s$n, 4)
  expect_length(s$dates, 4)
  expect_equal(s$values, c(17.66, 17.76, 17.72, 17.66))

  idx <- jsonlite::read_json(file.path(dir, "series.json"))
  expect_length(idx, 1)
  expect_equal(idx[[1]]$id, "sp500")
  expect_equal(idx[[1]]$n, 4)
  expect_false(any(c("dates", "values") %in% names(idx[[1]])))
})

test_that("values are written with 7 significant digits", {
  path <- withr::local_tempfile(fileext = ".json")
  write_json_file(list(values = c(7744.0601, 17.66, 0.123456789)), path)
  expect_equal(readLines(path), '{"values":[7744.06,17.66,0.1234568]}')
})

test_that("a single observation is still written as arrays", {
  row <- read_registry(fixture("registry.csv"))[1, ]
  df <- data.frame(date = as.Date("2020-01-02"), value = 1.5)
  dir <- withr::local_tempdir()
  write_data(list(series_json(row, df)), dir)
  json <- readLines(file.path(dir, "sp500.json"))
  expect_match(json, '"dates":["2020-01-02"]', fixed = TRUE)
  expect_match(json, '"values":[1.5]', fixed = TRUE)
})
