# Fetches every series in series.csv and writes data/<id>.json and
# data/series.json. Names no series itself; everything comes from the
# registry. Run with `Rscript get_data.R`; sourcing it only defines functions.

registry_columns <- c(
  "id", "name", "category", "source", "symbol", "kind", "transform",
  "unit", "max_stale_days", "description"
)

sources <- c("yahoo", "fred")
kinds <- c("level", "rate")
text_columns <- c("name", "category", "symbol", "unit", "description")

# Transform functions by name, each (df) -> df. Adding one is one entry.
transforms <- list(
  none = \(df) df,
  yoy = \(df) yoy(df)
)

read_registry <- function(path = "series.csv") {
  reg <- readr::read_csv(
    path,
    col_types = readr::cols(.default = "c"),
    na = character(),
    progress = FALSE
  )
  if (!identical(names(reg), registry_columns)) {
    stop(
      "series.csv must have columns ", paste(registry_columns, collapse = ", "),
      "; found ", paste(names(reg), collapse = ", "),
      call. = FALSE
    )
  }
  validate_registry(reg)
  reg |>
    dplyr::mutate(max_stale_days = as.numeric(max_stale_days))
}

# Stops with every problem in the registry at once, one line per problem.
validate_registry <- function(reg) {
  dup <- duplicated(reg$id)
  stale <- suppressWarnings(as.numeric(reg$max_stale_days))
  problems <- seq_len(nrow(reg)) |>
    purrr::map(\(i) {
      empty <- text_columns |>
        purrr::keep(\(col) trimws(reg[[col]][i]) == "")
      msgs <- c(
        if (!grepl("^[a-z0-9_]+$", reg$id[i])) "id must be lowercase letters, digits or _",
        if (dup[i]) "duplicate id",
        if (!reg$source[i] %in% sources) paste0("unknown source '", reg$source[i], "'"),
        if (!reg$kind[i] %in% kinds) paste0("unknown kind '", reg$kind[i], "'"),
        if (!reg$transform[i] %in% names(transforms)) {
          paste0("unknown transform '", reg$transform[i], "'")
        },
        if (is.na(stale[i]) || stale[i] <= 0) "max_stale_days must be a number above 0",
        paste0(empty, " is empty", recycle0 = TRUE)
      )
      sprintf("row %d (%s): %s", i, reg$id[i], msgs)
    }) |>
    purrr::list_c(ptype = character())
  if (length(problems)) {
    stop("invalid series.csv:\n", paste(problems, collapse = "\n"), call. = FALSE)
  }
  invisible(reg)
}

# Calls f() up to `tries` times, waiting `wait`, then 2 × `wait`, … between
# attempts; the last error is rethrown with the series id.
with_retry <- function(f, id, tries = 3, wait = 2) {
  for (attempt in seq_len(tries)) {
    result <- tryCatch(f(), error = \(e) e)
    if (!inherits(result, "error")) return(result)
    if (attempt < tries) Sys.sleep(wait * 2^(attempt - 1))
  }
  stop(id, ": fetch failed after ", tries, " tries: ", conditionMessage(result),
       call. = FALSE)
}

fetch_yahoo <- function(symbol) {
  adj <- quantmod::getSymbols(
    symbol, src = "yahoo", from = "1900-01-01", auto.assign = FALSE
  ) |>
    quantmod::Ad()
  tibble::tibble(date = zoo::index(adj), value = as.numeric(adj))
}

fetch_fred <- function(symbol) {
  httr2::request("https://fred.stlouisfed.org/graph/fredgraph.csv") |>
    httr2::req_url_query(id = symbol) |>
    httr2::req_perform() |>
    httr2::resp_body_string() |>
    parse_fred_csv(symbol)
}

# FRED's public CSV: observation_date,<symbol>; blank cells are missing.
parse_fred_csv <- function(text, symbol) {
  df <- readr::read_csv(
    I(text), col_types = readr::cols(.default = "c"), na = "", progress = FALSE
  )
  if (!identical(names(df), c("observation_date", symbol))) {
    stop("FRED CSV for ", symbol, " has columns ",
         paste(names(df), collapse = ", "), call. = FALSE)
  }
  df |>
    dplyr::transmute(
      date = as.Date(observation_date),
      value = as.numeric(.data[[symbol]])
    )
}

fetchers <- list(yahoo = fetch_yahoo, fred = fetch_fred)

# Full available history as a data frame of date and value.
fetch_series <- function(row, wait = 2) {
  fetch <- fetchers[[row$source]]
  if (is.null(fetch)) {
    stop(row$id, ": unsupported source '", row$source, "'", call. = FALSE)
  }
  with_retry(\() fetch(row$symbol), row$id, wait = wait)
}

# Drops NA values and duplicate dates (keeping the first), sorts by date.
clean_series <- function(df, id) {
  df <- df |>
    dplyr::filter(!is.na(value)) |>
    dplyr::distinct(date, .keep_all = TRUE) |>
    dplyr::arrange(date)
  if (nrow(df) == 0) stop(id, ": no observations after cleaning", call. = FALSE)
  df
}

apply_transform <- function(df, row) {
  transform <- transforms[[row$transform]]
  if (is.null(transform)) {
    stop(row$id, ": unknown transform '", row$transform, "'", call. = FALSE)
  }
  transform(df)
}

# Year-over-year change in percent against the same calendar date one year
# earlier; dates without that earlier observation are dropped.
yoy <- function(df) {
  df |>
    dplyr::mutate(
      earlier = as.Date(paste0(
        as.integer(format(date, "%Y")) - 1, format(date, "-%m-%d")
      ), format = "%Y-%m-%d", optional = TRUE),
      prev = value[match(earlier, date)]
    ) |>
    dplyr::filter(!is.na(prev)) |>
    dplyr::transmute(date, value = 100 * (value / prev - 1))
}

series_json <- function(row, df) {
  dates <- format(df$date, "%Y-%m-%d")
  list(
    id = row$id, name = row$name, category = row$category,
    source = row$source, symbol = row$symbol, kind = row$kind,
    unit = row$unit, description = row$description,
    first_date = dplyr::first(dates), last_date = dplyr::last(dates), n = nrow(df),
    dates = I(dates), values = I(df$value)
  )
}

write_json_file <- function(x, path) {
  jsonlite::toJSON(x, auto_unbox = TRUE, digits = I(7)) |>
    writeLines(path, useBytes = TRUE)
}

# Writes one file per series plus the metadata index, in registry order.
write_data <- function(series, dir = "data") {
  dir.create(dir, showWarnings = FALSE)
  purrr::walk(series, \(s) write_json_file(s, file.path(dir, paste0(s$id, ".json"))))
  series |>
    purrr::map(\(s) s[setdiff(names(s), c("dates", "values"))]) |>
    write_json_file(file.path(dir, "series.json"))
}

# Warns when the last observation is older than max_stale_days, fails when
# it is older than twice that.
check_staleness <- function(row, df, today) {
  age <- as.numeric(today - dplyr::last(df$date))
  if (age > 2 * row$max_stale_days) {
    stop(row$id, ": last observation is ", age, " days old (fails above ",
         2 * row$max_stale_days, ")", call. = FALSE)
  }
  if (age > row$max_stale_days) {
    warning(row$id, ": last observation is ", age, " days old (warns above ",
            row$max_stale_days, ")", call. = FALSE)
  }
  invisible(age)
}

# Fails when the new data has fewer observations than the published file.
check_regression <- function(id, n, dir = "data") {
  path <- file.path(dir, paste0(id, ".json"))
  if (!file.exists(path)) return(invisible(TRUE))
  published <- jsonlite::read_json(path)$n
  if (n < published) {
    stop(id, ": ", n, " observations, published file has ", published, call. = FALSE)
  }
  invisible(TRUE)
}

build_series <- function(row, fetch, dir, today) {
  df <- fetch(row) |>
    clean_series(row$id) |>
    apply_transform(row)
  if (nrow(df) == 0) stop(row$id, ": no observations after transform", call. = FALSE)
  check_staleness(row, df, today)
  check_regression(row$id, nrow(df), dir)
  message(row$id, ": ", nrow(df), " observations, ", dplyr::first(df$date), " to ",
          dplyr::last(df$date))
  series_json(row, df)
}

# Builds every series, collecting errors so one run reports every broken
# series; writes only when all succeed.
run_pipeline <- function(reg, fetch = fetch_series, dir = "data",
                         today = as.Date(format(Sys.time(), tz = "UTC"))) {
  results <- seq_len(nrow(reg)) |>
    purrr::map(\(i) {
      id <- reg$id[i]
      tryCatch(build_series(reg[i, ], fetch, dir, today), error = \(e) {
        msg <- conditionMessage(e)
        if (!startsWith(msg, paste0(id, ": "))) msg <- paste0(id, ": ", msg)
        simpleError(msg)
      })
    })
  failed <- purrr::map_lgl(results, \(r) inherits(r, "error"))
  if (any(failed)) {
    msgs <- purrr::map_chr(results[failed], conditionMessage)
    stop(sum(failed), " of ", nrow(reg), " series failed, nothing written:\n",
         paste(msgs, collapse = "\n"), call. = FALSE)
  }
  write_data(results, dir)
}

main <- function() {
  read_registry() |>
    run_pipeline()
}

if (sys.nframe() == 0) main()
