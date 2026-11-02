# Fetches every series in series.csv and writes data/<id>.json and
# data/series.json. Names no series itself; everything comes from the
# registry. Run with `Rscript get_data.R`; sourcing it only defines functions.

registry_columns <- c(
  "id", "name", "category", "source", "symbol", "kind", "transform",
  "unit", "max_stale_days", "description"
)

sources <- c("yahoo", "fred")
kinds <- c("level", "rate")

# Transform functions by name, each (df) -> df. Adding one is one entry.
transforms <- list(
  none = function(df) df
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
  reg <- as.data.frame(reg)
  validate_registry(reg)
  reg$max_stale_days <- as.numeric(reg$max_stale_days)
  reg
}

# Stops with every problem in the registry at once, one line per problem.
validate_registry <- function(reg) {
  problems <- character()
  add <- function(i, msg) {
    problems[length(problems) + 1] <<- paste0("row ", i, " (", reg$id[i], "): ", msg)
  }
  dup <- duplicated(reg$id)
  stale <- suppressWarnings(as.numeric(reg$max_stale_days))
  for (i in seq_len(nrow(reg))) {
    if (!grepl("^[a-z0-9_]+$", reg$id[i])) add(i, "id must be lowercase letters, digits or _")
    if (dup[i]) add(i, "duplicate id")
    if (!reg$source[i] %in% sources) add(i, paste0("unknown source '", reg$source[i], "'"))
    if (!reg$kind[i] %in% kinds) add(i, paste0("unknown kind '", reg$kind[i], "'"))
    if (!reg$transform[i] %in% names(transforms)) {
      add(i, paste0("unknown transform '", reg$transform[i], "'"))
    }
    if (is.na(stale[i]) || stale[i] <= 0) add(i, "max_stale_days must be a number above 0")
    for (col in c("name", "category", "symbol", "unit", "description")) {
      if (trimws(reg[[col]][i]) == "") add(i, paste0(col, " is empty"))
    }
  }
  if (length(problems)) {
    stop("invalid series.csv:\n", paste(problems, collapse = "\n"), call. = FALSE)
  }
  invisible(reg)
}

# Full available history as a data frame of date and value.
fetch_series <- function(row) {
  if (row$source != "yahoo") {
    stop(row$id, ": unsupported source '", row$source, "'", call. = FALSE)
  }
  x <- quantmod::getSymbols(
    row$symbol, src = "yahoo", from = "1900-01-01", auto.assign = FALSE
  )
  adj <- quantmod::Ad(x)
  data.frame(date = zoo::index(adj), value = as.numeric(adj))
}

# Drops NA values and duplicate dates (keeping the first), sorts by date.
clean_series <- function(df, id) {
  df <- df[!is.na(df$value), ]
  df <- df[!duplicated(df$date), ]
  df <- df[order(df$date), ]
  if (nrow(df) == 0) stop(id, ": no observations after cleaning", call. = FALSE)
  rownames(df) <- NULL
  df
}

apply_transform <- function(df, row) {
  if (row$transform != "none") {
    stop(row$id, ": unknown transform '", row$transform, "'", call. = FALSE)
  }
  df
}

series_json <- function(row, df) {
  dates <- format(df$date, "%Y-%m-%d")
  list(
    id = row$id, name = row$name, category = row$category,
    source = row$source, symbol = row$symbol, kind = row$kind,
    unit = row$unit, description = row$description,
    first_date = dates[1], last_date = dates[length(dates)], n = nrow(df),
    dates = I(dates), values = I(df$value)
  )
}

write_json_file <- function(x, path) {
  json <- jsonlite::toJSON(x, auto_unbox = TRUE, digits = I(7))
  writeLines(json, path, useBytes = TRUE)
}

# Writes one file per series plus the metadata index, in registry order.
write_data <- function(series, dir = "data") {
  dir.create(dir, showWarnings = FALSE)
  for (s in series) write_json_file(s, file.path(dir, paste0(s$id, ".json")))
  meta <- lapply(series, function(s) s[setdiff(names(s), c("dates", "values"))])
  write_json_file(meta, file.path(dir, "series.json"))
}

main <- function() {
  reg <- read_registry()
  series <- lapply(seq_len(nrow(reg)), function(i) {
    row <- reg[i, ]
    df <- clean_series(fetch_series(row), row$id)
    df <- apply_transform(df, row)
    message(row$id, ": ", nrow(df), " observations, ", df$date[1], " to ",
            df$date[nrow(df)])
    series_json(row, df)
  })
  write_data(series)
}

if (sys.nframe() == 0) main()
