# Fetches every series in series.csv and writes data/<id>.json and
# data/series.json. Names no series itself; everything comes from the
# registry. Run with `Rscript get_data.R`; sourcing it only defines functions.

registry_columns <- c(
  "id", "name", "category", "source", "symbol", "kind", "transform",
  "unit", "max_stale_days", "description"
)

read_registry <- function(path = "series.csv") {
  reg <- readr::read_csv(
    path,
    col_types = readr::cols(.default = "c"),
    progress = FALSE
  )
  if (!identical(names(reg), registry_columns)) {
    stop(
      "series.csv must have columns ", paste(registry_columns, collapse = ", "),
      "; found ", paste(names(reg), collapse = ", "),
      call. = FALSE
    )
  }
  reg$max_stale_days <- as.numeric(reg$max_stale_days)
  as.data.frame(reg)
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
    dates = dates, values = df$value
  )
}

write_json_file <- function(x, path) {
  json <- jsonlite::toJSON(x, auto_unbox = TRUE, digits = 4)
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
