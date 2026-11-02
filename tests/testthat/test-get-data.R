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
  expect_equal(reg$id, c(
    "sp500", "djia", "nasdaq", "dxy", "gdp", "housing", "inflation",
    "unemployment", "labor_participation", "treasury10yr", "debt_gdp"
  ))
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
  row$source <- "bloomberg"
  expect_error(fetch_series(row), "sp500: unsupported source 'bloomberg'")
  row <- read_registry(fixture("registry.csv"))[1, ]
  row$transform <- "cube"
  expect_error(apply_transform(data.frame(), row), "sp500: unknown transform 'cube'")
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

test_that("parse_fred_csv reads dates and values, blank as NA", {
  text <- paste(readLines(fixture("fred_dgs10.csv")), collapse = "\n")
  df <- parse_fred_csv(text, "DGS10")
  expect_s3_class(df$date, "Date")
  expect_equal(format(df$date), c("1962-01-04", "1962-01-02", "1962-02-12", "1962-01-03"))
  expect_equal(df$value, c(3.99, 4.06, NA, 4.03))
  expect_equal(nrow(clean_series(df, "treasury10yr")), 3)
})

test_that("parse_fred_csv stops on a header for another symbol", {
  expect_error(parse_fred_csv("observation_date,UNRATE\n1948-01-01,3.4", "DGS10"),
               "FRED CSV for DGS10 has columns observation_date, UNRATE")
})

test_that("with_retry succeeds after transient failures", {
  calls <- 0
  f <- function() {
    calls <<- calls + 1
    if (calls < 3) stop("timeout")
    "ok"
  }
  expect_equal(with_retry(f, "x", wait = 0), "ok")
  expect_equal(calls, 3)
})

test_that("with_retry gives up after three tries with the id and last error", {
  calls <- 0
  f <- function() {
    calls <<- calls + 1
    stop("HTTP 503")
  }
  expect_error(with_retry(f, "gdp", wait = 0), "gdp: fetch failed after 3 tries: HTTP 503")
  expect_equal(calls, 3)
})

cpi_fixture <- function() {
  text <- paste(readLines(fixture("fred_cpiaucsl.csv")), collapse = "\n")
  clean_series(parse_fred_csv(text, "CPIAUCSL"), "inflation")
}

test_that("transform none passes the data through", {
  df <- cpi_fixture()
  row <- list(id = "x", transform = "none")
  expect_identical(apply_transform(df, row), df)
})

test_that("yoy on monthly data starts a year later, in percent", {
  df <- cpi_fixture()
  expect_equal(nrow(df), 25)
  out <- apply_transform(df, list(id = "inflation", transform = "yoy"))
  expect_equal(nrow(out), 13)
  expect_equal(out$date[1], as.Date("2024-01-01"))
  expect_equal(out$date[13], as.Date("2025-01-01"))
  expect_equal(out$value[1], 100 * (df$value[13] / df$value[1] - 1))
  expect_equal(out$value[13], 100 * (df$value[25] / df$value[13] - 1))
})

test_that("yoy drops dates without an observation one year earlier", {
  df <- data.frame(
    date = as.Date(c("2020-01-01", "2020-03-01", "2021-01-01", "2021-02-01", "2021-03-01")),
    value = c(100, 200, 110, 120, 210)
  )
  out <- yoy(df)
  expect_equal(format(out$date), c("2021-01-01", "2021-03-01"))
  expect_equal(out$value, c(10, 5))
})

test_that("yoy drops 29 February, which has no date a year earlier", {
  df <- data.frame(date = as.Date(c("2023-02-28", "2024-02-28", "2024-02-29")),
                   value = c(100, 102, 103))
  expect_equal(format(yoy(df)$date), "2024-02-28")
})

test_that("check_staleness passes, warns, then fails at twice the limit", {
  row <- list(id = "gdp", max_stale_days = 10)
  df <- data.frame(date = as.Date("2026-01-01"), value = 1)
  expect_silent(check_staleness(row, df, as.Date("2026-01-11")))
  expect_warning(check_staleness(row, df, as.Date("2026-01-12")),
                 "gdp: last observation is 11 days old")
  expect_warning(check_staleness(row, df, as.Date("2026-01-21")), "20 days old")
  expect_error(check_staleness(row, df, as.Date("2026-01-22")),
               "gdp: last observation is 21 days old \\(fails above 20\\)")
})

test_that("check_regression fails on fewer observations than published", {
  dir <- withr::local_tempdir()
  writeLines('{"id":"sp500","n":10}', file.path(dir, "sp500.json"))
  expect_error(check_regression("sp500", 9, dir),
               "sp500: 9 observations, published file has 10")
  expect_silent(check_regression("sp500", 10, dir))
  expect_silent(check_regression("sp500", 11, dir))
  expect_silent(check_regression("new_series", 1, dir))
})

pipeline_registry <- function() {
  data.frame(
    id = c("a", "b"), name = c("A", "B"), category = "Markets", source = "yahoo",
    symbol = c("A", "B"), kind = "level", transform = "none", unit = "Index points",
    max_stale_days = 7, description = "Test."
  )
}

fake_fetch <- function(row) {
  if (row$symbol == "B-broken") stop("HTTP 404")
  data.frame(date = as.Date(c("2026-01-01", "2026-01-02")), value = c(1, 2))
}

test_that("run_pipeline writes every series when all succeed", {
  dir <- withr::local_tempdir()
  run_pipeline(pipeline_registry(), fake_fetch, dir, today = as.Date("2026-01-03"))
  expect_setequal(list.files(dir), c("a.json", "b.json", "series.json"))
})

test_that("run_pipeline writes nothing and names every failed series", {
  dir <- withr::local_tempdir()
  run_pipeline(pipeline_registry(), fake_fetch, dir, today = as.Date("2026-01-03"))
  before <- tools::md5sum(list.files(dir, full.names = TRUE))

  reg <- pipeline_registry()
  reg$symbol[2] <- "B-broken"
  err <- tryCatch(
    run_pipeline(reg, fake_fetch, dir, today = as.Date("2026-03-01")),
    error = conditionMessage
  )
  expect_match(err, "2 of 2 series failed, nothing written")
  expect_match(err, "a: last observation is 58 days old", fixed = TRUE)
  expect_match(err, "HTTP 404", fixed = TRUE)
  expect_equal(tools::md5sum(list.files(dir, full.names = TRUE)), before)
})
